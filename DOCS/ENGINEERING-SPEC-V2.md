# AI Tarot - Engineering Specification v2.0

> **Review Standard**: John Carmack-level code quality. No workarounds. Full implementations only.
>
> **Guideline Compliance**: All DOCS/GUIDELINES-REF/*.md requirements MUST be followed.

---

## Executive Summary

This specification creates a world-class AI Tarot application with:

1. **Production-grade architecture** with comprehensive testing, error handling, and observability
2. **Security-first design** with RLS, CSP, rate limiting, and audit trails
3. **Performance-optimized** with Core Web Vitals targets and caching strategies
4. **Accessibility-compliant** with WCAG 2.2 AA standards from day one
5. **Cost-controlled** with LLM budget limits and usage tracking

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Security Architecture](#security-architecture)
5. [Error Handling Strategy](#error-handling-strategy)
6. [Testing Strategy](#testing-strategy)
7. [Performance Strategy](#performance-strategy)
8. [Observability & Logging](#observability--logging)
9. [LLM Integration](#llm-integration)
10. [Phased Implementation Plan](#phased-implementation-plan)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Deployment & Operations](#deployment--operations)

---

## Technology Stack

### Core Stack (2025 Best Practices)

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Framework** | Next.js | 16.x | App Router, Server Actions, Turbopack, Cache Components |
| **Runtime** | React | 19.2 | Server Components, React Compiler (stable) |
| **Language** | TypeScript | 5.6+ | Strict mode, exactOptionalPropertyTypes |
| **Database** | PostgreSQL | 15+ | Supabase-hosted with pgvector |
| **ORM** | Drizzle | 0.44+ | Edge-compatible, type-safe, 7.4kb |
| **Auth** | Supabase Auth | Latest | RLS-integrated, server-side sessions |
| **LLM** | Vercel AI SDK | 4.x | Provider abstraction, structured output |
| **Payments** | Stripe | Latest | Pix + Card support |
| **Linting** | Biome | 2.x | Replaces ESLint/Prettier (Next.js 16 removed next lint) |
| **Testing** | Vitest + Playwright | Latest | Unit/Integration + E2E |
| **Hosting** | Vercel | Latest | Optimized for Next.js |

### Next.js 16 Critical Changes

```typescript
// CRITICAL: All request APIs are now ASYNC in Next.js 16

// ❌ OLD - Sync access (WILL NOT WORK)
const cookieStore = cookies();
const headerList = headers();
const { params } = props;
const { searchParams } = props;

// ✅ NEW - Async access (REQUIRED)
const cookieStore = await cookies();
const headerList = await headers();
const params = await props.params;
const searchParams = await props.searchParams;
```

### Other Next.js 16 Changes
- **Turbopack default**: Stable for dev and build
- **React Compiler stable**: Auto-memoization, no useMemo/useCallback needed
- **proxy.ts replaces middleware.ts**: Rename file for proxying
- **Cache Components**: `cacheComponents: true` replaces experimental PPR
- **No `next lint`**: Use Biome directly
- **Node.js 20.9+ required**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Vercel Edge Network                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │Static Pages  │  │Server Comps  │  │      Server Actions            │ │
│  │(Landing, FAQ)│  │(Dashboard)   │  │(createReading, purchaseCredits)│ │
│  └──────────────┘  └──────────────┘  └────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Security Layer                                  │   │
│  │  Rate Limiting │ CSP │ CORS │ Input Validation │ Auth (DAL)       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │  Supabase Auth   │           │  Vercel AI SDK   │
    │  (RLS + DAL)     │           │  (Gemini/OpenAI) │
    └──────────────────┘           └──────────────────┘
              │                               │
              ▼                               │
    ┌─────────────────────────────────────────┴─────────────────┐
    │              Supabase PostgreSQL (Primary)                 │
    │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │
    │  │  Tables   │ │    RLS    │ │ pgvector  │ │  Indexes  │  │
    │  │(Drizzle)  │ │ Policies  │ │   (AI)    │ │ (Optimized)│  │
    │  └───────────┘ └───────────┘ └───────────┘ └───────────┘  │
    │  ┌───────────┐ ┌───────────┐ ┌───────────┐               │
    │  │  Queues   │ │   Cron    │ │ Audit Log │               │
    │  │ (pgmq)    │ │(pg_cron)  │ │(Append-only)│             │
    │  └───────────┘ └───────────┘ └───────────┘               │
    └──────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing page
│   ├── error.tsx                     # Global error boundary
│   ├── not-found.tsx                 # 404 page
│   ├── (demo)/                       # Demo routes (no auth)
│   │   ├── layout.tsx
│   │   └── reading/
│   │       ├── page.tsx              # Demo reading page
│   │       └── loading.tsx           # Loading skeleton
│   ├── (app)/                        # Authenticated routes
│   │   ├── layout.tsx                # Auth-required layout
│   │   ├── dashboard/
│   │   ├── history/
│   │   ├── settings/
│   │   └── credits/
│   ├── actions/                      # Server Actions
│   │   ├── reading.ts
│   │   ├── credits.ts
│   │   └── auth.ts
│   └── api/
│       ├── health/route.ts
│       └── webhooks/
│           └── stripe/route.ts
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── tarot/                        # Domain components
│   │   ├── card.tsx
│   │   ├── spread.tsx
│   │   └── reading-result.tsx
│   └── providers/                    # Context providers
│       ├── theme-provider.tsx
│       └── toast-provider.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Drizzle schema
│   │   ├── index.ts                  # Drizzle client
│   │   ├── queries/                  # Query functions
│   │   │   ├── readings.ts
│   │   │   ├── credits.ts
│   │   │   └── cards.ts
│   │   └── migrations/               # Migration helpers
│   ├── dal/                          # Data Access Layer (Auth)
│   │   └── index.ts
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── services/
│   │   ├── tarot.ts                  # TarotService
│   │   └── credits.ts                # CreditsService
│   ├── llm/
│   │   ├── service.ts                # LLM abstraction
│   │   ├── prompts.ts                # System prompts
│   │   └── schemas.ts                # Output schemas
│   ├── audit/
│   │   └── logger.ts                 # Audit logging
│   ├── errors/
│   │   └── index.ts                  # Error classes
│   ├── validations/
│   │   └── index.ts                  # Zod schemas
│   └── utils/
│       ├── hash.ts                   # Hashing utilities
│       └── rate-limit.ts             # Rate limiting
├── types/
│   └── index.ts                      # Global types
└── __tests__/                        # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Database Schema

### Core Tables

All tables MUST include:
- `id` (UUID, primary key)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, auto-update via trigger)
- `deleted_at` (timestamp, nullable - SOFT DELETE)

Exception: Audit tables have NO `deleted_at` (append-only).

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ========== ENUMS ==========
export const spreadTypeEnum = pgEnum("spread_type", ["one", "three", "five"]);
export const arcanaEnum = pgEnum("arcana", ["major", "minor"]);
export const suitEnum = pgEnum("suit", ["wands", "cups", "swords", "pentacles", "none"]);
export const orientationEnum = pgEnum("orientation", ["upright", "reversed"]);
export const creditTypeEnum = pgEnum("credit_type", [
  "reading",
  "purchase",
  "bonus",
  "adjustment",
  "refund",
  "welcome",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "refunded",
]);

// ========== PROFILES ==========
// Extended user data (Supabase Auth manages core user)
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // Same as auth.users.id
    email: text("email").notNull(),
    name: text("name"),
    locale: text("locale").default("pt-BR").notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("profiles_email_idx").on(table.email).where(sql`deleted_at IS NULL`),
  ]
);

// ========== GUEST SESSIONS ==========
export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    freeReadingsUsed: integer("free_readings_used").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("guest_sessions_expires_idx").on(table.expiresAt),
  ]
);

// ========== TAROT DECKS ==========
export const tarotDecks = pgTable("tarot_decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locale: text("locale").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// ========== TAROT CARDS ==========
export const tarotCards = pgTable(
  "tarot_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .references(() => tarotDecks.id)
      .notNull(),
    code: text("code").notNull(), // e.g., 'major_00_the_fool'
    name: text("name").notNull(),
    arcana: arcanaEnum("arcana").notNull(),
    suit: suitEnum("suit").notNull(),
    cardIndex: integer("card_index").notNull(), // 0-77
    keywordsUpright: jsonb("keywords_upright").notNull().$type<string[]>(),
    keywordsReversed: jsonb("keywords_reversed").notNull().$type<string[]>(),
    descriptionUpright: text("description_upright").notNull(),
    descriptionReversed: text("description_reversed").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("tarot_cards_deck_idx").on(table.deckId),
    uniqueIndex("tarot_cards_code_deck_idx")
      .on(table.code, table.deckId)
      .where(sql`deleted_at IS NULL`),
  ]
);

// ========== READINGS ==========
export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id),
    guestSessionId: uuid("guest_session_id").references(() => guestSessions.id),
    question: text("question").notNull(),
    questionHash: text("question_hash").notNull(), // SHA-256 for dedup/audit
    spreadType: spreadTypeEnum("spread_type").notNull(),
    language: text("language").default("pt-BR").notNull(),
    summary: text("summary"),
    aiOutput: jsonb("ai_output").$type<ReadingAIOutput>(),
    model: text("model").notNull(),
    tokensPrompt: integer("tokens_prompt"),
    tokensCompletion: integer("tokens_completion"),
    latencyMs: integer("latency_ms"),
    creditsSpent: integer("credits_spent").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("readings_user_idx").on(table.userId).where(sql`deleted_at IS NULL`),
    index("readings_guest_idx").on(table.guestSessionId),
    index("readings_created_idx").on(table.createdAt),
    index("readings_question_hash_idx").on(table.questionHash),
  ]
);

// ========== READING CARDS ==========
export const readingCards = pgTable(
  "reading_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .references(() => readings.id, { onDelete: "cascade" })
      .notNull(),
    cardId: uuid("card_id")
      .references(() => tarotCards.id)
      .notNull(),
    positionIndex: integer("position_index").notNull(),
    positionRole: text("position_role").notNull(),
    orientation: orientationEnum("orientation").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reading_cards_reading_idx").on(table.readingId),
  ]
);

// ========== CREDIT BALANCES ==========
export const creditBalances = pgTable("credit_balances", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id),
  credits: integer("credits").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== CREDIT TRANSACTIONS (APPEND-ONLY AUDIT) ==========
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    delta: integer("delta").notNull(),
    type: creditTypeEnum("type").notNull(),
    refType: text("ref_type"), // 'reading', 'payment', etc.
    refId: uuid("ref_id"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // NO deleted_at - APPEND-ONLY AUDIT TRAIL
  },
  (table) => [
    index("credit_transactions_user_idx").on(table.userId),
    index("credit_transactions_created_idx").on(table.createdAt),
  ]
);

// ========== PAYMENTS ==========
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    provider: text("provider").notNull(), // 'stripe'
    externalId: text("external_id").notNull(), // Stripe Payment Intent ID
    status: paymentStatusEnum("status").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("BRL").notNull(),
    creditsPurchased: integer("credits_purchased").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("payments_user_idx").on(table.userId),
    uniqueIndex("payments_external_idx").on(table.externalId),
  ]
);

// ========== READING JOURNALS ==========
export const readingJournals = pgTable(
  "reading_journals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .references(() => readings.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("reading_journals_reading_idx").on(table.readingId),
    index("reading_journals_user_idx").on(table.userId),
  ]
);

// ========== AUDIT LOGS (APPEND-ONLY) ==========
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    event: text("event").notNull(), // e.g., 'reading.created', 'auth.login'
    level: text("level").default("info").notNull(), // 'info', 'warn', 'error'
    userId: uuid("user_id"),
    sessionId: text("session_id"),
    requestId: text("request_id"),
    ipAddressHash: text("ip_address_hash"), // SHA-256 hashed for privacy
    userAgent: text("user_agent"),
    resource: text("resource"),
    resourceId: text("resource_id"),
    action: text("action"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
    // NO deleted_at - APPEND-ONLY
  },
  (table) => [
    index("audit_logs_timestamp_idx").on(table.timestamp),
    index("audit_logs_user_idx").on(table.userId),
    index("audit_logs_event_idx").on(table.event),
    index("audit_logs_request_idx").on(table.requestId),
  ]
);

// ========== TYPES ==========
export interface ReadingAIOutput {
  summary: string;
  perCard: Array<{
    position: string;
    interpretation: string;
    advice?: string;
  }>;
  overallMessage: string;
  safetyReminder: string;
}

// ========== RELATIONS ==========
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  readings: many(readings),
  creditBalance: one(creditBalances),
  creditTransactions: many(creditTransactions),
  payments: many(payments),
  journals: many(readingJournals),
}));

export const tarotDecksRelations = relations(tarotDecks, ({ many }) => ({
  cards: many(tarotCards),
}));

export const tarotCardsRelations = relations(tarotCards, ({ one, many }) => ({
  deck: one(tarotDecks, {
    fields: [tarotCards.deckId],
    references: [tarotDecks.id],
  }),
  readingCards: many(readingCards),
}));

export const readingsRelations = relations(readings, ({ one, many }) => ({
  user: one(profiles, {
    fields: [readings.userId],
    references: [profiles.id],
  }),
  guestSession: one(guestSessions, {
    fields: [readings.guestSessionId],
    references: [guestSessions.id],
  }),
  cards: many(readingCards),
  journals: many(readingJournals),
}));

export const readingCardsRelations = relations(readingCards, ({ one }) => ({
  reading: one(readings, {
    fields: [readingCards.readingId],
    references: [readings.id],
  }),
  card: one(tarotCards, {
    fields: [readingCards.cardId],
    references: [tarotCards.id],
  }),
}));
```

### Database Triggers

```sql
-- Updated at trigger function
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tarot_decks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tarot_cards
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON readings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON credit_balances
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON reading_journals
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

---

## Security Architecture

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id AND deleted_at IS NULL);

-- Readings: Users see own readings
CREATE POLICY "Users can view own readings"
  ON readings FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own readings"
  ON readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Credit Balances: Users see own balance only
CREATE POLICY "Users can view own balance"
  ON credit_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Credit Transactions: Users see own transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Payments: Users see own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Reading Journals: Users see own journals
CREATE POLICY "Users can view own journals"
  ON reading_journals FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own journals"
  ON reading_journals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
  ON reading_journals FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Audit logs: Admin only (read-only)
CREATE POLICY "Admin can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
      AND deleted_at IS NULL
    )
  );
```

### Data Access Layer (DAL)

```typescript
// src/lib/dal/index.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export interface AuthUser {
  id: string;
  email: string;
  profile: {
    id: string;
    email: string;
    name: string | null;
    locale: string;
    isAdmin: boolean;
    createdAt: Date;
  } | null;
}

/**
 * Get current authenticated user with profile.
 * Uses React cache to prevent duplicate DB calls per request.
 *
 * SECURITY: This is the ONLY way to get user context.
 * NEVER use middleware for authentication (CVE-2025-29927).
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  // Get extended profile from Drizzle
  const [profile] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, user.id),
        isNull(profiles.deletedAt)
      )
    )
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    profile: profile ?? null,
  };
});

/**
 * Require authentication. Redirects to /login if not authenticated.
 */
