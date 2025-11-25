# Supabase Env Safety & Tarot Shuffle Reliability — Engineering Spec (V4)

This spec complies with DOCS/GUIDELINES-REF (EXECPLANS, DEV, SECURITY, TYPESCRIPT). It is self-contained for a newcomer.

## Purpose

Remove unsafe non-null assertions in Supabase setup and tarot shuffling, enforce clear configuration errors, and guarantee card draws never access undefined data. Align with Biome lint and add tests to lock behavior.

## Current State & Issues

- Supabase client/server and middleware call `process.env[...]!`, risking undefined at runtime and tripping Biome `noNonNullAssertion`.  
- `drizzle.config.ts` uses `DATABASE_URL!` similarly.  
- `src/lib/services/tarot.ts` uses non-null assertions during shuffle (`shuffled[j]!`) and position lookup, risking runtime `undefined` if invariants break and causing lint warnings.  
- No tests cover env validation or tarot draw invariants.

## Goals

1) Centralize Supabase env validation with descriptive errors; remove non-null assertions.  
2) Make drizzle config fail fast with clear messaging when `DATABASE_URL` is missing.  
3) Harden tarot shuffle/draw against undefined values with explicit validation.  
4) Add Vitest suites for env helper and tarot draw to prevent regression.  
5) Achieve clean Biome lint (no new warnings) and passing tests.

## Non-Goals

- Changing Supabase auth flow or DAL.  
- Altering tarot business logic beyond safety checks.  
- Adding persistence for rate limiting or LLM budget.

## Design & Alternatives (5 options considered)

1) Keep non-null assertions and rely on deploy-time env checks — rejected (lint violations, weaker safety).  
2) Inline runtime checks in every caller — repetitive; risk divergence.  
3) Centralize env getter in `src/lib/supabase/env.ts` with typed return and reuse — chosen (DRY, testable).  
4) Replace shuffle with third-party RNG lib — unnecessary dependency; current Fisher-Yates is fine with guards.  
5) Short-circuit tarot draw when config/card mismatch without throw — rejected; silent failure hides bugs.  
Chosen approach: option 3 plus guarded Fisher-Yates with explicit errors.

## Plan (phases)

- Phase 1: Add env helper and update Supabase client/server/middleware and drizzle config to use it.  
- Phase 2: Refactor tarot shuffle/draw to guard swaps and positions; throw ValidationError on mismatch.  
- Phase 3: Add Vitest suites for env helper and tarot draw (mock Math.random, restore env).  
- Phase 4: Run tests/lint; ensure no new warnings; document outcomes.

## Current Completion Snapshot (2025-11-25)

- Phases 1–4 implemented; tests (9 suites, 130 tests) and lint are passing with zero non-null warnings.

## Acceptance Criteria

- Env helper throws with message naming missing var; passes when both present.  
- `pnpm test:run` includes new suites and passes.  
- `pnpm lint` reports zero non-null assertion warnings.  
- Tarot draw returns correct count given spread config and throws on undersized deck/positions.

## Validation Steps

1) `pnpm test:run`  
2) `pnpm lint`

## Risks & Mitigations

- Env vars still missing in production: helper throws fast with clear text.  
- Tarot tests flaky due to randomness: stub Math.random sequences in tests and restore.

## Handoff Notes

- New helper: `src/lib/supabase/env.ts` exporting `getSupabaseEnv()`.  
- Tests added under `src/__tests__/lib/supabase/` and `src/__tests__/lib/services/`.  
- No schema or runtime behavior changes beyond safety; public APIs unchanged.
