# Supabase Env Safety & Tarot Shuffle Reliability — ExecPlan

This plan follows DOCS/GUIDELINES-REF/EXECPLANS-GUIDELINES.md and is self-contained for a novice. Keep sections updated as work proceeds.

## Purpose / Big Picture

Eliminate unsafe non-null assertions in Supabase clients, middleware, and tarot shuffling to satisfy Biome lint rules and harden runtime behavior. Validate env handling with tests and ensure card drawing never accesses undefined entries.

## Progress

- [x] (2025-11-25T18:20Z) Drafted plan after reviewing GUIDELINES-REF and locating non-null issues in Supabase clients, drizzle config, and tarot shuffle.
- [x] (2025-11-25T18:33Z) Implemented env helper and wired into client/server/middleware.
- [x] (2025-11-25T18:34Z) Fixed drizzle.config env handling.
- [x] (2025-11-25T18:37Z) Hardened tarot shuffle/draw against undefined indices.
- [x] (2025-11-25T18:40Z) Added Vitest suites for env helper and tarot draw.
- [x] (2025-11-25T18:44Z) Ran `pnpm test:run` (9 suites, 130 tests) and `pnpm lint` (clean).
- [ ] Commit with Conventional Commit message.

## Surprises & Discoveries

- SPREAD_CONFIGS positions are mutable; tests must restore originals after mutation to avoid cross-test leakage.

## Decision Log

- Decision: Centralize Supabase env validation in a helper instead of inline checks.  
  Rationale: DRY, clearer errors, and easier unit testing.  
  Date/Author: 2025-11-25 / Codex.
- Decision: Guard Fisher-Yates swaps with explicit ValidationError instead of silent skipping when encountering undefined.  
  Rationale: Fail fast and surface deck invariants; aligns with guidelines on explicit failures.  
  Date/Author: 2025-11-25 / Codex.

## Outcomes & Retrospective

- Env handling now fails fast with descriptive errors and no non-null assertions; tarot draw/shuffle guarded by ValidationErrors. Tests cover both areas; lint clean. Remaining future work: address broader non-null assertions elsewhere if introduced.

## Context and Orientation

- Supabase clients use `process.env...!` in `src/lib/supabase/client.ts`, `server.ts`, and `src/middleware.ts`; drizzle config uses the same pattern.  
- Tarot shuffling in `src/lib/services/tarot.ts` uses non-null assertions when swapping/drawing and indexing spread positions, triggering lint warnings.  
- Lint tool: Biome (`pnpm lint`). Tests: Vitest (`pnpm test:run`).

## Plan of Work

1) Add `src/lib/supabase/env.ts` that validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, throwing descriptive errors. Use it in client, server, middleware.  
2) Update `drizzle.config.ts` to fail fast with a clear message if `DATABASE_URL` is absent, without non-null assertions.  
3) Refactor tarot shuffle/draw to guard against undefined cards/positions; throw `ValidationError` with clear text if invariants break.  
4) Tests:  
   - `src/__tests__/lib/supabase/env.test.ts` covering missing/empty envs and success path.  
   - `src/__tests__/lib/services/tarot-draw.test.ts` covering deterministic shuffle/draw (controlled Math.random) and invariant error cases.  
5) Run lint and tests; update Surprises/Decision/Outcomes sections.  
6) Commit changes with message `chore: harden env handling and tarot shuffle`.

## Concrete Steps

- Working dir: repo root.  
- Commands to run:  
  - `pnpm test:run`  
  - `pnpm lint`

## Validation and Acceptance

- All tests pass including new env and tarot suites.  
- Biome lint reports no non-null assertion warnings.  
- Supabase helpers throw descriptive errors when env vars are missing (verified by tests).  
- Tarot draw throws ValidationError if deck/positions insufficient and otherwise returns correct card count with deterministic orientation under mocked randomness.

## Idempotence and Recovery

- Changes are additive and guarded; re-running tests/lint is safe. Env tests restore original process.env. Tarot tests stub Math.random and restore afterward.

## Artifacts and Notes

- New files: `src/lib/supabase/env.ts`, `src/__tests__/lib/supabase/env.test.ts`, `src/__tests__/lib/services/tarot-draw.test.ts`.  
- Updated files: Supabase client/server/middleware, drizzle.config.ts, tarot service.***
