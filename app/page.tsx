import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  PieChart,
  ShieldCheck,
  Split,
  Users,
  Zap,
} from "lucide-react";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 sm:py-28 md:py-32">
          {/* Subtle Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 mb-8 animate-pulse">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Smart Debt Simplification Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Shared expenses, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                simplified effortlessly.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Track trips, flatmates, and friend outings without awkward math. Split by equal shares, exact amounts, or percentages with instant settlement plans.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-8 h-12 text-base">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 text-base">
                <Link href="/sign-in">
                  Explore Demo (Admin / Member)
                </Link>
              </Button>
            </div>

            {/* QUICK STATS PILL */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-200 dark:border-slate-800 pt-8">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">O(N)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Greedy Simplification</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Exact Paise Precision</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Role-Based</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admin & Member RBAC</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Resend API</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Instant Email Updates</p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES */}
        <section className="py-20 bg-white/50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Everything you need to share expenses gracefully
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Crafted specifically for college groups, trip companions, and roommates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-6">
                  <Split className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Flexible Split Types
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Choose between EQUAL, EXACT amounts, or PERCENTAGE shares. Server-side validation guarantees every share strictly balances down to the paisa.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Greedy Debt Simplification
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Eliminates circular debts. Instead of 10 people sending 20 payments, our algorithm computes the mathematical minimum number of transfers to balance everyone out.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Audited & Secure
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every expense creation and settlement is wrapped in an atomic database transaction with full audit logging, email triggers, and webhook tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="container mx-auto px-4">
          <p>SplitEase — Full-Stack Shared Expense Tracker. Built with Next.js, Prisma, Better Auth & Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}
