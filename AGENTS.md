# Repository Guidelines

## Project Structure & Module Organization
The app uses the Next.js App Router under `src/app`; customer-facing routes reside in `src/app/(app)` (e.g., the new `colours` catalogue page) and Payload admin tooling in `src/app/(payload)`. Shared UI sits in `src/components`, while Payload definitions live in `src/collections`, `src/blocks`, and `src/fields`. Business logic extends across `src/lib`, `src/hooks`, and `src/providers`. Payload config and generated types are in `src/payload.config.ts` and adjacent files, with fonts and other static assets in `src/fonts`. Media now persists under `data/media`, and model uploads stream through `src/collections/Models.ts` into `data/models`. Tests land in `tests/int` (Vitest) and `tests/e2e` (Playwright). Review `ai-ref/` for quick-start notes on interacting with PayloadCMS; `ai-ref/reference` covers core workflows and schemas.

## Build, Test, and Development Commands
- `pnpm dev` starts the app with hot reload at `localhost:3000`.
- `pnpm lint` / `pnpm lint:fix` run ESLint and auto-fix supported rules; do this before PRs.
- `pnpm generate:types` and `pnpm generate:importmap` regenerate Payload artifacts after schema edits.
- `pnpm test:int` executes Vitest integration specs. Run these locally before pushing.
- Hold off on `pnpm build`, `pnpm start`, `pnpm test:e2e`, and the umbrella `pnpm test` until the build pipeline is greenlit; rely on the dev server and integration tests for now.

## Coding Style & Naming Conventions
We rely on TypeScript, React server components by default, and Tailwind for styling. Prettier (with the Tailwind plugin) plus ESLint enforce two-space indentation, trailing commas, and deterministic class ordering; format through your editor or `pnpm lint:fix`. Use PascalCase for components (`ProductCard.tsx`), camelCase for utilities (`formatPrice.ts`), and co-locate route files with their segments to maintain the App Router structure.

## Testing Guidelines
Vitest specs in `tests/int` follow the `*.int.spec.ts` suffix and should validate API handlers or server utilities. E2E Playwright suites live in `tests/e2e`, but defer running or extending them until instructed; draft scenarios locally and sync with the team before pushing. When adding features, include at least one integration spec and seed reproducible data through Payload scripts where needed.
Keep `src/endpoints/seed/index.ts` aligned with schema changes so local seeds expose new collections (filaments, models, colours, etc.) and fields for reviewers.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) with present-tense subjects (`feat: add cart reconciliation`). Rebase prior to opening PRs and reserve commit bodies for context or breaking changes. PRs must link issues, summarize user impact, and call out migrations or seeds. Attach screenshots or short clips for UI updates, confirm linting and integration tests, and document any manual steps for reviewers.

## Configuration & Security Notes
Environment variables load from `.env` files—clone `test.env` for local suites and keep secrets out of version control. Use `pnpm stripe-webhooks` with Stripe CLI credentials for local webhook testing, never real keys. Access policies sit in `src/access`; update them alongside new collections to avoid privilege drift, and reference `ai-ref/SKILL.md` for Payload admin operations.
