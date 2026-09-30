import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { User, ShieldCheck, Mail, Calendar, Receipt, Users, Handshake } from "lucide-react";

export const metadata = {
  title: "Profile — SplitEase",
};

export default async function ProfilePage() {
  const user = await requireUser();

  const [groupCount, expenseCount, settlementCount] = await Promise.all([
    prisma.groupMember.count({ where: { userId: user.id } }),
    prisma.expense.count({ where: { paidById: user.id } }),
    prisma.settlement.count({
      where: {
        OR: [{ payerId: user.id }, { receiverId: user.id }],
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal settings and see your SplitEase engagement.
          </p>
        </div>

        <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <Avatar className="h-20 w-20 border-2 border-blue-500/20 shadow-md">
                <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {user.name}
                  </h2>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className={user.role === "ADMIN" ? "bg-amber-600 hover:bg-amber-600" : ""}
                  >
                    {user.role === "ADMIN" ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Admin Role
                      </span>
                    ) : (
                      "Member"
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Member since {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{groupCount}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <Users className="h-3.5 w-3.5" /> Groups
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{expenseCount}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <Receipt className="h-3.5 w-3.5" /> Expenses Paid
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{settlementCount}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <Handshake className="h-3.5 w-3.5" /> Settlements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
