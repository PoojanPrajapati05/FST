import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Documentation — SplitEase FST",
  description: "Beginner-friendly explanations of Full Stack Development concepts used in this project.",
};

const DOCS = [
  {
    id: "server-components",
    emoji: "🖥️",
    title: "Server Components",
    color: "border-blue-200 dark:border-blue-800",
    what: "A React component that runs only on the server. It never ships JavaScript to the browser.",
    why: "Faster page loads. Direct database access. Secrets stay server-side. Smaller JS bundle.",
    how: "In Next.js App Router, every component is a Server Component by default. Just don't add 'use client'.",
    example: `// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await prisma.user.findMany(); // DB access ✅
  return <div>{data.map(u => <p>{u.name}</p>)}</div>;
}`,
  },
  {
    id: "client-components",
    emoji: "🖱️",
    title: "Client Components",
    color: "border-pink-200 dark:border-pink-800",
    what: "A component that runs in the browser. Can use state, effects, and event handlers.",
    why: "Needed for interactivity: buttons, forms, real-time updates.",
    how: "Add 'use client' at the top of the file.",
    example: `// components/counter.tsx (Client Component)
"use client";
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
  },
  {
    id: "hydration",
    emoji: "🔄",
    title: "Hydration",
    color: "border-teal-200 dark:border-teal-800",
    what: "The process where React 'wakes up' the server-rendered HTML in the browser by attaching event listeners.",
    why: "Users see content immediately (server HTML) and interactivity kicks in after hydration.",
    how: "Happens automatically. Use suppressHydrationWarning on <html> to avoid theme mismatch warnings.",
    example: `// Server renders static HTML → Browser downloads JS →
// React hydrates → Component is now interactive
// isMounted pattern prevents hydration mismatch:
const isMounted = useMounted();
return <p>{isMounted ? "Client value" : "Server fallback"}</p>`,
  },
  {
    id: "zustand",
    emoji: "🐻",
    title: "Zustand",
    color: "border-orange-200 dark:border-orange-800",
    what: "A lightweight state management library for React. Simpler than Redux.",
    why: "Centralized client state. No boilerplate. Can persist to localStorage automatically.",
    how: "Create a store with create(). Use persist() middleware for localStorage. Access with the returned hook.",
    example: `// lib/store/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }),
    { name: "cart-storage" } // localStorage key
  )
);`,
  },
  {
    id: "zod",
    emoji: "✅",
    title: "Zod",
    color: "border-emerald-200 dark:border-emerald-800",
    what: "A TypeScript-first schema validation library. Define schemas and validate data against them.",
    why: "Shared between client (instant feedback) and server (security). One schema = one source of truth.",
    how: "Define with z.object(). Use .parse() (throws) or .safeParse() (returns result). Types inferred automatically.",
    example: `// lib/validations/auth.ts (shared schema)
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Used in client form AND server action ← same schema!
type SignInValues = z.infer<typeof signInSchema>;`,
  },
  {
    id: "server-actions",
    emoji: "⚡",
    title: "Server Actions",
    color: "border-fuchsia-200 dark:border-fuchsia-800",
    what: "Functions that run on the server, called directly from client components. Like an RPC call.",
    why: "No need to create API routes for form submissions. Automatic CSRF protection. Type-safe.",
    how: "Add 'use server' at top of file. Export async functions. Call them from client components.",
    example: `// app/actions/contact.ts
"use server";

export async function submitContactAction(data: ContactValues) {
  const parsed = contactSchema.parse(data); // server-side validation
  await sendEmail(parsed);
  return { success: true };
}

// Client component calls it directly:
const result = await submitContactAction(formData);`,
  },
  {
    id: "prisma",
    emoji: "🗄️",
    title: "Prisma",
    color: "border-violet-200 dark:border-violet-800",
    what: "An ORM (Object Relational Mapper) for Node.js. Write TypeScript to talk to the database.",
    why: "Type-safe queries. Auto-generated types from schema. Migrations. No raw SQL needed.",
    how: "Define models in schema.prisma. Run prisma migrate. Use prisma client to query.",
    example: `// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// Usage in server component:
const users = await prisma.user.findMany({
  where: { role: "ADMIN" },
  orderBy: { createdAt: "desc" },
});`,
  },
  {
    id: "authentication",
    emoji: "🔐",
    title: "Authentication (Better Auth)",
    color: "border-amber-200 dark:border-amber-800",
    what: "Verifying who the user is. Better Auth handles login, registration, sessions, and password hashing.",
    why: "Secure, production-ready auth without rolling your own. Sessions stored in DB via Prisma.",
    how: "Configure in lib/auth.ts. Use getServerSession() in server components. Client uses auth-client.ts.",
    example: `// lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
});