export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

/**
 * Require admin access. Redirects to / if not admin.
 */
export const requireAdmin = cache(async (): Promise<AuthUser> => {
  const user = await requireUser();
  if (!user.profile?.isAdmin) {
    redirect("/");
  }
  return user;
});
```

### Security Headers

```typescript
// next.config.ts
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### Rate Limiting

```typescript
// src/lib/utils/rate-limit.ts
import { headers } from "next/headers";
import { createHash } from "crypto";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
};

/**
 * Check if request is rate limited.
 * Returns true if rate limit exceeded.
 */
export async function isRateLimited(
  identifier?: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  // Hash IP for privacy
  const key = identifier ?? createHash("sha256").update(ip).digest("hex");

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return false;
  }

  if (record.count >= config.maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  reading: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 readings/minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 auth attempts/15min
  payment: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 payment attempts/minute
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 API calls/minute
} as const;
```

---

## Error Handling Strategy

### Custom Error Classes

```typescript
// src/lib/errors/index.ts

/**
 * Base application error with structured information.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", context?: Record<string, unknown>) {
    super(message, "AUTH_REQUIRED", 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied", context?: Record<string, unknown>) {
    super(message, "PERMISSION_DENIED", 403, true, context);
  }
}

// Validation Errors
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, true, { ...context, field });
    this.field = field;
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404,
      true,
      { resource, id }
    );
  }
}

// Business Logic Errors
export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits: ${available} available, ${required} required`,
      "INSUFFICIENT_CREDITS",
      402,
      true,
      { required, available }
    );
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      "Rate limit exceeded. Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      429,
      true,
      { retryAfter }
    );
  }
}

