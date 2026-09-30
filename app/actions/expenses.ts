"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  expenseFormSchema,
  ExpenseFormValues,
  computeServerExpenseShares,
} from "@/lib/validations/expense";
import { sendExpenseNotification } from "@/lib/email";
import { formatPaiseToINR } from "@/lib/settle";

export async function addExpenseAction(rawInput: ExpenseFormValues) {
  // 1. Session verification (Defense in depth: never rely solely on proxy)
  const user = await requireUser();

  // 2. Validate input schema
  const validated = expenseFormSchema.parse(rawInput);
  const {
    groupId,
    description,
    amountRupees,
    category,
    paidById,
    splitType,
    participantUserIds,
    exactSharesRupees,
    percentShares,
    date,
  } = validated;

  // 3. Verify user membership in group
  const userMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!userMembership) {
    throw new Error("Forbidden: You must be a member of this group to add expenses.");
  }

  // Verify payer is also in the group
  const payerMembership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: paidById,
      },
    },
    include: {
      user: true,
    },
  });

  if (!payerMembership) {
    throw new Error("Invalid payer: Selected payer is not a member of this group.");
  }

  // 4. Convert money to integer paise and re-calculate all shares on server
  const amountPaise = Math.round(amountRupees * 100);

  // Convert exact shares rupees to paise if provided
  const exactSharesPaise: Record<string, number> = {};
  if (exactSharesRupees) {
    for (const [uid, r] of Object.entries(exactSharesRupees)) {
      exactSharesPaise[uid] = Math.round((r || 0) * 100);
    }
  }

  // Server re-computes all shares — never trust client math
  const computedShares = computeServerExpenseShares(
    amountPaise,
    splitType,
    participantUserIds,
    exactSharesPaise,
    percentShares
  );

  // 5. Atomic transaction: Expense + Shares + AuditLog
  const createdExpense = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        paidById,
        description,
        category,
        amount: amountPaise,
        splitType,
        date: date ? new Date(date) : new Date(),
        shares: {
          create: computedShares.map((s) => ({
            userId: s.userId,
            amount: s.amountPaise,
            percentage: s.percentage,
          })),
        },
      },
      include: {
        shares: true,
        group: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        groupId,
        action: "EXPENSE_CREATED",
        entityType: "EXPENSE",
        entityId: expense.id,
        metadata: {
          description,
          amountPaise,
          splitType,
          payerId: paidById,
          participantCount: computedShares.length,
        },
      },
    });

    return expense;
  });

  // 6. Non-blocking email dispatch (After successful DB mutation)
  try {
    const participants = await prisma.user.findMany({
      where: {
        id: { in: participantUserIds },
      },
    });

    for (const participant of participants) {
      // Don't spam the payer if they are in participants
      if (participant.id !== paidById) {
        const share = computedShares.find((s) => s.userId === participant.id);
        const userShareStr = share ? formatPaiseToINR(share.amountPaise) : formatPaiseToINR(0);

        sendExpenseNotification({
          to: participant.email,
          payerName: payerMembership.user.name,
          groupName: createdExpense.group.name,
          description,
          totalAmountRupees: formatPaiseToINR(amountPaise),
          userShareRupees: userShareStr,
          groupId,
        }).catch((e) => console.error("Email dispatch failed:", e));
      }
    }
  } catch (err) {
    console.error("Non-blocking expense email notification error:", err);
  }

  // 7. Revalidate paths
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    expenseId: createdExpense.id,
  };
}
