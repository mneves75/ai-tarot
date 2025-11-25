# Credit Accounting Reliability — Engineering Spec (V3)

This spec complies with DOCS/GUIDELINES-REF/EXECPLANS-GUIDELINES.md and related repository standards (DEV-GUIDELINES, SOFTWARE-ENGINEERING-GUIDELINES, TYPESCRIPT-GUIDELINES, SECURITY-GUIDELINES). It is self-contained for a newcomer.

## Purpose

Ensure user-visible credit totals report true spending, excluding refunds and other non-consumptive debits. Provide a documented, test-backed approach so future changes to the credits system remain predictable and auditable.

## Current State & Findings

- `src/lib/services/credits.ts#getTotalCreditsSpent` sums `ABS(delta)` for all negative transactions. Refunds are stored as negative deltas, so refunded purchases are incorrectly counted as “spent,” overstating usage and potentially misinforming analytics and UI.
- Tests exist for validation, i18n, prompts, rate limiting, but none cover credit aggregation.
- Linting via Biome currently emits pre-existing non-null assertion warnings in Supabase setup and tarot drawing logic; unrelated to this defect but noted.

## Goals

1) Correct spend aggregation to include only consumption (readings, negative adjustments) and exclude refunds/other debit types.  
2) Add deterministic unit tests that fail with the old behavior and pass with the fix, without requiring a database.  
3) Document the work (ExecPlan + this spec) for reproducibility and reviewer clarity.  
4) Keep public APIs stable (no signature changes) and maintain TypeScript safety.

## Non-Goals

- Changing balance mutation semantics, pricing, or welcome credit rules.  
- Refactoring Supabase clients or addressing existing lint warnings beyond the scope of spend aggregation.  
- Introducing persistence for rate limiting or LLM budget tracking.

## Constraints & References

- Follow Biome formatting/lint expectations; prefer pure functions where possible.  
- Use Vitest for tests; avoid network/database dependency in unit suites.  
- Path aliases use `@/` per `tsconfig.json`.  
- Commit style: Conventional Commits.

## Multi-Phase Plan

- **Phase 1 – Problem Definition & Plan (Done)**  
  - Read GUIDELINES-REF docs; enumerate defect (refunds counted as spend).  
  - Produce ExecPlan (`DOCS/EXEC_PLAN.md`) and this spec.

- **Phase 2 – Implementation (Done)**  
  - Modify `getTotalCreditsSpent` to fetch `{delta, type}` rows and sum only negative readings/adjustments; ignore refunds and other types.  
  - Keep function signature unchanged; prefer explicit filtering over SQL ABS for testability.

- **Phase 3 – Verification (Done)**  
  - Add `src/__tests__/lib/services/credits.test.ts` with mocked Drizzle chain to cover:  
    - Refunds excluded from spend.  
    - Negative adjustments included, positive ignored.  
    - No debits ⇒ zero.  
  - Run `pnpm test:run`; ensure new suite passes.  
  - Run `pnpm lint`; acknowledge pre-existing warnings only.

- **Phase 4 – Documentation & Handoff (Done)**  
  - Update ExecPlan progress and decision log.  
  - Summarize outcomes in this spec for reviewers (John Carmack bar).

## Acceptance Criteria

- `getTotalCreditsSpent` returns 5 for sample txs: readings -2/-3, refund -5, purchase +10.  
- Tests in `src/__tests__/lib/services/credits.test.ts` pass in isolation and within full suite.  
- Lint completes without new violations (existing non-null warnings acceptable but documented).  
- Plan and spec checked in under `DOCS/`.

## Risks & Mitigations

- **Risk:** Future transaction types added and inadvertently counted.  
  **Mitigation:** Filtering is explicit by type; add tests when new types appear.  
- **Risk:** Inconsistent mock shape vs. real Drizzle results.  
  **Mitigation:** Tests rely only on `{ delta, type }`—fields returned by the real query.

## Implementation Notes

- Filtering in JavaScript improves clarity and avoids coupling tests to SQL dialect specifics while keeping DB call count unchanged.  
- Maintains audit trail: no schema change or migration required.  
- Test doubles use `vi.hoisted` to satisfy Vitest hoisting rules.

## Validation Steps

1) `pnpm test:run` from repo root — expect 7/7 suites, 124 tests passing.  
2) `pnpm lint` — expect existing non-null warnings only.  
3) (Optional) Instrument with sample transactions in a staging DB to confirm analytics dashboards align with test expectations.

## Future Work (Out of Scope)

- Remove non-null assertions in Supabase clients and tarot shuffling per lint warnings.  
- Move rate limit + LLM budget stores to shared cache/Redis for multi-instance deployments.  
- Add integration tests covering Stripe webhook → credits pipeline.
