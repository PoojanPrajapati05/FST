import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatPaiseToINR } from "@/lib/settle";

export const runtime = "nodejs";
export const alt = "SplitEase Group Expense Overview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let groupName = "Expense Group";
  let memberCount = 0;
  let totalSpentRupees = "₹0.00";

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
        expenses: {
          select: {
            amount: true,
          },
        },
      },
    });

    if (group) {
      groupName = group.name;
      memberCount = group.members.length;
      const totalPaise = group.expenses.reduce((sum, e) => sum + e.amount, 0);
      totalSpentRupees = formatPaiseToINR(totalPaise);
    }
  } catch (err) {
    console.error("Error generating OG image:", err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            ⚡
          </div>
          <span style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Split<span style={{ color: "#60a5fa" }}>Ease</span>
          </span>
          <span
            style={{
              marginLeft: "16px",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              color: "#93c5fd",
              padding: "4px 14px",
              borderRadius: "999px",
              fontSize: "16px",
              fontWeight: "600",
              border: "1px solid rgba(59, 130, 246, 0.4)",
            }}
          >
            Group Summary
          </span>
        </div>

        {/* Center: Group Title & Total Spent */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "20px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "2px" }}>
            Group Expense Ledger
          </span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              lineHeight: "1.1",
              margin: 0,
              color: "#f8fafc",
            }}
          >
            {groupName}
          </h1>

          <div style={{ display: "flex", alignItems: "baseline", gap: "20px", marginTop: "12px" }}>
            <span style={{ fontSize: "64px", fontWeight: "900", color: "#38bdf8" }}>
              {totalSpentRupees}
            </span>
            <span style={{ fontSize: "24px", color: "#94a3b8", fontWeight: "500" }}>
              total spent across all members
            </span>
          </div>
        </div>

        {/* Bottom Bar: Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "28px",
          }}
        >
          <div style={{ display: "flex", gap: "36px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", color: "#94a3b8" }}>Members Active</span>
              <span style={{ fontSize: "28px", fontWeight: "700", color: "#ffffff" }}>
                {memberCount} friends
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", color: "#94a3b8" }}>Debt Settlement</span>
              <span style={{ fontSize: "28px", fontWeight: "700", color: "#4ade80" }}>
                Greedy Optimized
              </span>
            </div>
          </div>

          <span style={{ fontSize: "18px", color: "#64748b" }}>
            splitease.app/groups/{id.substring(0, 8)}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
