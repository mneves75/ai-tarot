# AI Tarot - Engineering Execution Plan

## Executive Summary

This plan creates a world-class AI Tarot application that improves upon the original PRD by:
1. **Fixing critical errors** (Next.js version, auth vulnerability, ORM choice)
2. **Adding mandatory requirements** (audit logging, RLS, structured observability)
3. **Leveraging modern 2025 stack** (Supabase full platform, Vercel AI SDK, Drizzle ORM)
4. **Following all GUIDELINES-REF standards** (security, database, logging, audit)

---

## Critical PRD Corrections

### Issues Identified & Fixes

| PRD Issue | Problem | Fix |
|-----------|---------|-----|
| Prisma ORM | Not edge-compatible | Use **Drizzle ORM** (7.4kb, edge-ready) |
| Middleware auth | Vulnerable + deprecated in Next.js 16 | Use **Data Access Layer (DAL)** + **proxy.ts** |
| No audit logging | Violates AUDIT-GUIDELINES | Add **comprehensive audit trails** |
| No RLS | Security risk for multi-tenant | Add **Row Level Security** policies |
| Basic logging | Insufficient observability | Add **OpenTelemetry + structured logging** |
| Supabase underused | Only uses DB | Leverage **Auth, RLS, Queues, Edge Functions** |
| No soft deletes on all tables | Data loss risk | Add **deleted_at to ALL tables** |
| Sync API usage | Next.js 16 requires async | All `cookies()`, `headers()`, `params` must be awaited |

---

## Technology Stack (2025 Best Practices)

### Core Stack
- **Framework**: Next.js 16.x (App Router, Server Actions, Cache Components, Turbopack)
- **Runtime**: React 19.2 with Server Components + React Compiler (stable)
- **Database**: Supabase PostgreSQL + pgvector
- **ORM**: Drizzle ORM (edge-compatible, type-safe)
- **Auth**: Supabase Auth (RLS-integrated, server-side)
- **LLM**: Vercel AI SDK with provider abstraction
- **Payments**: Stripe (Pix + Card support)
- **Hosting**: Vercel (optimized for Next.js)

### Next.js 16 Key Changes (CRITICAL)
- **Turbopack default**: Stable for dev and build
- **React Compiler stable**: Auto-memoization, no more useMemo/useCallback bloat
- **Proxy replaces Middleware**: Rename `middleware.ts` → `proxy.ts`
- **Async request APIs**: `cookies()`, `headers()`, `params`, `searchParams` are ALL async
- **Cache Components**: Replaces experimental PPR (`cacheComponents` config)
- **New caching APIs**: `updateTag`, `revalidateTag`, `cacheLife`, `cacheTag` (stable)
- **Node.js 20.9+ required**
- **No AMP, no `next lint`** (use ESLint/Biome directly)

### Supporting Services
- **Queues**: Supabase Queues (pgmq) for async processing
- **Observability**: OpenTelemetry + Sentry + Vercel Analytics
- **Caching**: unstable_cache + Redis (optional)
- **i18n**: next-intl (pt-BR / en-US)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Static Pages│  │Server Comps │  │    Server Actions       │  │
│  │ (Landing)   │  │ (Dashboard) │  │ (createReading, etc)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │  Supabase Auth  │  │   Vercel AI SDK │
          │  (RLS + DAL)    │  │  (Gemini/OpenAI)│
          └─────────────────┘  └─────────────────┘
                    │                   │
                    ▼                   │
          ┌─────────────────────────────┴──────────┐
          │         Supabase PostgreSQL            │
          │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
          │  │  Tables  │ │   RLS    │ │pgvector│ │
          │  │(Drizzle) │ │ Policies │ │  (AI)  │ │
          │  └──────────┘ └──────────┘ └────────┘ │
          │  ┌──────────┐ ┌──────────┐            │
          │  │ Queues   │ │  Cron    │            │
          │  │ (pgmq)   │ │(pg_cron) │            │
          │  └──────────┘ └──────────┘            │
          └────────────────────────────────────────┘
