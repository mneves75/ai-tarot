# Proxy Migration & Session Refresh Safety — ExecPlan

This plan follows DOCS/GUIDELINES-REF/EXECPLANS-GUIDELINES.md. Keep Progress, Surprises, Decision Log, and Outcomes updated as a living document.

## Purpose / Big Picture

Resolve the Next.js 16 deprecation warning (“middleware” file convention) by migrating to the new `proxy` convention while preserving Supabase session refresh behavior. Add tests to ensure the proxy path continues to refresh sessions correctly.

## Progress

- [x] (2025-11-25T18:55Z) Drafted plan after reviewing GUIDELINES-REF and Next.js 16 proxy migration docs.
- [x] (2025-11-25T18:57Z) Implemented proxy file and removed deprecated middleware.
- [x] (2025-11-25T18:58Z) Added Vitest coverage for proxy session refresh behavior.
- [x] (2025-11-25T18:59Z) Ran `pnpm test:run` (10 suites, 131 tests) and `pnpm lint` (clean).
- [x] (2025-11-25T19:00Z) Committed with Conventional Commit message.

## Surprises & Discoveries

- Proxy tests required minimal mocks for `NextResponse.next`; keeping the surface tiny avoids brittleness.

## Decision Log

- Decision: Move session refresh to `src/proxy.ts` per Next 16 convention while retaining matcher.  
  Rationale: Clears deprecation warning and future-proofs auth refresh.  
  Date/Author: 2025-11-25 / Codex.

## Outcomes & Retrospective

- (fill after completion)

## Context and Orientation

- Current session refresh lives in `src/middleware.ts` using Supabase SSR client with cookie propagation.
- Next.js 16 deprecates `middleware` in favor of `proxy`; functionality is equivalent but filename and export must change.
- Tests currently do not cover this path; new tests must mock `@supabase/ssr` and `next/server`.

## Plan of Work

1) Create `src/proxy.ts` by moving logic from `src/middleware.ts`, rename exported function to `proxy`, keep matcher.  
2) Remove `src/middleware.ts`.  
3) Add Vitest test `src/__tests__/proxy.test.ts` that mocks Supabase client and NextResponse to ensure session refresh is invoked and cookies are set.  
4) Run test suite and lint; document results; commit.

## Concrete Steps

- Commands:  
  - `pnpm test:run`  
  - `pnpm lint`

## Validation and Acceptance

- `pnpm test:run` passes including new proxy test.  
- `pnpm lint` is clean (no middleware warning).  
- Visiting dev server should no longer log the middleware deprecation warning (manual check).

## Idempotence and Recovery

- Deleting `middleware.ts` and using `proxy.ts` is idempotent; rerunning tests/lint is safe. Tests mock Supabase and do not require network/env.

## Artifacts and Notes

- New files: `src/proxy.ts`, `src/__tests__/proxy.test.ts`, this plan.  
- Reference docs: Next.js “middleware to proxy” message and file convention docs (2025-11-25).***
