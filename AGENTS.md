# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` – App Router routes/layouts; groups like `(auth)`, `(demo)`, `profile`, `payment`, `history`, `credits`, plus API handlers in `api/`.
- `src/components/` – shared UI primitives; reuse before adding variants.
- `src/lib/` – domain logic (Drizzle schema/seeds, LLM tools, Supabase/Stripe helpers, validation, utilities).
- `src/__tests__/` – Vitest suites + setup mirroring `src/lib`.
- `public/` static assets; `supabase/migrations/` SQL migrations.

## Build, Test, and Development Commands
- `pnpm dev` – run locally on http://localhost:3000.
- `pnpm build` / `pnpm start` – production build/serve.
- Quality gates: `pnpm typecheck`, `pnpm lint`, `pnpm format` (Biome), `pnpm check` (lint+format).
- Tests: `pnpm test` (watch), `pnpm test:run` (CI), `pnpm test:coverage`.
- DB: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:seed`, `pnpm db:studio`.

## Coding Style & Naming Conventions
- Stack: TypeScript, React 19, Next.js 16 (App Router). Prefer server components; add `"use client"` only when required.
- Biome formatting (2 spaces, no semicolons); run `pnpm format` before commits.
- Naming: components `PascalCase`; hooks/utils `camelCase`; routes kebab-case (`buy-credits`); tests `*.test.ts[x]`.
- Keep styles aligned with `src/app/globals.css` and shared tokens in `src/components`.

## Testing Guidelines
- Place specs under `src/__tests__` near related domain code; use Testing Library for React.
- Cover happy paths + edge cases; add regression tests with fixes.
- Before PRs: `pnpm test`, `pnpm lint`, `pnpm typecheck`; use coverage for risky changes.

## Database & Configuration Notes
- Supabase config: `supabase/config.toml`; migrations: `supabase/migrations/`; seeds: `src/lib/db/seeds`.
- Secrets (Supabase, Stripe, AI keys) live in `.env.local`; never commit. Add placeholder entries when introducing new vars.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). Keep commits focused and passing.
- PRs: include summary, linked issue, UI screenshots if relevant, migration notes, and a test plan (commands run). Flag breaking changes or new env vars.