```

---

## User Decisions (Confirmed)

| Decision | Choice | Notes |
|----------|--------|-------|
| Payment Provider | **Stripe** | Pix + Card support, excellent DX |
| Welcome Credits | **3 credits** | Conservative, encourages quick conversion |
| MVP Scope | **Demo First** | Ship demo without auth/payments, add later |
| Card Images | **Gemini Generation** | AI-generated tarot card artwork |
| Guest Free Readings | **3 readings** | Per session, cookie-based tracking |

---

## Phased Implementation (Demo First)

### DEMO MVP (Phases 0-2) - Ship Fast, No Auth

**Goal**: Working tarot reading app with demo account, no login required.

**Phase 0: Foundation (2 days)**
- [ ] Next.js 16 project setup (Turbopack, React Compiler)
- [ ] Supabase project + Drizzle ORM connection
- [ ] Base UI components (shadcn/ui)
- [ ] Biome linting setup
- [ ] Vercel deployment

**Phase 1: Tarot Core Demo (3 days)**
- [ ] Tarot deck schema + seed data (78 cards, pt-BR/en-US)
- [ ] Generate card images with Gemini
- [ ] TarotService: card drawing, spread logic
- [ ] Demo reading page (no credits, unlimited)
- [ ] Card flip animations, spread visualizations

**Phase 2: AI Integration Demo (2 days)**
- [ ] Vercel AI SDK + Gemini integration
- [ ] Structured output with safety prompts
- [ ] Demo readings with real AI interpretations
- [ ] Basic error handling + fallback to OpenAI

**DEMO MILESTONE**: Shareable demo at `demo.ai-tarot.com`

---

### FULL MVP (Phases 3-6) - Add Auth & Monetization

**Phase 3: Authentication (2 days)**
- [ ] Supabase Auth (Google + email/password)
- [ ] DAL pattern implementation
- [ ] RLS policies on all tables
- [ ] User profile management
- [ ] Guest session tracking

**Phase 4: Credits System (2 days)**
- [ ] Credit balances + transactions
- [ ] 3 welcome credits on signup
- [ ] 3 free readings for guests
- [ ] Credit deduction in transactions

**Phase 5: Payments - Stripe (3 days)**
- [ ] Stripe checkout integration
- [ ] Pix + Card payment methods
- [ ] Webhook handling
- [ ] Credit packages (10, 30, 100)
- [ ] Payment audit logging

**Phase 6: History & Polish (3 days)**
- [ ] Reading history page
- [ ] Journaling feature
- [ ] Sharing (privacy-safe)
- [ ] i18n (pt-BR / en-US)
- [ ] Mobile responsive polish

**FULL MVP MILESTONE**: Production-ready at `ai-tarot.com`

---

### POST-MVP (Phase 7+) - Scale & Admin

**Phase 7: Admin Dashboard**
- [ ] Admin authentication
- [ ] Metrics dashboard
- [ ] Reading moderation
- [ ] User management

**Phase 8: Observability**
- [ ] OpenTelemetry integration
- [ ] Sentry error tracking
- [ ] Audit log viewer
- [ ] Performance monitoring

---

## Database Schema (Drizzle)

**Core Tables with MANDATORY columns:**
- `id` (UUID, primary key)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, auto-update trigger)
- `deleted_at` (timestamp, nullable - SOFT DELETE)

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const spreadTypeEnum = pgEnum('spread_type', ['one', 'three', 'five']);
export const arcanaEnum = pgEnum('arcana', ['major', 'minor']);
export const suitEnum = pgEnum('suit', ['wands', 'cups', 'swords', 'pentacles', 'none']);
export const orientationEnum = pgEnum('orientation', ['upright', 'reversed']);
export const creditTypeEnum = pgEnum('credit_type', ['reading', 'purchase', 'bonus', 'adjustment', 'refund']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);

// Users (managed by Supabase Auth, extended)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  locale: text('locale').default('pt-BR'),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Guest Sessions
export const guestSessions = pgTable('guest_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  freeReadingsUsed: integer('free_readings_used').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Tarot Decks
export const tarotDecks = pgTable('tarot_decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  locale: text('locale').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Tarot Cards
export const tarotCards = pgTable('tarot_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  deckId: uuid('deck_id').references(() => tarotDecks.id).notNull(),
  code: text('code').notNull(), // e.g., 'major_00_the_fool'
  name: text('name').notNull(),
  arcana: arcanaEnum('arcana').notNull(),
  suit: suitEnum('suit').notNull(),
  index: integer('index').notNull(), // 0-77
  keywordsUpright: jsonb('keywords_upright').notNull(),
  keywordsReversed: jsonb('keywords_reversed').notNull(),
  descriptionUpright: text('description_upright').notNull(),
  descriptionReversed: text('description_reversed').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Readings
export const readings = pgTable('readings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id),
  guestSessionId: uuid('guest_session_id').references(() => guestSessions.id),
  question: text('question').notNull(),
  questionHash: text('question_hash').notNull(), // SHA-256 for dedup/audit
  spreadType: spreadTypeEnum('spread_type').notNull(),
  language: text('language').default('pt-BR').notNull(),
  summary: text('summary'),
  aiOutput: jsonb('ai_output'), // Structured output
  model: text('model').notNull(),
  tokensPrompt: integer('tokens_prompt'),
  tokensCompletion: integer('tokens_completion'),
  latencyMs: integer('latency_ms'),
  creditsSpent: integer('credits_spent').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Reading Cards
export const readingCards = pgTable('reading_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  readingId: uuid('reading_id').references(() => readings.id).notNull(),
  cardId: uuid('card_id').references(() => tarotCards.id).notNull(),
  positionIndex: integer('position_index').notNull(),
  positionRole: text('position_role').notNull(),
  orientation: orientationEnum('orientation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Credit Balances
export const creditBalances = pgTable('credit_balances', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id),
  credits: integer('credits').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit Transactions (AUDIT TRAIL - APPEND ONLY)
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  delta: integer('delta').notNull(),
  type: creditTypeEnum('type').notNull(),
  refType: text('ref_type'),
  refId: uuid('ref_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // NO deleted_at - this is append-only audit trail
});

// Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  provider: text('provider').notNull(),
  externalId: text('external_id').notNull(),
  status: paymentStatusEnum('status').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('BRL').notNull(),
  creditsPurchased: integer('credits_purchased').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Journals
export const readingJournals = pgTable('reading_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  readingId: uuid('reading_id').references(() => readings.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Audit Logs (APPEND-ONLY, per AUDIT-GUIDELINES)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  event: text('event').notNull(),
  level: text('level').default('info').notNull(),
  userId: uuid('user_id'),
  sessionId: text('session_id'),
  requestId: text('request_id'),
  ipAddressHash: text('ip_address_hash'),
  userAgent: text('user_agent'),
  resource: text('resource'),
  resourceId: text('resource_id'),
  action: text('action'),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  metadata: jsonb('metadata'),
  // NO deleted_at - append-only
});
```