// External Service Errors
export class LLMError extends AppError {
  constructor(message: string, provider: string, context?: Record<string, unknown>) {
    super(
      `LLM error (${provider}): ${message}`,
      "LLM_ERROR",
      502,
      true,
      { ...context, provider }
    );
  }
}

export class PaymentError extends AppError {
  constructor(message: string, provider: string, context?: Record<string, unknown>) {
    super(
      `Payment error (${provider}): ${message}`,
      "PAYMENT_ERROR",
      502,
      true,
      { ...context, provider }
    );
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, false, context);
  }
}
```

### Error Handling in Server Actions

```typescript
// src/app/actions/reading.ts
"use server";

import { z } from "zod";
import { requireUser, getUser } from "@/lib/dal";
import { isRateLimited, RATE_LIMITS } from "@/lib/utils/rate-limit";
import { TarotService } from "@/lib/services/tarot";
import { auditLog } from "@/lib/audit/logger";
import {
  ValidationError,
  RateLimitError,
  InsufficientCreditsError,
  AppError,
} from "@/lib/errors";

const CreateReadingSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question must be less than 500 characters"),
  spreadType: z.enum(["one", "three", "five"]),
  language: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
});

export type CreateReadingInput = z.infer<typeof CreateReadingSchema>;

export interface CreateReadingResult {
  success: boolean;
  data?: {
    readingId: string;
    summary: string;
  };
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export async function createReading(
  input: CreateReadingInput
): Promise<CreateReadingResult> {
  const startTime = Date.now();
  let userId: string | undefined;

  try {
    // 1. Rate limit check
    if (await isRateLimited(undefined, RATE_LIMITS.reading)) {
      throw new RateLimitError();
    }

    // 2. Validate input
    const validatedInput = CreateReadingSchema.safeParse(input);
    if (!validatedInput.success) {
      const firstError = validatedInput.error.errors[0];
      throw new ValidationError(
        firstError?.message ?? "Invalid input",
        firstError?.path.join(".")
      );
    }

    // 3. Get user (optional for demo)
    const user = await getUser();
    userId = user?.id;

    // 4. Create reading
    const tarotService = new TarotService();
    const reading = await tarotService.createReading({
      ...validatedInput.data,
      userId,
    });

    // 5. Audit log success
    await auditLog({
      event: "reading.created",
      level: "info",
      userId,
      resource: "readings",
      resourceId: reading.id,
      action: "create",
      success: true,
      durationMs: Date.now() - startTime,
      metadata: {
        spreadType: validatedInput.data.spreadType,
        language: validatedInput.data.language,
        model: reading.model,
      },
    });

    return {
      success: true,
      data: {
        readingId: reading.id,
        summary: reading.summary,
      },
    };
  } catch (error) {
    // Audit log failure
    const appError =
      error instanceof AppError
        ? error
        : new AppError("An unexpected error occurred", "INTERNAL_ERROR", 500, false);

    await auditLog({
      event: "reading.created",
      level: "error",
      userId,
      resource: "readings",
      action: "create",
      success: false,
      errorMessage: appError.message,
      durationMs: Date.now() - startTime,
      metadata: {
        errorCode: appError.code,
        isOperational: appError.isOperational,
      },
    });

    // Return structured error
    return {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        field: error instanceof ValidationError ? error.field : undefined,
      },
    };
  }
}
```

### React Error Boundaries

```typescript
// src/app/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We apologize for the inconvenience. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

