import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations/transaction";
import { TransactionType, TransactionStatus } from "@prisma/client";

// GET /api/transactions — requires auth; ADMIN sees all, MEMBER sees own
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const cursor = searchParams.get("cursor") ?? undefined;

    const transactions = await prisma.transaction.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return NextResponse.json(
      { transactions, count: transactions.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/transactions — requires auth, Zod validated, atomic Prisma transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { userId, type, status, amount, description, reference, metadata } = parsed.data;

    // Non-admins can only create transactions for themselves
    if (session.user.role !== "ADMIN" && userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only create transactions for yourself" },
        { status: 403 }
      );
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Atomic: create Transaction + AuditLog in a single DB transaction
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: type as TransactionType,
          status: (status ?? "PENDING") as TransactionStatus,
          amount,
          description,
          reference: reference ?? null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "TRANSACTION_CREATED",
          entityType: "TRANSACTION",
          entityId: transaction.id,
          metadata: { type, amount, description, targetUserId: userId },
        },
      });

      return transaction;
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
