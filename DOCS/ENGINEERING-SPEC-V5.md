# Proxy Migration for Supabase Session Refresh — Engineering Spec (V5)

This spec follows DOCS/GUIDELINES-REF (ExecPlans, Dev, Security, TypeScript). It is self-contained for a newcomer.

## Purpose

Eliminate the Next.js deprecation warning by migrating from `middleware.ts` to the new `proxy` convention, preserving Supabase session refresh behavior and adding regression tests.

## Current State & Issue

- The repo uses `src/middleware.ts` to refresh Supabase sessions. Next.js 16 logs: “The 'middleware' file convention is deprecated. Please use 'proxy' instead.” This will become a hard error in future versions.
- No automated tests cover the session refresh path; changes risk silent breakage.

## Goals

1) Replace `middleware.ts` with `proxy.ts` without changing behavior (session refresh + cookies).  
2) Add Vitest coverage that ensures the proxy calls `supabase.auth.getSession()` and propagates cookies.  
3) Keep Biome lint clean; maintain existing matchers.

## Non-Goals

- Changing Supabase auth flow or DAL logic.  
- Altering matcher routes or introducing new auth behavior.

## Design (options considered)

1) Keep middleware and suppress warning — rejected (future break, violates guidelines).  
2) Move logic wholesale to `proxy.ts` and keep API surface identical — chosen (minimal risk, aligned with Next 16).  
3) Rewrite using custom Edge handler — unnecessary complexity.

## Plan (phases)

- Phase 1: Add `src/proxy.ts` with existing logic; remove `src/middleware.ts`; update imports to use `getSupabaseEnv`.  
- Phase 2: Add Vitest `src/__tests__/proxy.test.ts` mocking `@supabase/ssr` and `next/server`, asserting session refresh and cookie propagation.  
- Phase 3: Run `pnpm test:run` and `pnpm lint`; document results.

## Acceptance Criteria

- No deprecation warning when running `pnpm dev` (manual).  
- Tests pass including new proxy test.  
- Lint passes with no new warnings.

## Risks & Mitigations

- Mock drift vs. real Next/Supabase APIs: use minimal surface (auth.getSession, cookies set/getAll, NextResponse.next).  
- Forgotten matcher: retain `config.matcher` unchanged.

## Validation Steps

1) `pnpm test:run`  
2) `pnpm lint`  
3) Launch `pnpm dev` and confirm warning gone.

## Current Completion Snapshot (2025-11-25)

- All phases implemented; tests (10 suites, 131 tests) and lint are passing with zero warnings.

## Handoff Notes

- Key file: `src/proxy.ts`; tests: `src/__tests__/proxy.test.ts`; plan: `DOCS/EXEC_PLAN-PROXY-MIGRATION.md`.***
