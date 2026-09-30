import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { FilterPanel } from "@/components/expenses/filter-panel";
import { ExpenseListView, SerializedExpense } from "@/components/expenses/expense-list-view";
import { calculateGroupBalances, formatPaiseToINR } from "@/lib/settle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  ChevronRight,
  Receipt,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Dashboard — SplitEase",
  description: "View your shared balances, active groups, and recent expenses.",
};

export default async function DashboardPage() {
  const user = await requireUser();

  // Fetch groups where the user is a member
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
          settlements: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => m.group);

  // Calculate user's aggregate balances across all groups
  let totalOwedToUserPaise = 0; // Positive (others owe user)
  let totalUserOwesPaise = 0;   // Negative (user owes others)

  const groupCardData = groups.map((group) => {
    const balanceMap = calculateGroupBalances(
      group.members,
      group.expenses,
      group.settlements
    );
    const myBalance = balanceMap.get(user.id)?.netBalance || 0;

    if (myBalance > 0) {
      totalOwedToUserPaise += myBalance;
    } else if (myBalance < 0) {
      totalUserOwesPaise += Math.abs(myBalance);
    }

    const totalGroupSpentPaise = group.expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group.members.length,
      members: group.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
      })),
      totalSpentPaise: totalGroupSpentPaise,
      myNetBalancePaise: myBalance,
    };
  });

  const overallNetPaise = totalOwedToUserPaise - totalUserOwesPaise;

  // Flatten recent expenses across all user groups for the feed
  const allGroupExpenses: SerializedExpense[] = [];
  for (const group of groups) {
    for (const exp of group.expenses) {
      allGroupExpenses.push({
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
      });
    }
  }

  // Sort descending by date
  allGroupExpenses.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Here is your active shared-expense balance overview across all groups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CreateGroupModal />
          </div>
        </div>

        {/* Global Net Balance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Net Balance Card */}
          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Net Overall Balance
              </CardTitle>
              <div
                className={`p-2 rounded-xl ${
                  overallNetPaise >= 0
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                }`}
              >
                <Scale className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl sm:text-3xl font-black ${
                  overallNetPaise > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : overallNetPaise < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {formatPaiseToINR(overallNetPaise)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {overallNetPaise > 0
                  ? "Overall, you are owed money across groups"
                  : overallNetPaise < 0
                  ? "Overall, you owe money to the groups"
                  : "All your group balances are completely settled"}
              </p>
            </CardContent>
          </Card>

          {/* You Are Owed */}
          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                You Are Owed
              </CardTitle>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {formatPaiseToINR(totalOwedToUserPaise)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Credit from friends who haven&apos;t settled yet
              </p>
            </CardContent>
          </Card>

          {/* You Owe */}
          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                You Owe
              </CardTitle>
              <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                {formatPaiseToINR(totalUserOwesPaise)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pending debt you need to settle up with others
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Groups Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Your Expense Groups ({groupCardData.length})</span>
            </h2>
          </div>

          {groupCardData.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold">No groups yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Create a group for your trip, housemates, or weekend event.
              </p>
              <CreateGroupModal />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupCardData.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {g.name}
                      </h3>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {g.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {g.description}
                      </p>
                    )}

                    {/* Member Avatars */}
                    <div className="mt-4 flex items-center gap-1.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {g.members.slice(0, 4).map((m) => (
                          <Avatar
                            key={m.id}
                            className="h-7 w-7 border-2 border-white dark:border-slate-900"
                          >
                            <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                        {g.memberCount} members
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Total Spent</span>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatPaiseToINR(g.totalSpentPaise)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400">Your Balance</span>
                      <p
                        className={`font-bold ${
                          g.myNetBalancePaise > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : g.myNetBalancePaise < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-500"
                        }`}
                      >
                        {g.myNetBalancePaise > 0
                          ? `+${formatPaiseToINR(g.myNetBalancePaise)}`
                          : formatPaiseToINR(g.myNetBalancePaise)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Global Recent Expenses Feed with Filter Panel */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>All Expenses Across Groups ({allGroupExpenses.length})</span>
            </h2>
          </div>

          <FilterPanel
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
            showGroupSelect={true}
          />

          <ExpenseListView
            initialExpenses={allGroupExpenses}
            currentUserId={user.id}
            showGroupName={true}
          />
        </section>
      </main>
    </div>
  );
}
