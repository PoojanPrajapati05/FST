import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

// GET /api/audit-logs — ADMIN only
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const action = searchParams.get("action") ?? undefined;

    const logs = await prisma.auditLog.findMany({
      where: action ? { action } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ logs, count: logs.length }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/audit-logs]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
