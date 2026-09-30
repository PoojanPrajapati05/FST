# SplitEase — Comprehensive System Architecture Document

This document provides architectural blueprints, data flow diagrams, security mechanics, and state management specifications for **SplitEase**, a full-stack shared expense tracker built with Next.js App Router, Prisma ORM, PostgreSQL, Better Auth, and Tailwind CSS.

---

## 1. High-Level Layered Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                         │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌─────────────┐  │
│  │   RSC Server Pages    │  │ Client Interactive   │  │   Zustand   │  │
│  │ (Dashboard, Group,    │  │ Components (Modal,   │  │ Persistence │  │
│  │  Admin, Profile, OG)  │  │  SettleUp, Filter)   │  │  (Drafts)   │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └──────┬──────┘  │
└─────────────┼──────────────────────────┼─────────────────────┼─────────┘
              │ React Server Component   │ Server Actions      │ (Client Local)
              ▼ Stream                   ▼ & REST Handlers     │
┌──────────────────────────────────────────────────────────────┴─────────┐
│                 EDGE / REVERSE PROXY LAYER (proxy.ts)                  │
│  • Public Route Bypass (/sign-in, /sign-up, /api/auth/**, /_next)      │
│  • Session Cookie Guard (better-auth.session_token)                    │
│  • RBAC Route Protection (/admin -> Requires ADMIN role)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER (Next.js App)                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Auth & RBAC Engine (lib/auth.ts)                                 │  │
│  │ • requireUser() • requireRole([ADMIN, MEMBER])                   │  │
│  │ • Defense-in-depth: Re-checked in EVERY Server Action & Route     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────┐    ┌───────────────────────────────┐  │
│  │ SplitEngine (lib/settle.ts) │    │ Validation (lib/validations)  │  │
│  │ • Net balance calculation   │    │ • expenseFormSchema (Zod)     │  │
│  │ • Greedy debt minimizer     │    │ • Server share re-computation │  │
│  │ • Integer paise precision   │    │ • Auth schemas                │  │
│  └─────────────────────────────┘    └───────────────────────────────┘  │
│  ┌─────────────────────────────┐    ┌───────────────────────────────┐  │
│  │ Server Actions              │    │ Email Service (lib/email.ts)  │  │
│  │ • addExpenseAction          │    │ • Resend API Dispatch         │  │
│  │ • recordSettlementAction    │    │ • React Email Templates       │  │
│  │ • createGroupAction         │    │ • Non-blocking async queue    │  │
│  └─────────────────────────────┘    └───────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DATA PERSISTENCE LAYER (PostgreSQL)                  │
│  Prisma ORM (Integer Paise Storage, Normalized Schema, Transactions)  │
│  • users • accounts • sessions • verifications                         │
│  • groups • group_members • expenses • expense_shares • settlements   │
│  • audit_logs • email_events                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity-Relationship (ER) Diagram

```
 +--------------------+               +--------------------+
 |       users        | 1           * |      accounts      |
 +--------------------+---------------+--------------------+
 | id (PK)            |               | id (PK)            |
 | email (UNIQUE)     |               | userId (FK)        |
 | name               |               | password (Hashed)  |
 | role (ADMIN/MEMBER)|               | providerId         |
 +---------+----------+               +--------------------+
           | 1
           |
           +--------------------------+
           | 1                        | 1
           | *                        | *
 +---------v----------+      +--------v-----------+
 |    group_members   |      |      sessions      |
 +--------------------+      +--------------------+
 | id (PK)            |      | id (PK)            |
 | groupId (FK)       |      | userId (FK)        |
 | userId (FK)        |      | token (UNIQUE)     |
 | role (ADMIN/MEMBER)|      | expiresAt          |
 +---------+----------+      +--------------------+
           | *
           | 1
 +---------v----------+
 |       groups       |
 +--------------------+
 | id (PK)            |
 | name               |
 | currency ("INR")   |
 | createdById (FK)   |
 +----+----------+----+
      | 1        | 1
      |          |
      | *        | *
 +----v-----+  +-v------------------+
 | expenses |  |    settlements     |
 +----------+  +--------------------+
 | id (PK)  |  | id (PK)            |
 | groupId  |  | groupId (FK)       |
 | paidById |  | payerId (FK)       |
 | amount   |  | receiverId (FK)    |
 | splitType|  | amount (Paise)     |
 +----+-----+  +--------------------+
      | 1
      | *
 +----v---------------+       +--------------------+       +--------------------+
 |   expense_shares   |       |     audit_logs     |       |    email_events    |
 +--------------------+       +--------------------+       +--------------------+
 | id (PK)            |       | id (PK)            |       | id (PK)            |
 | expenseId (FK)     |       | userId (FK, Null)  |       | type (delivered/..)│
 | userId (FK)        |       | groupId (FK, Null) |       | recipient          |
 | amount (Paise)     |       | action             |       | subject            |
 | percentage         |       | metadata (JSONB)   |       | resendId           |
 +--------------------+       +--------------------+       +--------------------+
```

---

## 3. Database Seeding Workflow (`npm run db:setup`)

```
   [Developer / CI CLI]
            │
            │  npm run db:setup
            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ scripts/db-setup.ts                                         │
   │ 1. Probe port 5432 for existing PostgreSQL daemon           │
   │ 2. If absent -> Launch EmbeddedPostgres automatically        │
   │ 3. Execute `prisma db push` to synchronize all tables        │
   │ 4. Execute `prisma generate` to compile Prisma client       │
   │ 5. Execute `prisma/seed.ts` via tsx                         │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │ prisma/seed.ts Execution Order:                             │
   │ • Purge existing database tables in cascade-safe order      │
   │ • Precompute password hashes via Better Auth PBKDF2/scrypt  │
   │ • Create 1 Admin User (admin@splitease.example.com)         │
   │ • Create 8 Member Users (member1..8@example.com)            │
   │ • Create 4 Real-world Groups (Trip, Flatmates, Trek, Club)  │
   │ • Create 30 Expenses (EQUAL, EXACT, PERCENT)                │
   │   * Invariant Check: sum(shares.amount) === expense.amount  │
   │ • Record initial Settlements between members                │
   │ • Populate 47 AuditLog records with JSON metadata           │
   │ • Ingest 15 EmailEvent rows (delivered, opened, bounced)    │
   │ • Print ASCII summary banner with testing credentials       │
   └─────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Flow

```
[Incoming HTTP Request]
         │
         ▼
[proxy.ts / middleware.ts]
         │
         ├── Is Path Public? (/, /sign-in, /sign-up, /_next, /api/auth)
         │       └─ YES ──> Allow Request
         │
         ├── Has Session Cookie? ("better-auth.session_token")
         │       └─ NO ───> Redirect to /sign-in?callbackUrl=...
         │
         └── Path starts with /admin?
                 ├─ Query Session & Verify role === "ADMIN"
                 ├─ If NOT ADMIN ──> Redirect to /dashboard?error=unauthorized_admin
                 └─ If ADMIN ──────> Allow Request
                         │
                         ▼
        [Server Action / Route Handler Boundary]
                         │
                         ▼
         ┌─────────────────────────────────────────────────────────┐
         │ DEFENSE IN DEPTH: (Never trust the proxy alone!)        │
         │ 1. requireUser(): Re-validates active session in DB     │
         │ 2. requireRole([ADMIN]): Checks enum UserRole in DB     │
         │ 3. Group Membership Check: Validates GroupMember row     │
         │    before any expense or settlement can be processed.    │
         └─────────────────────────────────────────────────────────┘
```

---

## 5. Expense & Settlement Atomic Transaction Flow

```
[User Submits Add Expense Form]
              │
              ▼
[Client: Inline react-hook-form + zodResolver]
              │ (Validates fields client-side for UX)
              ▼
[Server Action: addExpenseAction(rawInput)]
              │
              ├─ 1. Authenticate user via requireUser()
              ├─ 2. Parse rawInput with expenseFormSchema.parse()
              ├─ 3. Verify user is a member of the target group
              ├─ 4. Convert money to integer paise (amount * 100)
              ├─ 5. Re-compute all shares on SERVER:
              │     computeServerExpenseShares(paise, splitType, participants)
              │     (Absorbs rounding residue, verifies exact 100% / sum match)
              │
              ├─ 6. Execute Atomic Database Transaction:
              │     prisma.$transaction([
              │       tx.expense.create({ ...shares }),
              │       tx.auditLog.create({ action: "EXPENSE_CREATED", ... })
              │     ])
              │
              ├─ 7. Non-Blocking Async Notification Dispatch:
              │     sendExpenseNotification(...) to all participants
              │     (Does NOT block DB commit, failures never rollback mutation)
              │
              └─ 8. revalidatePath() and return { success: true }
```

---

## 6. Email Dispatch & Resend Webhook Ingestion Flow

```
[Server Action Completes Mutation]
              │
              ▼
[lib/email.ts: sendEmail()]
              │
              ├─ Render React Email component (ExpenseAddedEmail / SettlementSummaryEmail)
              ├─ Dispatch via Resend SDK: resend.emails.send()
              ├─ Record resendId in database
              └─ Persist "email.sent" event into email_events table
                                  │
                                  ▼
                     [Resend Email Delivery]
                                  │
                                  ▼ (Webhook Ping)
            [app/api/webhooks/resend/route.ts]
                                  │
              ├─ Verify Svix HMAC Sha256 headers (svix-id, svix-timestamp, svix-signature)
              ├─ Parse webhook event payload (email.delivered, email.bounced, email.opened)
              ├─ Map to EmailEvent table
              └─ Return 200 OK { received: true }
```

---

## 7. RSC (Server) vs. Client Components Breakdown

SplitEase adheres strictly to the React Server Component paradigm. Components are Server Components by default to minimize JavaScript bundle size, improve First Contentful Paint, and securely access database credentials without exposing APIs.

| Component Path | Type | Reason for Boundary | Serializable Props Passed |
| :--- | :--- | :--- | :--- |
| `app/layout.tsx` | **Server** | Root document layout; streams fonts, sets SEO tags. | Children |
| `app/page.tsx` | **Server** | Marketing landing page; zero interactive client state needed. | None |
| `app/dashboard/page.tsx` | **Server** | Direct database queries for user groups, balances, and global expense feed. | None |
| `app/groups/[id]/page.tsx` | **Server** | Direct database query for group members, ledger calculations, and debt simplification. | None |
| `app/admin/page.tsx` | **Server** | Direct queries for users, audit logs, and email metrics; enforced ADMIN role. | None |
| `app/profile/page.tsx` | **Server** | Direct query for user profile metrics and account stats. | None |
| `app/groups/[id]/opengraph-image.tsx` | **Server** | `next/og` ImageResponse generator dynamically rendering PNG cards. | URL params |
| `components/navbar.tsx` | **Server** | Fetches session directly from headers; renders navigation shell. | None |
| `components/theme-provider.tsx` | **Client** | Controls DOM classes, accesses `localStorage` and React Theme Context. | Children, ThemeProviderProps |
| `components/theme-toggle.tsx` | **Client** | Consumes theme state; renders interactive dropdown with mounted hydration guard. | None |
| `components/user-nav.tsx` | **Client** | Handles browser sign-out action, redirects, and interactive avatar dropdown. | Serializable `user` object |
| `components/auth/sign-in-form.tsx` | **Client** | Manages form inputs, client validation schema, and calls Better Auth client SDK. | None |
| `components/auth/sign-up-form.tsx` | **Client** | Interactive form inputs, password confirmation check, and client signup call. | None |
| `components/expenses/add-expense-modal.tsx` | **Client** | React Hook Form, dynamic split calculations, Zustand draft sync, and action dispatch. | Serializable `members`, `groupId`, `userId` |
| `components/settlements/settle-up-modal.tsx` | **Client** | Interactive payment modal, suggested debt pre-fill, and action trigger. | Serializable `members`, `suggestedDebts` |
| `components/groups/create-group-modal.tsx` | **Client** | Dynamic email tag adder, input state, and group creation action trigger. | None |
| `components/expenses/filter-panel.tsx` | **Client** | Consumes persisted Zustand filter state, text search debounce, category pickers. | Serializable `groups` list |
| `components/expenses/expense-list-view.tsx` | **Client** | Connects to filter store, applies live client filtering, uses `useOptimistic`. | Serializable `initialExpenses` |
| `components/web-vitals.tsx` | **Client** | Subscribes to browser `PerformanceObserver` via `useReportWebVitals`. | None |

---

## 8. Server State vs. Zustand State Matrix

| Dimension | Server State (PostgreSQL via Prisma) | Zustand State (`expense-draft` & `filter-panel`) |
| :--- | :--- | :--- |
| **Source of Truth** | PostgreSQL Database | Browser `localStorage` / Client Memory |
| **Example** | `amount: 15000` (paise), `ExpenseShare` breakdown, `Settlement` records | Unsaved expense description `"Goa Shack Dinner"`, active category filter `"FOOD"` |
| **Authority** | **Absolute Authority**: Server calculates all shares and verifies membership | **UI-Only / Non-authoritative**: Server completely re-computes all mathematical operations |
| **Persistence** | Persistent across all devices and sessions | Device-local (retained across page reloads via `persist` middleware) |
| **Hydration Guard** | Rendered directly on server or streamed via Suspense | Wrapped in `useEffect` / `isHydrated` state guard to eliminate SSR mismatch |
| **Purpose** | Financial integrity, audit logging, RBAC enforcement, settlement verification | Fluid user experience, form draft recovery upon accidental closing, fast search filtering |
