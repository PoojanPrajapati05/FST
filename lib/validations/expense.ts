import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRAVEL",
  "UTILITIES",
  "ENTERTAINMENT",
  "SHOPPING",
  "ACCOMMODATION",
  "GENERAL",
] as const;

export const expenseFormSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  description: z.string().trim().min(2, "Description must be at least 2 characters").max(100, "Description is too long"),
  amountRupees: z.number().positive("Amount must be greater than zero").max(1000000, "Amount exceeds ₹10,00,000 limit"),
  category: z.enum(EXPENSE_CATEGORIES).default("GENERAL"),
  paidById: z.string().min(1, "Please select who paid"),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENT"]).default("EQUAL"),
  participantUserIds: z
    .array(z.string())
    .min(1, "Select at least one participant for the expense"),
  // Optional custom share maps:
  exactSharesRupees: z.record(z.string(), z.number()).optional(),
  percentShares: z.record(z.string(), z.number()).optional(),
  date: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export interface ComputedShare {
  userId: string;
  amountPaise: number;
  percentage?: number;
}

/**
 * Server-authoritative share computation.
 * Guarantees that the sum of all computed shares strictly equals totalAmountPaise.
 */
export function computeServerExpenseShares(
  totalAmountPaise: number,
  splitType: "EQUAL" | "EXACT" | "PERCENT",
  participantUserIds: string[],
  exactSharesPaise?: Record<string, number>,
  percentShares?: Record<string, number>
): ComputedShare[] {
  if (participantUserIds.length === 0) {
    throw new Error("At least one participant is required to split the expense.");
  }

  const shares: ComputedShare[] = [];

  if (splitType === "EQUAL") {
    const count = participantUserIds.length;
    const baseShare = Math.floor(totalAmountPaise / count);
    const remainder = totalAmountPaise - baseShare * count;

    for (let i = 0; i < count; i++) {
      // Allocate leftover 1-paisa units to the first 'remainder' participants
      const extra = i < remainder ? 1 : 0;
      shares.push({
        userId: participantUserIds[i],
        amountPaise: baseShare + extra,
        percentage: Number(((1 / count) * 100).toFixed(2)),
      });
    }
  } else if (splitType === "EXACT") {
    if (!exactSharesPaise) {
      throw new Error("Exact shares breakdown must be provided.");
    }

    let runningSum = 0;
    for (const userId of participantUserIds) {
      const share = exactSharesPaise[userId] || 0;
      if (share < 0) throw new Error("Share amount cannot be negative.");
      runningSum += share;
      shares.push({
        userId,
        amountPaise: share,
        percentage: totalAmountPaise > 0 ? Number(((share / totalAmountPaise) * 100).toFixed(2)) : 0,
      });
    }

    if (runningSum !== totalAmountPaise) {
      const diffRupees = ((totalAmountPaise - runningSum) / 100).toFixed(2);
      throw new Error(
        `The sum of exact shares (₹${(runningSum / 100).toFixed(2)}) does not match the expense amount (₹${(totalAmountPaise / 100).toFixed(2)}). Difference: ₹${diffRupees}`
      );
    }
  } else if (splitType === "PERCENT") {
    if (!percentShares) {
      throw new Error("Percentage shares breakdown must be provided.");
    }

    let totalPct = 0;
    for (const userId of participantUserIds) {
      const pct = percentShares[userId] || 0;
      if (pct < 0) throw new Error("Percentage cannot be negative.");
      totalPct += pct;
    }

    // Allow a tiny floating-point tolerance on percentage sum
    if (Math.abs(totalPct - 100) > 0.05) {
      throw new Error(`Total percentage shares must equal 100%. Current sum: ${totalPct.toFixed(2)}%`);
    }

    let allocatedPaise = 0;
    for (let i = 0; i < participantUserIds.length; i++) {
      const userId = participantUserIds[i];
      const pct = percentShares[userId] || 0;
      let sharePaise = Math.round((pct / 100) * totalAmountPaise);

      // On the last participant, adjust to absorb any rounding residue
      if (i === participantUserIds.length - 1) {
        sharePaise = totalAmountPaise - allocatedPaise;
      }

      allocatedPaise += sharePaise;
      shares.push({
        userId,
        amountPaise: sharePaise,
        percentage: pct,
      });
    }
  }

  // Safety assert
  const totalShares = shares.reduce((acc, s) => acc + s.amountPaise, 0);
  if (totalShares !== totalAmountPaise) {
    throw new Error(`Integrity error: shares sum (₹${totalShares / 100}) does not equal total (₹${totalAmountPaise / 100})`);
  }

  return shares;
}