---

## Testing Strategy

### Testing Pyramid

| Layer | Coverage Target | Tools | Focus |
|-------|-----------------|-------|-------|
| **Unit** | 80%+ | Vitest | Services, utilities, schemas |
| **Integration** | Key paths | Vitest + Supabase | DB operations, Server Actions |
| **E2E** | Critical flows | Playwright | User journeys |

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Example Unit Tests

```typescript
// src/lib/services/__tests__/tarot.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TarotService } from "../tarot";
import { db } from "@/lib/db";

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}));

describe("TarotService", () => {
  let service: TarotService;

  beforeEach(() => {
    service = new TarotService();
    vi.clearAllMocks();
  });

  describe("drawCards", () => {
    it("should draw correct number of cards for one-card spread", async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        id: `card-${i}`,
        code: `card_${i}`,
        name: `Card ${i}`,
        arcana: i < 22 ? "major" : "minor",
        suit: i < 22 ? "none" : "wands",
        cardIndex: i,
        keywordsUpright: ["keyword1"],
        keywordsReversed: ["keyword2"],
        descriptionUpright: "description",
        descriptionReversed: "description",
      }));

      vi.mocked(db.select).mockResolvedValueOnce(mockCards);

      const result = await service.drawCards("one");

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("card");
      expect(result[0]).toHaveProperty("positionRole");
      expect(result[0]).toHaveProperty("orientation");
      expect(["upright", "reversed"]).toContain(result[0]?.orientation);
    });

    it("should draw correct number of cards for three-card spread", async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        id: `card-${i}`,
        code: `card_${i}`,
        name: `Card ${i}`,
        arcana: i < 22 ? "major" : "minor",
        suit: i < 22 ? "none" : "wands",
        cardIndex: i,
        keywordsUpright: ["keyword1"],
        keywordsReversed: ["keyword2"],
        descriptionUpright: "description",
        descriptionReversed: "description",
      }));

      vi.mocked(db.select).mockResolvedValueOnce(mockCards);

      const result = await service.drawCards("three");

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.positionRole)).toEqual([
        "past",
        "present",
        "future",
      ]);
    });

    it("should draw unique cards only", async () => {
      const mockCards = Array.from({ length: 78 }, (_, i) => ({
        id: `card-${i}`,
        code: `card_${i}`,
        name: `Card ${i}`,
        arcana: i < 22 ? "major" : "minor",
        suit: i < 22 ? "none" : "wands",
        cardIndex: i,
        keywordsUpright: ["keyword1"],
        keywordsReversed: ["keyword2"],
        descriptionUpright: "description",
        descriptionReversed: "description",
      }));

      vi.mocked(db.select).mockResolvedValueOnce(mockCards);

      const result = await service.drawCards("five");

      const cardIds = result.map((r) => r.card.id);
      const uniqueCardIds = new Set(cardIds);
      expect(uniqueCardIds.size).toBe(5);
    });
  });

  describe("hashQuestion", () => {
    it("should produce consistent hash for same question", () => {
      const question = "What does my future hold?";
      const hash1 = service.hashQuestion(question);
      const hash2 = service.hashQuestion(question);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it("should produce different hash for different questions", () => {
      const hash1 = service.hashQuestion("Question 1");
      const hash2 = service.hashQuestion("Question 2");

      expect(hash1).not.toBe(hash2);
    });
  });
});
```

