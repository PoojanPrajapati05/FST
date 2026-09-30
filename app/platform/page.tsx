import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Database,
  Key,
  Mail,
  Webhook,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Platform — SplitEase",
  description: "Explore SplitEase's backend platform: Prisma database, Better Auth, role-based access control, API routes, audit logs, email and webhooks.",
};

async function Assignment2Stats() {
  const session = await getServerSession();

  const [userCount, auditCount, emailCount] = await Promise.all([
    prisma.user.count(),
    prisma.auditLog.count(),
    prisma.emailEvent.count(),
  ]);

  let txCount = 0;
  let supportCount = 0;
  try {
    txCount = await prisma.transaction.count();
    supportCount = await prisma.supportRequest.count();
  } catch {
    // tables may not exist yet
  }

  return (
    <div className="space-y-6">
      {/* Live Database Stats */}
      <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base font-semibold">📊 Live Database Stats (Prisma + PostgreSQL)</CardTitle>
          </div>
          <CardDescription>Real data fetched from the database on the server.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Users", value: userCount, color: "text-blue-600 dark:text-blue-400" },
              { label: "Transactions", value: txCount, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Audit Logs", value: auditCount, color: "text-violet-600 dark:text-violet-400" },
              { label: "Support Requests", value: supportCount, color: "text-amber-600 dark:text-amber-400" },
              { label: "Email Events", value: emailCount, color: "text-pink-600 dark:text-pink-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auth Status */}
      <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base font-semibold">🔐 Authentication Status (Better Auth)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {session?.user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-600">✅ Authenticated</Badge>
                <Badge variant={session.user.role === "ADMIN" ? "default" : "secondary"} className={session.user.role === "ADMIN" ? "bg-amber-600 hover:bg-amber-600" : ""}>
                  Role: {String(session.user.role)}
                </Badge>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1 font-mono text-xs bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                <p><span className="text-slate-400">user.id:</span> {session.user.id}</p>
                <p><span className="text-slate-400">user.name:</span> {session.user.name}</p>
                <p><span className="text-slate-400">user.email:</span> {session.user.email}</p>
                <p><span className="text-slate-400">user.role:</span> {String(session.user.role)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-slate-500">Not logged in (GUEST)</Badge>
              <Link href="/sign-in">
                <Button size="sm" variant="outline">Sign In to see session data</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Feature items
const FEATURES = [
  {
    icon: <Database className="h-5 w-5 text-blue-500" />,
    title: "Prisma + PostgreSQL",
    desc: "Schema defined in prisma/schema.prisma with migrations. Models: User, Session, Account, Group, Expense, ExpenseShare, Settlement, AuditLog, EmailEvent, Transaction, SupportRequest.",
    route: null,
  },
  {
    icon: <Key className="h-5 w-5 text-emerald-500" />,
    title: "Better Auth — Authentication",
    desc: "Email/password auth with session management. Login, Register, Logout. Sessions stored in DB via Prisma adapter.",
    route: "/sign-in",
  },
  {
    icon: <Shield className="h-5 w-5 text-amber-500" />,
    title: "RBAC — Role Based Authorization",
    desc: "3 roles: ADMIN, MEMBER, GUEST. Admin dashboard protected at middleware level AND server component level. requireRole() used in Server Actions.",
    route: "/admin",
  },
  {
    icon: <FileText className="h-5 w-5 text-violet-500" />,
    title: "Next.js Middleware (Proxy)",
    desc: "middleware.ts wraps proxy.ts — intercepts every request. Redirects unauthenticated users. Checks ADMIN role via session API before allowing /admin access.",
    route: null,
  },
  {
    icon: <Users className="h-5 w-5 text-pink-500" />,
    title: "API Routes + Zod Validation",
    desc: "GET/POST /api/users, GET/POST /api/transactions, GET /api/audit-logs. All protected with auth, Zod validated, correct HTTP status codes.",
    route: "/api/users",
  },
  {
    icon: <FileText className="h-5 w-5 text-indigo-500" />,
    title: "Audit Logs + Prisma Transactions",
    desc: "Every expense creation wraps Expense + AuditLog in a single prisma.$transaction() — atomic, all-or-nothing. View in Admin Console.",
    route: "/admin",
  },
  {
    icon: <Mail className="h-5 w-5 text-rose-500" />,
    title: "Resend Email + React Email",
    desc: "3 email templates using @react-email/components: WelcomeEmail, ExpenseAddedEmail, SettlementSummaryEmail. Dev mode logs instead of sending.",
    route: null,
  },
  {
    icon: <Webhook className="h-5 w-5 text-teal-500" />,
    title: "Email Webhook Handler",
    desc: "POST /api/webhooks/resend — handles Resend webhook events (delivered, bounced, opened). Verifies HMAC signature, stores in EmailEvent table.",
    route: null,
  },
  {
    icon: <Database className="h-5 w-5 text-orange-500" />,
    title: "Faker.js Seed",
    desc: "prisma/seed.ts uses @faker-js/faker to seed: 10 users, 3 groups, 30 expenses, 20 audit logs, 30 transactions, 15 support requests, 10 email events.",
    route: null,
  },
];

// API Demo Links
const API_ENDPOINTS = [
  { method: "GET", path: "/api/users", desc: "List all users (ADMIN only)" },
  { method: "POST", path: "/api/users", desc: "Create user with Zod validation" },
  { method: "GET", path: "/api/transactions", desc: "List transactions (auth required)" },
  { method: "POST", path: "/api/transactions", desc: "Create transaction + audit log atomically" },
  { method: "GET", path: "/api/audit-logs", desc: "List audit logs (ADMIN only)" },
  { method: "POST", path: "/api/webhooks/resend", desc: "Resend webhook handler (public)" },
];

export default function Assignment2Page() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Platform &amp; Architecture
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Prisma · PostgreSQL · Better Auth · RBAC · API Routes · Audit Logs · Resend · Webhooks · Faker.js
          </p>
        </div>

        {/* Live Stats — wrapped in Suspense */}
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          }
        >
          <Assignment2Stats />
        </Suspense>

        {/* Feature cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🚀 Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {f.icon}
                      <CardTitle className="text-sm font-semibold">{f.title}</CardTitle>
                    </div>
                    {f.route && (
                      <Link href={f.route}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                          View <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* API Endpoint Table */}
        <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">🔌 API Endpoints</CardTitle>
            <CardDescription>All endpoints use Zod validation and return proper HTTP status codes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-4 text-left">Method</th>
                  <th className="p-4 text-left">Path</th>
                  <th className="p-4 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {API_ENDPOINTS.map((ep) => (
                  <tr key={`${ep.method}-${ep.path}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ${ep.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{ep.path}</td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Seed Credentials */}
        <Card className="rounded-2xl border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300">🌱 Seeded Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="bg-white dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-600 dark:text-blue-300 font-bold">ADMIN</p>
                <p className="text-slate-700 dark:text-slate-300">admin@splitease.example.com</p>
                <p className="text-slate-500">Password: Admin@123</p>
              </div>
              <div className="bg-white dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                <p className="text-emerald-600 dark:text-emerald-300 font-bold">MEMBER</p>
                <p className="text-slate-700 dark:text-slate-300">member1@example.com</p>
                <p className="text-slate-500">Password: Member@123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