---

## RLS Policies (Supabase)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_journals ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Readings: Users see own readings, guests see via session
CREATE POLICY "Users can view own readings" ON readings
  FOR SELECT USING (
    auth.uid() = user_id
    OR guest_session_id IN (SELECT id FROM guest_sessions WHERE id = current_setting('app.guest_session_id', true)::uuid)
  );

-- Credit Balances: Users see own balance only
CREATE POLICY "Users can view own balance" ON credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Audit logs: Admin only
CREATE POLICY "Admin can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## Authentication (DAL Pattern)

```typescript
// lib/dal.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';
import { redirect } from 'next/navigation';

// Cached auth check - prevents multiple DB calls per request
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get extended profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, profile };
});

// Require auth - redirects if not authenticated
export const requireUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
});

// Require admin
export const requireAdmin = cache(async () => {
  const user = await requireUser();
  if (!user.profile?.isAdmin) {
    redirect('/');
  }
  return user;
});
```

---

## LLM Provider Abstraction (Vercel AI SDK)

```typescript
// lib/llm/service.ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Structured output schema
const readingOutputSchema = z.object({
  summary: z.string().describe('1-2 sentence synthesis of the reading'),
  perCard: z.array(z.object({
    position: z.string(),
    interpretation: z.string(),
    advice: z.string().optional(),
  })),
  overallMessage: z.string(),
  safetyReminder: z.string().describe('Reminder that this is symbolic, not advice'),
});

// System prompt with safety guardrails
const SYSTEM_PROMPT = `You are a wise, empathetic tarot reader providing symbolic interpretations.

CRITICAL RULES:
- This is SYMBOLIC REFLECTION ONLY, not prediction
- NEVER claim certainty about future events
- NEVER provide medical, legal, financial, or psychological advice
- NEVER diagnose conditions or prescribe actions
- Always frame interpretations as possibilities for reflection
- Include a gentle reminder that this is for entertainment and self-reflection

Respond in the user's language. Be warm, thoughtful, and grounded.`;