### Example E2E Tests

```typescript
// src/__tests__/e2e/reading.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Reading Flow", () => {
  test("should complete a demo reading", async ({ page }) => {
    // Navigate to demo reading page
    await page.goto("/reading");

    // Enter question
    await page.fill(
      '[data-testid="question-input"]',
      "What guidance do the cards have for my career?"
    );

    // Select spread type
    await page.click('[data-testid="spread-three"]');

    // Submit
    await page.click('[data-testid="draw-cards-button"]');

    // Wait for loading to complete
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({
      timeout: 30000,
    });

    // Verify cards are displayed
    await expect(page.locator('[data-testid="card-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-2"]')).toBeVisible();

    // Verify interpretation is shown
    await expect(page.locator('[data-testid="reading-summary"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="safety-reminder"]')
    ).toContainText(/symbolic|entertainment|not advice/i);
  });

  test("should validate question length", async ({ page }) => {
    await page.goto("/reading");

    // Enter too short question
    await page.fill('[data-testid="question-input"]', "Hi");

    // Try to submit
    await page.click('[data-testid="draw-cards-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="question-error"]')).toContainText(
      /at least 10 characters/i
    );
  });
});
```

---

## Performance Strategy

### Core Web Vitals Targets

| Metric | Target | Budget |
|--------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Good |
| **INP** (Interaction to Next Paint) | < 200ms | Good |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Good |
| **TTFB** (Time to First Byte) | < 500ms | - |
| **FCP** (First Contentful Paint) | < 1.8s | - |

### Performance Monitoring

```typescript
// src/lib/utils/performance.ts
import { headers } from "next/headers";

export interface PerformanceMetrics {
  startTime: number;
  serverTime?: number;
  dbTime?: number;
  llmTime?: number;
}

/**
 * Create a performance tracker for measuring operation timings.
 */
export function createPerformanceTracker(): PerformanceMetrics & {
  trackDb: () => () => void;
  trackLlm: () => () => void;
  getMetrics: () => PerformanceMetrics;
} {
  const metrics: PerformanceMetrics = {
    startTime: Date.now(),
  };

  return {
    ...metrics,
    trackDb: () => {
      const start = Date.now();
      return () => {
        metrics.dbTime = (metrics.dbTime ?? 0) + (Date.now() - start);
      };
    },
    trackLlm: () => {
      const start = Date.now();
      return () => {
        metrics.llmTime = Date.now() - start;
      };
    },
    getMetrics: () => {
      metrics.serverTime = Date.now() - metrics.startTime;
      return metrics;
    },
  };
}

/**
 * Log performance metrics for a request.
 */
export async function logPerformanceMetrics(
  operation: string,
  metrics: PerformanceMetrics
): Promise<void> {
  const headerList = await headers();
  const requestId = headerList.get("x-request-id") ?? "unknown";

  console.log(
    JSON.stringify({
      type: "performance",
      operation,
      requestId,
      metrics: {
        totalMs: metrics.serverTime,
        dbMs: metrics.dbTime,
        llmMs: metrics.llmTime,
      },
      timestamp: new Date().toISOString(),
    })
  );
}
```

### Caching Strategy

```typescript
// src/lib/cache/index.ts
import { unstable_cache } from "next/cache";

/**
 * Cache the default tarot deck for fast access.
 * Invalidate when deck is updated.
 */
export const getDefaultDeck = unstable_cache(
  async () => {
    const { db } = await import("@/lib/db");
    const { tarotDecks, tarotCards } = await import("@/lib/db/schema");
    const { eq, isNull, and } = await import("drizzle-orm");

    const [deck] = await db
      .select()
      .from(tarotDecks)
      .where(
        and(eq(tarotDecks.isDefault, true), isNull(tarotDecks.deletedAt))
      )
      .limit(1);

    if (!deck) return null;

    const cards = await db
      .select()
      .from(tarotCards)
      .where(
        and(eq(tarotCards.deckId, deck.id), isNull(tarotCards.deletedAt))
      );

    return { deck, cards };
  },
  ["default-deck"],
  {
    revalidate: 3600, // 1 hour
    tags: ["tarot-deck"],
  }
);

/**
 * Invalidate deck cache when deck is modified.
 */
export async function invalidateDeckCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  revalidateTag("tarot-deck");
}
```

