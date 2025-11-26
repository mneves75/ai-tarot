# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Mystic Tarot is a web application providing AI-powered tarot readings with per-card interpretations and overall synthesis. Users can ask questions, select spreads (1/3/5 cards), and receive symbolic, non-predictive interpretations. The app supports guest and authenticated users, with a credits-based system for readings.

Key characteristics:
- Bilingual support (en-US / pt-BR, defaults to user browser)
- Credits and free quota system for monetization
- Journaling for personal reflection on readings
- Provider abstraction for LLM fallback resilience
- Privacy-first design (LGPD/GDPR-style data handling)

Tech stack:
- **Framework**: Next.js 16 (App Router, Server Actions, Turbopack, React Compiler)
- **Runtime**: React 19 with Server Components
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Auth**: Supabase Auth with RLS + DAL pattern
- **LLM**: Vercel AI SDK with Gemini primary, OpenAI fallback
- **Payments**: Stripe (Pix + Card)
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics, Sentry for observability
- **Linting**: Biome (replaces ESLint/Prettier in Next.js 16)

## Development Commands

```bash
# Development (Turbopack is default in Next.js 16)
pnpm dev                 # Start development server
pnpm build               # Build for production
pnpm start               # Start production server

# Code Quality (Next.js 16 removed next lint)
pnpm lint                # Run Biome linter
pnpm format              # Run Biome formatter
pnpm check               # Run Biome check (lint + format + fix)
pnpm typecheck           # Run TypeScript checks

# Database (Drizzle ORM)
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Apply migrations
pnpm db:push             # Push schema changes
pnpm db:studio           # Open Drizzle Studio

# Testing
pnpm test                # Run Vitest in watch mode
pnpm test:run            # Run Vitest once
pnpm test:coverage       # Run with coverage report
```

## Architecture Overview

### Directory Structure

**`src/app/`** - Next.js App Router
- `(demo)/` - Demo routes (no auth required)
- `(app)/` - Authenticated routes (requires login)
- `api/` - API routes (webhooks, health check)
- `actions/` - Server Actions

**`src/lib/`** - Core libraries
- `db/` - Drizzle schema, queries, client
- `dal/` - Data Access Layer (auth functions)
- `supabase/` - Supabase client utilities
- `services/` - Business logic services
- `tarot/` - TarotService (deck, spreads, card draws)
- `llm/` - LLM provider abstraction (Vercel AI SDK)

**`src/components/`** - React components
- `ui/` - UI primitives (shadcn/ui)
- `tarot/` - Tarot-specific components (cards, spreads)

**`src/types/`** - TypeScript type definitions

### Data Flow

1. User submits question + spread type
2. Server Action validates input with Zod
3. TarotService draws N random cards with positions
4. LLM client builds prompt with safety constraints
5. Vercel AI SDK calls Gemini (or fallback to OpenAI)
6. Response parsed via structured output (Zod schema)
7. Reading persisted with credits deducted in single transaction
8. Frontend renders card interpretations + synthesis

### Key Domain Models (Drizzle Schema)

**Readings**: `readings` → `readingCards` (cards drawn with positions)
**Credits**: `creditBalances` → `creditTransactions` (audit trail)
**Payments**: `payments` (Stripe provider + status tracking)
**Tarot**: `tarotDecks` → `tarotCards` (localized, data-driven)
**Journaling**: `readingJournals` (user notes per reading)
**Audit**: `auditLogs` (append-only, per AUDIT-GUIDELINES)

## Development Guidelines

**IMPORTANT**: Always consult these before coding:

- **`DOCS/ENGINEERING-SPEC.md`** - Complete engineering plan and schema
- **`DOCS/GUIDELINES-REF/WEB-NEXTJS-GUIDELINES.md`** - Next.js 16, App Router, Server Components
- **`DOCS/GUIDELINES-REF/DEV-GUIDELINES.md`** - Core development standards
- **`DOCS/GUIDELINES-REF/DB-GUIDELINES.md`** - Database best practices, soft deletes
- **`DOCS/GUIDELINES-REF/AUDIT-GUIDELINES.md`** - Audit trail requirements
- **`DOCS/GUIDELINES-REF/SECURITY-GUIDELINES.md`** - Input validation, RLS
- **`DOCS/GUIDELINES-REF/SUPABASE-GUIDELINES.md`** - Supabase Auth, DB, RLS patterns

### Next.js 16 Critical Changes

```typescript
// ❌ OLD - Sync access (NO LONGER WORKS)
const cookieStore = cookies();

// ✅ NEW - Async access (REQUIRED)
const cookieStore = await cookies();

// Same for headers(), params, searchParams - ALL ASYNC
```

### Project-Specific Conventions

**Authentication**: Use DAL pattern, NOT middleware:
```typescript
// ✅ Correct - DAL pattern (lib/dal/index.ts)
import { requireUser } from "@/lib/dal";
const user = await requireUser(); // Redirects if not authenticated

// ❌ WRONG - Middleware auth (vulnerable CVE-2025-29927)
```

**LLM Safety**: System prompts MUST include:
- "Symbolic reflection only, not prediction"
- "Not medical, legal, financial, or psychological advice"
- Hard block on health diagnosis questions
- Safety reminder in every response

**Credits**: All credit operations MUST be transactional:
```typescript
// ✅ Correct - Drizzle transaction
await db.transaction(async (tx) => {
  await tx.insert(readings).values(readingData);
  await tx.update(creditBalances)
    .set({ credits: sql`credits - 1` })
    .where(eq(creditBalances.userId, userId));
  await tx.insert(creditTransactions)
    .values({ userId, delta: -1, type: 'reading' });
});
```

**Soft Deletes**: NEVER hard delete. Use `deletedAt` timestamp on all tables (except audit tables).

## Environment Variables

Required (see `.env.example`):
```
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM Providers
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENAI_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Reference

- Full PRD: `DOCS/PRD-PROMPT.md`
- Engineering Spec: `DOCS/ENGINEERING-SPEC.md`
- CLAUDE.md writing guide: `DOCS/GUIDELINES-REF/CLAUDE.md`
