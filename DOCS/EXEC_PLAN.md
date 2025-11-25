# Credits Spend Accuracy & LLM Repo Hygiene ExecPlan

This ExecPlan follows DOCS/GUIDELINES-REF/EXECPLANS-GUIDELINES.md. It is self-contained for a novice to reproduce the work without prior context. Sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective are living and updated to the current state.

## Purpose / Big Picture

Ensure credit accounting reports only actual spending (readings and negative adjustments), excluding refunds that previously inflated totals. Provide reproducible guidance, tests, and documentation updates so future contributors can extend the credits service confidently.

## Progress

- [x] (2025-11-25T18:02Z) Read DOCS/GUIDELINES-REF and scanned credits/LLM code to identify issues; noted refund counting bug in spending metric.
- [x] (2025-11-25T18:04Z) Drafted engineering spec and this ExecPlan to align with guidelines and scope.
- [x] (2025-11-25T18:06Z) Implemented credit spending fix with filtering, added targeted Vitest suite.
- [x] (2025-11-25T18:06Z) Ran `pnpm test:run` (all pass) and `pnpm lint` (pre-existing non-null warnings only).
- [x] (2025-11-25T18:07Z) Finalized docs updates and verification.

## Surprises & Discoveries

- Biome reports existing non-null assertion warnings across Supabase config and tarot shuffling; they pre-date this change and remain to be addressed separately.

## Decision Log

- Decision: Compute spend totals from fetched transactions and filter by type instead of relying on SQL ABS over all negatives, to explicitly exclude refunds and keep logic testable without a database.  
  Rationale: Refunds are recorded as negative deltas but are reversals, not consumption; JS filtering simplifies deterministic unit testing.  
  Date/Author: 2025-11-25 / Codex.

## Outcomes & Retrospective

Spending totals now exclude refunds, and coverage includes a focused unit suite. Documentation (engineering spec + ExecPlan) captures context and steps. Remaining lint warnings are noted for future cleanup.

## Context and Orientation

- Credits service lives in `src/lib/services/credits.ts`; it handles balance mutations and reporting. The problematic function was `getTotalCreditsSpent`, which summed ABS of all negative deltas, counting refunds as spend.  
- New tests reside in `src/__tests__/lib/services/credits.test.ts`, mocking the Drizzle chain `select().from().where()` to remain DB-independent.  
- Docs are under `DOCS/`; guidelines reference folder: `DOCS/GUIDELINES-REF/`.

## Plan of Work

1. Document scope and guidelines (this file plus engineering spec in `DOCS/ENGINEERING-SPEC-V3.md`).  
2. Adjust `getTotalCreditsSpent` to fetch transactions and sum only negative readings/adjustments.  
3. Add Vitest coverage to prove refunds no longer inflate spend totals and adjustments behave correctly.  
4. Run `pnpm test:run` and `pnpm lint`; record outcomes and outstanding warnings.  
5. Commit changes with Conventional Commit message.

## Concrete Steps

- Working directory: repository root.  
- Commands executed:
  - `pnpm test:run` → 7/7 files passed, 124 tests.  
  - `pnpm lint` → warnings about existing non-null assertions in Supabase/tarot modules (no new issues).  

## Validation and Acceptance

Acceptance criteria:  
- `pnpm test:run` passes including `src/__tests__/lib/services/credits.test.ts`.  
- `getTotalCreditsSpent` no longer counts refunds; tests demonstrate reading+adjustment-only aggregation.  
- Lint runs without new violations; acknowledge pre-existing warnings.

## Idempotence and Recovery

Running tests and lint is safe and repeatable. The code change is additive and deterministic; re-running the test suite verifies correctness. No migrations or destructive operations were introduced.

## Artifacts and Notes

- Key files: `src/lib/services/credits.ts`, `src/__tests__/lib/services/credits.test.ts`, `DOCS/ENGINEERING-SPEC-V3.md`, `DOCS/EXEC_PLAN.md`.  
- Lint output highlights non-null assertions to tackle later.

## Interfaces and Dependencies

- Function signature retained: `getTotalCreditsSpent(userId: string): Promise<number>`.  
- Relies on Drizzle `db` client but now only needs `select().from().where()` returning `{ delta, type }` rows, easing test doubles.  
- Tests use Vitest with `vi.hoisted` mocks; no database required.