---

## Observability & Logging

### Structured Logging

```typescript
// src/lib/audit/logger.ts
import "server-only";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface AuditLogInput {
  event: string;
  level?: "info" | "warn" | "error";
  userId?: string;
  sessionId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event to the database.
 * CRITICAL: Audit logs are append-only and never deleted.
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    const headerList = await headers();
    const requestId = headerList.get("x-request-id") ?? crypto.randomUUID();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const userAgent = headerList.get("user-agent") ?? undefined;

    // Hash IP for privacy (per AUDIT-GUIDELINES)
    const ipAddressHash = createHash("sha256").update(ip).digest("hex");

    await db.insert(auditLogs).values({
      event: input.event,
      level: input.level ?? "info",
      userId: input.userId,
      sessionId: input.sessionId,
      requestId,
      ipAddressHash,
      userAgent: userAgent?.slice(0, 200), // Truncate for storage
      resource: input.resource,
      resourceId: input.resourceId,
      action: input.action,
      success: input.success,
      errorMessage: input.errorMessage?.slice(0, 500), // Truncate
      durationMs: input.durationMs,
      metadata: input.metadata,
    });
  } catch (error) {
    // Log to console as fallback - never fail silently
    console.error("Failed to write audit log:", {
      input,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Create a structured log for console output.
 */
export function structuredLog(
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>
): void {
  const log = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(log));
  } else if (level === "warn") {
    console.warn(JSON.stringify(log));
  } else {
    console.log(JSON.stringify(log));
  }
}
```

---

## LLM Integration

### Provider Abstraction

```typescript
// src/lib/llm/service.ts
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { LLMError } from "@/lib/errors";
import { structuredLog } from "@/lib/audit/logger";

// Structured output schema with strict typing
export const ReadingOutputSchema = z.object({
  summary: z
    .string()
    .min(20)
    .max(200)
    .describe("1-2 sentence synthesis of the reading"),
  perCard: z.array(
    z.object({
      position: z.string(),
      interpretation: z.string().min(50).max(500),
      advice: z.string().max(200).optional(),
    })
  ),
  overallMessage: z.string().min(50).max(500),
  safetyReminder: z
    .string()
    .describe("Reminder that this is symbolic, not advice"),
});

export type ReadingOutput = z.infer<typeof ReadingOutputSchema>;

// System prompt with safety guardrails
const SYSTEM_PROMPT = `You are a wise, empathetic tarot reader providing symbolic interpretations.

CRITICAL SAFETY RULES - NEVER VIOLATE:
1. This is SYMBOLIC REFLECTION ONLY, not prediction
2. NEVER claim certainty about future events
3. NEVER provide medical, legal, financial, or psychological advice
4. NEVER diagnose conditions or prescribe actions
5. Always frame interpretations as possibilities for reflection
6. Include a gentle reminder that this is for entertainment and self-reflection

HARD BLOCKS - If the question involves these topics, provide a gentle redirect:
- Medical symptoms or diagnoses
- Legal advice or decisions
- Financial advice or investment decisions
- Mental health diagnoses or treatment
- Predictions about death, illness, or accidents

Respond in the user's language. Be warm, thoughtful, and grounded.`;

export interface GenerateReadingInput {
  question: string;
  cards: Array<{
    name: string;
    positionRole: string;
    orientation: "upright" | "reversed";
    keywords: string[];
    description: string;
  }>;
  language: "pt-BR" | "en-US";
}

export interface GenerateReadingResult {
  output: ReadingOutput;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  latencyMs: number;
}

// Cost tracking (per 1M tokens, approximate)
const COST_PER_MILLION_TOKENS = {
  "gemini-2.0-flash-exp": { input: 0.075, output: 0.30 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
};

// Daily budget limit in USD
const DAILY_BUDGET_USD = 50;
let dailySpend = 0;
let lastResetDate = new Date().toDateString();

function checkBudget(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpend = 0;
    lastResetDate = today;
  }
  if (dailySpend >= DAILY_BUDGET_USD) {
    throw new LLMError("Daily LLM budget exceeded", "budget");
  }
}

function trackCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): void {
  const costs =
    COST_PER_MILLION_TOKENS[model as keyof typeof COST_PER_MILLION_TOKENS];
  if (costs) {
    const cost =
      (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000;
    dailySpend += cost;

    structuredLog("info", "LLM cost tracked", {
      model,
      promptTokens,
      completionTokens,
      costUsd: cost.toFixed(6),
      dailySpendUsd: dailySpend.toFixed(2),
    });
  }
}

/**
 * Generate a tarot reading using LLM with provider fallback.
 */
export async function generateReading(
  input: GenerateReadingInput
): Promise<GenerateReadingResult> {
  // Check budget before proceeding
  checkBudget();

  const startTime = Date.now();
  const userPrompt = buildUserPrompt(input);

  // Try Gemini first (primary provider)
  try {
    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: ReadingOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    const latencyMs = Date.now() - startTime;
    const promptTokens = result.usage?.promptTokens ?? 0;
    const completionTokens = result.usage?.completionTokens ?? 0;

    trackCost("gemini-2.0-flash-exp", promptTokens, completionTokens);

    structuredLog("info", "LLM generation successful", {
      provider: "google",
      model: "gemini-2.0-flash-exp",
      latencyMs,
      promptTokens,
      completionTokens,
    });

    return {
      output: result.object,
      model: "gemini-2.0-flash-exp",
      tokensPrompt: promptTokens,
      tokensCompletion: completionTokens,
      latencyMs,
    };
  } catch (geminiError) {
    structuredLog("warn", "Gemini failed, falling back to OpenAI", {
      error:
        geminiError instanceof Error ? geminiError.message : "Unknown error",
    });

    // Fallback to OpenAI
    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: ReadingOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        maxTokens: 2000,
      });

      const latencyMs = Date.now() - startTime;
      const promptTokens = result.usage?.promptTokens ?? 0;
      const completionTokens = result.usage?.completionTokens ?? 0;

      trackCost("gpt-4o-mini", promptTokens, completionTokens);

      structuredLog("info", "LLM generation successful (fallback)", {
        provider: "openai",
        model: "gpt-4o-mini",
        latencyMs,
        promptTokens,
        completionTokens,
      });

      return {
        output: result.object,
        model: "gpt-4o-mini",
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
        latencyMs,
      };
    } catch (openaiError) {
      structuredLog("error", "All LLM providers failed", {
        geminiError:
          geminiError instanceof Error ? geminiError.message : "Unknown",
        openaiError:
          openaiError instanceof Error ? openaiError.message : "Unknown",
      });

      throw new LLMError(
        "All LLM providers failed. Please try again later.",
        "all",
        {
          geminiError:
            geminiError instanceof Error ? geminiError.message : "Unknown",
          openaiError:
            openaiError instanceof Error ? openaiError.message : "Unknown",
        }
      );
    }
  }
}

function buildUserPrompt(input: GenerateReadingInput): string {
  const languageInstruction =
    input.language === "pt-BR"
      ? "Responda em português brasileiro."
      : "Respond in English.";

  const cardsDescription = input.cards
    .map(
      (card, i) =>
        `${i + 1}. ${card.name} (${card.positionRole}, ${card.orientation})
   Keywords: ${card.keywords.join(", ")}
   Meaning: ${card.description}`
    )
    .join("\n\n");

  return `${languageInstruction}

Question: "${input.question}"

Cards drawn:
${cardsDescription}

Please provide a thoughtful, symbolic interpretation that helps the querent reflect on their situation. Remember: this is for personal insight and entertainment, not prediction or advice.`;
}
```

---

## Phased Implementation Plan

### PHASE 0: Foundation Improvements (1 day)

**Goals**: Fix current issues, add missing infrastructure

- [ ] **0.1** Add security headers to next.config.ts
- [ ] **0.2** Implement rate limiting utility
- [ ] **0.3** Create custom error classes
- [ ] **0.4** Set up audit logging infrastructure
- [ ] **0.5** Add database indexes to schema
- [ ] **0.6** Configure Vitest for testing
- [ ] **0.7** Add global error boundary

### PHASE 1: Tarot Core Demo (3 days)

**Goals**: Working demo reading without auth

- [ ] **1.1** Seed tarot deck (78 cards, pt-BR)
  - [ ] Create seed script
  - [ ] Add card descriptions
  - [ ] Test seeding
- [ ] **1.2** Implement TarotService
  - [ ] Card drawing logic
  - [ ] Spread configurations
  - [ ] Question hashing
  - [ ] Write unit tests
- [ ] **1.3** Create demo reading page
  - [ ] Question input with validation
  - [ ] Spread selector
  - [ ] Card display with flip animation
  - [ ] Loading states
- [ ] **1.4** Integrate LLM service
  - [ ] Implement provider abstraction
  - [ ] Add cost tracking
  - [ ] Test with real API
- [ ] **1.5** Create Server Action for demo reading
  - [ ] Input validation
  - [ ] Rate limiting
  - [ ] Audit logging
  - [ ] Error handling

### PHASE 2: Authentication (2 days)

**Goals**: Add user authentication with Supabase

- [ ] **2.1** Configure Supabase Auth
  - [ ] Google OAuth
  - [ ] Email/password
  - [ ] RLS policies
- [ ] **2.2** Implement DAL pattern
  - [ ] getUser cached function
  - [ ] requireUser with redirect
  - [ ] requireAdmin check
- [ ] **2.3** Create auth pages
  - [ ] Login page
  - [ ] Sign up page
  - [ ] Profile page
- [ ] **2.4** Add guest session handling
  - [ ] Cookie-based tracking
  - [ ] Free reading counter
  - [ ] Upsell to registration

### PHASE 3: Credits System (2 days)

**Goals**: Implement credits and quotas

- [ ] **3.1** Create credits service
  - [ ] Balance queries
  - [ ] Transaction recording
  - [ ] Welcome credits on signup
- [ ] **3.2** Integrate with reading flow
  - [ ] Check balance before reading
  - [ ] Deduct in transaction
  - [ ] Handle insufficient credits
- [ ] **3.3** Create credits UI
  - [ ] Balance display in header
  - [ ] Transaction history
  - [ ] Low balance warning

### PHASE 4: Payments (3 days)

**Goals**: Add Stripe payments

- [ ] **4.1** Stripe integration
  - [ ] Checkout session creation
  - [ ] Webhook handler
  - [ ] Signature verification
- [ ] **4.2** Payment pages
  - [ ] Credit packages page
  - [ ] Checkout flow
  - [ ] Success/cancel pages
- [ ] **4.3** Testing
  - [ ] Test mode payments
  - [ ] Webhook testing
  - [ ] Error scenarios

### PHASE 5: History & Journaling (2 days)

**Goals**: Add reading history and notes

- [ ] **5.1** History page
  - [ ] Paginated list
  - [ ] Search/filter
  - [ ] Delete (soft)
- [ ] **5.2** Reading detail page
  - [ ] Full interpretation
  - [ ] Card details
  - [ ] Share link (privacy-safe)
- [ ] **5.3** Journaling
  - [ ] Rich text editor
  - [ ] Auto-save
  - [ ] Edit/delete

### PHASE 6: Polish & Launch (2 days)

**Goals**: Production readiness

- [ ] **6.1** i18n (pt-BR / en-US)
- [ ] **6.2** Mobile responsive polish
- [ ] **6.3** Accessibility audit (WCAG 2.2 AA)
- [ ] **6.4** Performance audit (Core Web Vitals)
- [ ] **6.5** Security audit
- [ ] **6.6** E2E test suite
- [ ] **6.7** Documentation

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: .next
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
```