export async function generateReading(input: {
  question: string;
  cards: Array<{ card: TarotCard; positionRole: string; orientation: string }>;
  language: string;
}) {
  const userPrompt = buildUserPrompt(input);

  // Try Gemini first, fallback to OpenAI
  try {
    const result = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: readingOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    return {
      output: result.object,
      summary: result.object.summary,
      model: 'gemini-2.0-flash-exp',
      tokensPrompt: result.usage?.promptTokens ?? 0,
      tokensCompletion: result.usage?.completionTokens ?? 0,
    };
  } catch (error) {
    // Fallback to OpenAI
    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: readingOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 2000,
    });

    return {
      output: result.object,
      summary: result.object.summary,
      model: 'gpt-4o-mini',
      tokensPrompt: result.usage?.promptTokens ?? 0,
      tokensCompletion: result.usage?.completionTokens ?? 0,
    };
  }
}
```

---

## Development Commands

```bash
# Development (Turbopack is default in Next.js 16)
pnpm dev                    # Start dev server (Turbopack default)
pnpm build                  # Production build (Turbopack default)
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio
pnpm db:seed                # Seed tarot deck

# Testing
pnpm test                   # Run Vitest
pnpm test:e2e               # Run Playwright
pnpm test:coverage          # Coverage report

# Code Quality (Next.js 16 removed `next lint` - use Biome/ESLint directly)
pnpm lint                   # Biome lint + ESLint (no next lint in v16)
pnpm format                 # Biome format (replaces Prettier)
pnpm typecheck              # TypeScript
pnpm check                  # Biome check (lint + format)

# Supabase
pnpm supabase:start         # Start local Supabase
pnpm supabase:diff          # Generate migration from diff
pnpm supabase:push          # Push to remote
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
AUTH_SECRET=...

# LLM Providers
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Observability
SENTRY_DSN=https://...
```

---

## Critical Guideline Compliance

| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| WEB-NEXTJS | DAL pattern for auth | `lib/dal.ts` with cached `getUser()` |
| WEB-NEXTJS | Server Actions for mutations | All mutations in `app/actions/` |
| WEB-NEXTJS | Cache Components (Next.js 16) | `cacheComponents: true` in next.config |
| WEB-NEXTJS | Async request APIs (Next.js 16) | All `cookies()`, `headers()`, `params` awaited |
| WEB-NEXTJS | Proxy replaces Middleware | Use `proxy.ts` instead of `middleware.ts` |
| DB-GUIDELINES | Soft deletes | `deleted_at` on all tables |
| DB-GUIDELINES | Transactions | All multi-table ops in `db.transaction()` |
| DB-GUIDELINES | Indexes | Created on FKs, frequently queried columns |
| AUDIT-GUIDELINES | Append-only audit logs | `auditLogs` table, no `deleted_at` |
| AUDIT-GUIDELINES | Complete 5W+H | All audit events include who/what/when/where/why/how |
| SECURITY-GUIDELINES | RLS | Policies on all tables |
| SECURITY-GUIDELINES | Input validation | Zod schemas on all Server Actions |
| SUPABASE-GUIDELINES | Branch workflow | Feature branches for all changes |
| SUPABASE-GUIDELINES | Queues for async | pgmq for background tasks |

---

## Files to Create (Demo MVP)

```
ai-tarot/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── (demo)/
│   │   ├── layout.tsx             # Demo layout
│   │   └── read/
│   │       └── page.tsx           # Demo reading page
│   ├── actions/
│   │   └── demo-reading.ts        # Demo createReading (no credits)
│   └── api/
│       └── health/route.ts        # Health check
├── lib/
│   ├── db/
│   │   ├── index.ts               # Drizzle client
│   │   ├── schema.ts              # Full schema
│   │   └── queries/               # Query functions
│   ├── tarot/
│   │   ├── service.ts             # TarotService
│   │   ├── spreads.ts             # Spread configs
│   │   └── types.ts               # Types
│   ├── llm/
│   │   ├── service.ts             # LLM abstraction
│   │   └── prompts.ts             # System prompts
│   └── audit/
│       └── logger.ts              # Audit logging
├── components/
│   ├── ui/                        # shadcn/ui
│   └── tarot/
│       ├── card.tsx               # TarotCard
│       ├── spread.tsx             # SpreadLayout
│       └── reading.tsx            # ReadingResult
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── next.config.ts
├── biome.json
└── package.json
```
