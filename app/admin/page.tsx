import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  FileText,
  Mail,
  CheckCircle,
  AlertTriangle,
  Eye,
  Send,
  AlertOctagon,
} from "lucide-react";

export const metadata = {
  title: "Admin Panel — SplitEase",
};

export default async function AdminPage() {
  // Defense-in-depth: Validate session and ADMIN role inside Server Component
  const admin = await requireRole([Role.ADMIN]);

  // Parallel data fetching for optimal performance
  const [users, auditLogs, emailEvents, transactions] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            groupMemberships: true,
            paidExpenses: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.emailEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
    prisma.transaction.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => [] as { id: string; type: string; status: string; amount: number; description: string; createdAt: Date; user: { name: string; email: string } | null }[]),
  ]);

  // Aggregate email metric counts
  const deliveredCount = emailEvents.filter((e) => e.type === "email.delivered").length;
  const bouncedCount = emailEvents.filter((e) => e.type === "email.bounced").length;
  const openedCount = emailEvents.filter((e) => e.type === "email.opened").length;
  const sentCount = emailEvents.filter((e) => e.type === "email.sent").length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Admin Console
              </h1>
              <Badge className="bg-amber-600 hover:bg-amber-600 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                RBAC Protected
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              System monitoring: registered users, audit trails, and Resend email event telemetry.
            </p>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{users.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Platform members</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                Audit Events
              </CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{auditLogs.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged actions</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                Delivered Emails
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {deliveredCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Successful inbox deliveries</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                Bounced Emails
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {bouncedCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Delivery failures</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Tables */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-xl">
            <TabsTrigger value="users" className="text-xs sm:text-sm font-medium">
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm font-medium">
              Transactions ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm font-medium">
              Audit Logs ({auditLogs.length})
            </TabsTrigger>
            <TabsTrigger value="emails" className="text-xs sm:text-sm font-medium">
              Email Events ({emailEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS TABLE */}
          <TabsContent value="users">
            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Groups</th>
                      <th className="p-4">Expenses Paid</th>
                      <th className="p-4">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {getInitials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={u.role === Role.ADMIN ? "default" : "outline"}
                            className={u.role === Role.ADMIN ? "bg-amber-600 hover:bg-amber-600" : ""}
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">{u._count.groupMemberships}</td>
                        <td className="p-4 font-medium">{u._count.paidExpenses}</td>
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: TRANSACTIONS TABLE */}
          <TabsContent value="transactions">
            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{tx.user?.name}</p>
                          <p className="text-[10px] text-slate-400">{tx.user?.email}</p>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={tx.type === "CREDIT" ? "success" : tx.type === "DEBIT" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "destructive" : "outline"}
                            className="text-[10px]"
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">₹{Number(tx.amount).toFixed(2)}</td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">{tx.description}</td>
                        <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: AUDIT LOGS TABLE */}
          <TabsContent value="audit">
            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Entity</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Group</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </td>
                        <td className="p-4">
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px]">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {log.user?.name || "System"}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          {log.group?.name || "-"}
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-500">
                          {JSON.stringify(log.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: EMAIL EVENTS TABLE */}
          <TabsContent value="emails">
            <Card className="rounded-2xl border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-4">Event Status</th>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Resend ID</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {emailEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <Badge
                            variant={
                              evt.type === "email.delivered"
                                ? "success"
                                : evt.type === "email.bounced"
                                ? "destructive"
                                : evt.type === "email.opened"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[11px] font-semibold"
                          >
                            {evt.type.replace("email.", "")}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                          {evt.recipient}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {evt.subject}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {evt.resendId || "-"}
                        </td>
                        <td className="p-4 text-slate-400 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
