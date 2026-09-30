import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, requireRole } from "@/lib/auth";
import { z } from "zod";
import { Role } from "@prisma/client";

// GET /api/users — ADMIN only
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { groupMemberships: true, paidExpenses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users, count: users.length }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/users]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users — ADMIN only, Zod validated
const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 chars").max(50),
  email: z.string().trim().email("Invalid email"),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { name, email, role } = parsed.data;

    // Check for duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, email, role: role as Role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_CREATED_VIA_API",
        entityType: "USER",
        entityId: user.id,
        metadata: { name, email, role },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
