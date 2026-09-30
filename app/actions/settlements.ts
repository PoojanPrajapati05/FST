"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendSettlementNotification } from "@/lib/email";
import { formatPaiseToINR } from "@/lib/settle";

interface RecordSettlementParams {
  groupId: string;
  receiverId: string;
  amountRupees: number;
  note?: string;
}

export async function recordSettlementAction({
  groupId,
  receiverId,
  amountRupees,
  note,
}: RecordSettlementParams) {
  // 1. Session verification
  const user = await requireUser();

  if (user.id === receiverId) {
    throw new Error("You cannot record a settlement to yourself.");
  }

  if (!amountRupees || amountRupees <= 0) {
    throw new Error("Settlement amount must be greater than zero.");
  }

  // 2. Verify membership of both parties
  const [payerMembership, receiverMembership] = await Promise.all([
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
      include: {
        user: true,
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: receiverId,
        },
      },
      include: {
        user: true,
      },
    }),
  ]);

  if (!payerMembership) {
    throw new Error("Forbidden: You are not a member of this group.");
  }

  if (!receiverMembership) {
    throw new Error("Recipient is not a member of this group.");
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true },
  });

  if (!group) {
    throw new Error("Group not found.");
  }

  const amountPaise = Math.round(amountRupees * 100);

  // 3. Atomic transaction: Settlement + AuditLog
  const settlement = await prisma.$transaction(async (tx) => {
    const record = await tx.settlement.create({
      data: {
        groupId,
        payerId: user.id,
        receiverId,
        amount: amountPaise,
        note: note?.trim() || null,
        date: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        groupId,
        action: "SETTLEMENT_RECORDED",
        entityType: "SETTLEMENT",
        entityId: record.id,
        metadata: {
          payerId: user.id,
          receiverId,
          amountPaise,
          note: note?.trim() || null,
        },
      },
    });

    return record;
  });

  // 4. Non-blocking email dispatch
  try {
    sendSettlementNotification({
      to: receiverMembership.user.email,
      payerName: payerMembership.user.name,
      receiverName: receiverMembership.user.name,
      groupName: group.name,
      amountRupees: formatPaiseToINR(amountPaise),
      note: note?.trim(),
      groupId,
    }).catch((e) => console.error("Settlement email dispatch failed:", e));
  } catch (err) {
    console.error("Non-blocking settlement notification error:", err);
  }

  // 5. Revalidation
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");

  return {
    success: true,
    settlementId: settlement.id,
  };
}
