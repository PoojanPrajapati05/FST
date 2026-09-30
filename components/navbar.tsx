import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Split, ShieldCheck } from "lucide-react";

export async function Navbar() {
  const session = await getServerSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Split className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Split<span className="text-blue-600 dark:text-blue-400">Ease</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
              <Link
                href="/dashboard"
                className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/features"
                className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Features
              </Link>
              <Link
                href="/platform"
                className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Platform
              </Link>
              <Link
                href="/documentation"
                className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Docs
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <UserNav user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
