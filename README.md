# SplitEase — Shared Expense Tracker

SplitEase is a modern, full-stack shared expense tracker designed for roommates, friends, and trips. It features real-time expense splitting, greedy debt simplification to minimize transactions, role-based access control (RBAC), and email notifications.

Built as a college lab project using Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, Better Auth, and Zustand.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+ (tested on v24)
- **npm** or **pnpm**

> **Note on PostgreSQL**: SplitEase includes an automatic embedded PostgreSQL runner (`embedded-postgres`), so you do **not** need Docker or a separate database service installed to test locally. If you already have PostgreSQL running, simply point `DATABASE_URL` to it.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database (One-Command Reset, Migration & Seed)
```bash
npm run db:setup
```
This single command:
1. Ensures a local or embedded PostgreSQL instance is active on port 5432.
2. Synchronizes the PostgreSQL database schema with Prisma.
3. Generates the Prisma Client.
4. Runs `prisma/seed.ts` (populating 1 admin, 8 members, 4 groups, 30 expenses, settlements, 47 audit logs, and 15 email events).

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials

The database seed automatically creates testing accounts with pre-hashed credentials:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@splitease.example.com` | `Admin@123` | Full access (`/dashboard`, `/groups/*`, `/admin`) |
| **Member 1** | `member1@example.com` | `Member@123` | User access (`/dashboard`, `/groups/*`, `/profile`) |
| **Member 2** | `member2@example.com` | `Member@123` | User access (`/dashboard`, `/groups/*`, `/profile`) |

> On the **Sign In** page, convenient quick-fill buttons are provided to instantly populate test credentials!

---

## ⚙️ Environment Variables

The project includes `.env.example` and an initialized `.env` file:

```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/splitease?schema=public"

# Better Auth Configuration
BETTER_AUTH_SECRET="splitease_super_secret_session_key_2026_jwt_auth_12345"
BETTER_AUTH_URL="http://localhost:3000"

# Resend Email Configuration (Optional - Mock mode works out of the box)
RESEND_API_KEY="re_placeholder_splitease_test_key"
RESEND_WEBHOOK_SECRET="whsec_placeholder_webhook_secret"
EMAIL_FROM="SplitEase <notifications@resend.dev>"
```

---

## 🧪 Testing the Resend Webhook Locally

The Resend webhook handler is implemented at `POST /api/webhooks/resend`. It records email lifecycle events (`email.delivered`, `email.bounced`, `email.opened`, `email.complained`) into the `email_events` database table.

### Testing with `curl`:
```bash
curl -X POST http://localhost:3000/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.delivered",
    "data": {
      "id": "email_test_12345",
      "to": ["member1@example.com"],
      "subject": "New expense added in Goa Beach Villa Trip",
      "created_at": "2026-09-28T18:00:00.000Z"
    }
  }'
```
You should receive a `200 OK` response with `{ "received": true, "id": "..." }`. You can immediately verify this event in the **Admin Console** under the **Email Events** tab at `http://localhost:3000/admin`.

---

## 📐 Architecture & Documentation

Comprehensive ASCII architecture diagrams, ER diagrams, security flows, and RSC vs Client component breakdowns are documented in:
👉 [`docs/ARCHITECTURE.md`](file:///Users/poojan/fst-project1/docs/ARCHITECTURE.md)

---

## 💡 Assumptions & Design Decisions

1. **Integer Paise Storage**: All currency is handled and stored as 64-bit integer paise (1 INR = 100 paise) to eliminate floating-point rounding anomalies.
2. **Server-Side Share Authority**: Client calculations are purely advisory for UX. The server strictly recalculates every share inside an atomic transaction, absorbing any 1-paisa division residues onto the first participant.
3. **Resend Mock Mode**: When `RESEND_API_KEY` contains placeholder text, the email dispatcher simulates delivery and records internal `EmailEvent` rows without failing or blocking mutations.
4. **Embedded Postgres Runner**: For zero-configuration setup, `scripts/start-embedded-pg.ts` provides native Apple Silicon and Linux PostgreSQL execution if a local daemon is not running.
5. **Proxy & Middleware**: `proxy.ts` handles initial edge redirection, while every Route Handler and Server Action re-verifies session tokens and group membership.
