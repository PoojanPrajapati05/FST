import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentOneClientDemo } from "@/components/assignment-1/client-demo";

export const metadata = {
  title: "Features — SplitEase",
  description: "Explore SplitEase interactive features: shopping cart, forms, state management, server actions and more.",
};

// ─── Server Component: Stats Card (Server → Client props) ───────────────────
function ConceptBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

const serverRenderedAt = new Date().toISOString();

// Simulated server data passed as props to client component
const DEMO_PRODUCTS = [
  { id: "prod-1", name: "Next.js Handbook", price: 499, image: "📚" },
  { id: "prod-2", name: "TypeScript Mastery", price: 399, image: "🔷" },
  { id: "prod-3", name: "Prisma Database Guide", price: 299, image: "🗄️" },
  { id: "prod-4", name: "Tailwind CSS Course", price: 199, image: "🎨" },
  { id: "prod-5", name: "React Deep Dive", price: 599, image: "⚛️" },
  { id: "prod-6", name: "Zod Validation Book", price: 149, image: "✅" },
];

// ─── Server Component (default export) ──────────────────────────────────────
export default function Assignment1Page() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Features &amp; Capabilities
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Interactive demo of SplitEase's core tech: Server Components · Zustand State · Smart Forms · Server Actions
          </p>
        </div>

        {/* CONCEPT BADGES ─ Server Component */}
        <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">✅ Core Technologies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              ["App Router", "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"],
              ["Server Components", "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-300"],
              ["Client Components", "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950 dark:text-pink-300"],
              ["Server→Client Props", "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"],
              ["Hydration", "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300"],
              ["shadcn/ui + Radix", "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"],
              ["Light/Dark/System Theme", "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"],
              ["Zustand", "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300"],
              ["Persistent LocalStorage", "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"],
              ["Shopping Cart", "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300"],
              ["React Hook Form", "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"],
              ["Zod Validation", "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"],
              ["Shared Zod Schema", "border-lime-300 bg-lime-50 text-lime-700 dark:border-lime-700 dark:bg-lime-950 dark:text-lime-300"],
              ["Server Action", "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300"],
              ["Server-side Validation", "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"],
              ["Loading State", "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"],
              ["Error State", "border-red-400 bg-red-100 text-red-800 dark:border-red-600 dark:bg-red-950 dark:text-red-300"],
              ["Toast Notifications", "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300"],
              ["Suspense", "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300"],
              ["Optimistic UI", "border-green-400 bg-green-100 text-green-800 dark:border-green-600 dark:bg-green-950 dark:text-green-300"],
            ].map(([label, color]) => (
              <ConceptBadge key={label} label={label} color={color} />
            ))}
          </CardContent>
        </Card>

        {/* SERVER COMPONENT DEMO CARD */}
        <Card className="rounded-2xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">🖥️ Server Component</CardTitle>
              <Badge variant="secondary" className="text-xs">No "use client"</Badge>
            </div>
            <CardDescription>
              This card is rendered on the server. The timestamp below is set at server render time — it never changes unless you do a full page reload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">Server Rendered At:</span>{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">
                {serverRenderedAt}
              </code>
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Product catalog data below is fetched on the server and passed as props to the client component — demonstrating Server → Client props pattern.
            </p>
          </CardContent>
        </Card>

        {/* CLIENT COMPONENT DEMO — wrapped in Suspense (demonstrating Suspense boundary) */}
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            </div>
          }
        >
          {/* Server passes products as props → client hydrates with Zustand cart */}
          <AssignmentOneClientDemo
            products={DEMO_PRODUCTS}
            serverRenderedAt={serverRenderedAt}
          />
        </Suspense>
      </main>
    </div>
  );
}
