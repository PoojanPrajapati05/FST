import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { SettleUpModal } from "@/components/settlements/settle-up-modal";
import { FilterPanel } from "@/components/expenses/filter-panel";
import { ExpenseListView, SerializedExpense } from "@/components/expenses/expense-list-view";
import {
  calculateGroupBalances,
  simplifyDebts,
  formatPaiseToINR,
} from "@/lib/settle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Handshake,
  Receipt,
  Scale,
  Users,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: group ? `${group.name} — SplitEase` : "Group — SplitEase",
  };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  // Defense in depth: Check if group exists and user is a registered member
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      expenses: {
        include: {
          paidBy: {
            select: { id: true, name: true },
          },
          shares: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      },
      settlements: {
        include: {
          payer: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Verify user is a member of this group
  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) {
    redirect("/dashboard?error=not_a_group_member");
  }

  // 1. Calculate server-side net balance per member
  const balanceMap = calculateGroupBalances(
    group.members,
    group.expenses,
    group.settlements
  );

  // 2. Greedy Debt Simplification Algorithm
  const simplifiedTransactions = simplifyDebts(balanceMap);

  // Total group spending
  const totalSpentPaise = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Current user's net status in this group
  const myNetBalance = balanceMap.get(user.id)?.netBalance || 0;

  // Format serializable expenses for the client view
  const serializedExpenses: SerializedExpense[] = group.expenses.map((exp) => ({
    id: exp.id,
    groupId: exp.groupId,
    groupName: group.name,
    description: exp.description,
    category: exp.category,
    amount: exp.amount,
    splitType: exp.splitType,
    date: exp.date.toISOString(),
    paidById: exp.paidById,
    paidByName: exp.paidBy.name,
    shares: exp.shares.map((s) => ({
      userId: s.userId,
      userName: s.user.name,
      amount: s.amount,
      percentage: s.percentage,
    })),
  }));

  const membersList = group.members.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {group.name}
          </span>
        </div>

        {/* Group Header Hero */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {group.name}
              </h1>
              <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
                {group.members.length} Members
              </Badge>
            </div>

            {group.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {group.description}
              </p>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                Total Group Spending:{" "}
                <strong className="text-slate-900 dark:text-slate-100 font-bold">
                  {formatPaiseToINR(totalSpentPaise)}
                </strong>
              </span>
              <span>•</span>
              <span>
                Your Standing:{" "}
                <strong
                  className={
                    myNetBalance > 0
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : myNetBalance < 0
                      ? "text-red-600 dark:text-red-400 font-bold"
                      : "text-slate-600 dark:text-slate-300 font-bold"
                  }
                >
                  {myNetBalance > 0
                    ? `+${formatPaiseToINR(myNetBalance)} (you are owed)`
                    : myNetBalance < 0
                    ? `${formatPaiseToINR(myNetBalance)} (you owe)`
                    : "Settled up"}
                </strong>
              </span>
            </div>
          </div>

          {/* Action Modals */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SettleUpModal
              groupId={group.id}
              currentUserId={user.id}
              members={membersList}
              suggestedDebts={simplifiedTransactions}
            />
            <AddExpenseModal
              groupId={group.id}
              currentUserId={user.id}
              members={membersList}
            />
          </div>
        </div>

        {/* Tabbed Views */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid grid-cols-4 max-w-lg bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-xl">
            <TabsTrigger value="expenses" className="text-xs sm:text-sm font-medium">
              Expenses ({group.expenses.length})
            </TabsTrigger>
            <TabsTrigger value="balances" className="text-xs sm:text-sm font-medium">
              Settle Plan ({simplifiedTransactions.length})
            </TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs sm:text-sm font-medium">
              History ({group.settlements.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm font-medium">
              Members ({group.members.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EXPENSES */}
          <TabsContent value="expenses" className="space-y-4">
            <FilterPanel showGroupSelect={false} />
            <ExpenseListView
              initialExpenses={serializedExpenses}
              currentUserId={user.id}
              showGroupName={false}
            />
          </TabsContent>

          {/* TAB 2: BALANCES & GREEDY SIMPLIFIED SETTLE PLAN */}
          <TabsContent value="balances" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Member Net Balances Card */}
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span>Member Net Balances</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Individual ledger balance considering all expenses and payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from(balanceMap.values()).map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {getInitials(b.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {b.userName} {b.userId === user.id ? "(You)" : ""}
                          </p>
                          <p className="text-xs text-slate-400">
                            Paid: {formatPaiseToINR(b.totalPaid)} • Share: {formatPaiseToINR(b.totalOwed)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            b.netBalance > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : b.netBalance < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {b.netBalance > 0 ? `+${formatPaiseToINR(b.netBalance)}` : formatPaiseToINR(b.netBalance)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {b.netBalance > 0 ? "gets back" : b.netBalance < 0 ? "owes group" : "settled"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Greedy Simplified Debt Plan Card */}
              <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Optimized Settlement Plan</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Greedy algorithm eliminates circular debt to minimize total cash transfers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {simplifiedTransactions.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Everyone is completely settled!
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        No outstanding debts remain in this group.
                      </p>
                    </div>
                  ) : (
                    simplifiedTransactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-950 dark:bg-emerald-950/20"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {tx.fromUserName} {tx.fromUserId === user.id ? "(You)" : ""}
                          </span>
                          <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {tx.toUserName} {tx.toUserId === user.id ? "(You)" : ""}
                          </span>
                        </div>

                        <div className="text-right font-black text-sm text-emerald-700 dark:text-emerald-400">
                          {formatPaiseToINR(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: SETTLEMENT HISTORY */}
          <TabsContent value="settlements" className="space-y-3">
            {group.settlements.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
                <Handshake className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-base font-semibold">No settlements recorded yet</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Use the &quot;Settle Up&quot; button above when someone pays back their share.
                </p>
              </div>
            ) : (
              group.settlements.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/90 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Handshake className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {st.payer.name} paid {st.receiver.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>
                          {new Date(st.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {st.note && <span>• &ldquo;{st.note}&rdquo;</span>}
                      </div>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPaiseToINR(st.amount)}
                  </span>
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB 4: MEMBERS */}
          <TabsContent value="members" className="space-y-3">
            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Group Participants</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="font-semibold text-xs bg-slate-200 dark:bg-slate-800">
                          {getInitials(m.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {m.user.name} {m.user.id === user.id ? "(You)" : ""}
                        </p>
                        <p className="text-xs text-slate-400">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {m.role}
                      </Badge>
                      {m.user.role === "ADMIN" && (
                        <Badge variant="default" className="text-xs bg-amber-600 hover:bg-amber-600">
                          App Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