// Server Component:
const session = await getServerSession();
if (!session) redirect("/sign-in");`,
  },
  {
    id: "authorization",
    emoji: "🛡️",
    title: "Authorization (RBAC)",
    color: "border-red-200 dark:border-red-800",
    what: "Verifying what the user is allowed to do. We use 3 roles: ADMIN, MEMBER, GUEST.",
    why: "Not just hiding buttons — every protected operation checks role on the server.",
    how: "requireRole() in server components/actions. Middleware checks /admin before page loads.",
    example: `// lib/auth.ts
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

// Usage:
const admin = await requireRole([Role.ADMIN]); // throws if not ADMIN`,
  },
  {
    id: "middleware",
    emoji: "🔀",
    title: "Proxy / Middleware",
    color: "border-indigo-200 dark:border-indigo-800",
    what: "Code that runs before every request. Checks auth, redirects, modifies headers.",
    why: "First line of defense. Redirects unauthenticated users before page even loads.",
    how: "Create middleware.ts at project root. Export a function matching Next.js middleware signature.",
    example: `// middleware.ts
export { proxy as middleware, config } from "@/proxy";

// proxy.ts intercepts every request:
// - No session token? → redirect to /sign-in
// - Accessing /admin but not ADMIN role? → redirect to /dashboard
// - Authenticated user on /sign-in? → redirect to /dashboard`,
  },
  {
    id: "faker",
    emoji: "🌱",
    title: "Faker.js Seeding",
    color: "border-lime-200 dark:border-lime-800",
    what: "Generating realistic fake data for development and testing using the @faker-js/faker library.",
    why: "Needed to test the app with realistic data. Much faster than manually entering records.",
    how: "Create prisma/seed.ts. Use faker to generate users, transactions, etc. Run with npm run db:seed.",
    example: `// prisma/seed.ts
import { faker } from "@faker-js/faker";

for (let i = 0; i < 10; i++) {
  await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }
  });
}`,
  },
  {
    id: "resend",
    emoji: "📧",
    title: "Resend + React Email",
    color: "border-rose-200 dark:border-rose-800",
    what: "Resend is an email API service. React Email lets you build email templates with JSX.",
    why: "Transactional emails (welcome, expense notifications) with beautiful HTML templates.",
    how: "Create templates in emails/ folder using @react-email/components. Send via Resend SDK in lib/email.ts.",
    example: `// lib/email.ts
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "notifications@example.com",
  to: user.email,
  subject: "Welcome!",
  react: <WelcomeEmail name={user.name} />,
});
// Dev mode: logs to console if no API key`,
  },
  {
    id: "webhooks",
    emoji: "🪝",
    title: "Webhooks",
    color: "border-cyan-200 dark:border-cyan-800",
    what: "HTTP callbacks that Resend sends to your app when email events occur (delivered, bounced, opened).",
    why: "Track email delivery status. Store events for the admin dashboard.",
    how: "Create POST /api/webhooks/resend. Verify HMAC signature. Store event in EmailEvent table.",
    example: `// app/api/webhooks/resend/route.ts
export async function POST(request: NextRequest) {
  // 1. Verify HMAC signature from Resend
  // 2. Parse event type (email.delivered, email.bounced)
  // 3. Store in DB
  await prisma.emailEvent.create({
    data: { type: eventType, recipient, subject }
  });
  return NextResponse.json({ received: true });
}`,
  },
];

export default function DocumentationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            📖 Documentation
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Beginner-friendly explanations of every concept used in this project. Great for viva prep!
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex flex-wrap gap-2">
          {DOCS.map((doc) => (
            <a
              key={doc.id}
              href={`#${doc.id}`}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {doc.emoji} {doc.title}
            </a>
          ))}
        </div>

        {/* Doc Cards */}
        <div className="space-y-6">
          {DOCS.map((doc) => (
            <Card
              key={doc.id}
              id={doc.id}
              className={`rounded-2xl border-2 ${doc.color} bg-white dark:bg-slate-900 shadow-sm scroll-mt-24`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="text-2xl">{doc.emoji}</span>
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">What is it?</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{doc.what}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Why use it?</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{doc.why}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">How it works in this project</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{doc.how}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Code Example</p>
                  <pre className="text-[11px] bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg p-4 overflow-auto font-mono leading-relaxed whitespace-pre-wrap">
                    {doc.example}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