---

## Deployment & Operations

### Environment Variables

```bash
# .env.example

# ============ Database ============
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# ============ Supabase ============
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ============ Auth ============
AUTH_SECRET=generate-with-openssl-rand-base64-32

# ============ LLM Providers ============
GOOGLE_GENERATIVE_AI_API_KEY=
OPENAI_API_KEY=

# ============ Payments ============
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ============ Observability ============
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# ============ Feature Flags ============
ENABLE_PAYMENTS=false
ENABLE_AUTH=false
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "regions": ["gru1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-DNS-Prefetch-Control",
          "value": "on"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-sessions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Compliance Checklist

### Guideline Compliance Matrix

| Guideline | Requirement | Status | Implementation |
|-----------|-------------|--------|----------------|
| **WEB-NEXTJS** | Async request APIs | ✅ | All cookies/headers/params awaited |
| **WEB-NEXTJS** | DAL pattern for auth | ✅ | `lib/dal/index.ts` |
| **WEB-NEXTJS** | Server Actions for mutations | ✅ | `app/actions/` |
| **WEB-NEXTJS** | React Compiler enabled | ✅ | `next.config.ts` |
| **DB-GUIDELINES** | Soft deletes | ✅ | `deleted_at` on all tables |
| **DB-GUIDELINES** | Transactions | ✅ | `db.transaction()` for multi-ops |
| **DB-GUIDELINES** | Indexes | ✅ | Defined in schema |
| **DB-GUIDELINES** | Foreign keys | ✅ | All relations defined |
| **AUDIT-GUIDELINES** | Append-only audit logs | ✅ | `auditLogs` table, no `deleted_at` |
| **AUDIT-GUIDELINES** | Complete 5W+H | ✅ | All fields in audit events |
| **AUDIT-GUIDELINES** | Privacy-first (hashed PII) | ✅ | IP hashed, PII excluded |
| **SECURITY-GUIDELINES** | RLS enabled | ✅ | Policies on all tables |
| **SECURITY-GUIDELINES** | Input validation | ✅ | Zod schemas |
| **SECURITY-GUIDELINES** | Rate limiting | ✅ | Per-endpoint limits |
| **SECURITY-GUIDELINES** | Security headers | ✅ | CSP, HSTS, etc. |
| **SUPABASE-GUIDELINES** | RLS-first | ✅ | Policies defined |
| **SUPABASE-GUIDELINES** | Service role key server-only | ✅ | Never exposed |
| **DEV-GUIDELINES** | Testing pyramid | ✅ | Unit/Integration/E2E |
| **DEV-GUIDELINES** | Error handling | ✅ | Custom error classes |
| **DEV-GUIDELINES** | TypeScript strict | ✅ | `exactOptionalPropertyTypes` |
| **REACT-GUIDELINES** | Server Components default | ✅ | `'use client'` only when needed |
| **REACT-GUIDELINES** | Error boundaries | ✅ | `error.tsx` at app level |

---

## Success Criteria

### Demo MVP (Phases 0-2)
- [ ] Working tarot reading without authentication
- [ ] AI interpretations with safety disclaimers
- [ ] Mobile-responsive design
- [ ] < 4s p95 latency for readings
- [ ] Zero critical security vulnerabilities

### Full MVP (Phases 3-6)
- [ ] User authentication working
- [ ] Credits system operational
- [ ] Payments processing (Stripe)
- [ ] Reading history with journaling
- [ ] i18n (pt-BR / en-US)
- [ ] WCAG 2.2 AA compliance
- [ ] Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] 80%+ test coverage
- [ ] All guideline compliance checks passing

---

## Appendix: Development Commands

```bash
# Development (Turbopack is default in Next.js 16)
pnpm dev                       # Start dev server
pnpm build                     # Production build
pnpm start                     # Start production server

# Code Quality (Next.js 16 removed next lint)
pnpm lint                      # Biome lint
pnpm format                    # Biome format
pnpm check                     # Biome check (lint + format + fix)
pnpm typecheck                 # TypeScript checks

# Database
pnpm db:generate               # Generate Drizzle migrations
pnpm db:migrate                # Apply migrations
pnpm db:push                   # Push schema changes
pnpm db:studio                 # Open Drizzle Studio
pnpm db:seed                   # Seed tarot deck

# Testing
pnpm test                      # Run Vitest
pnpm test:watch                # Watch mode
pnpm test:coverage             # Coverage report
pnpm test:e2e                  # Run Playwright E2E tests
```
