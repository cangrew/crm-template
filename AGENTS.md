# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project conventions

Follow `.claude/rules/development-conventions.md` for every plan and change in this repo (TDD loop, pre-commit code review, conventional commits, quality gates). That file mirrors `.cursor/rules/development-conventions.mdc`; keep them in sync.

## What this repo is

A reusable CRM base template. The `contacts` entity is a deletable EXAMPLE wired through every layer (migration → RLS → pgTAP → zod → query keys → hooks → pages → tests) to demonstrate the patterns; real domains are added per company by copying its chain. See README "The contacts example entity" and "Tailoring checklist".

## Project map

- `app/(app)/` — authenticated pages (dashboard stub, contacts, documents, account, settings/users); `app/(auth)/login` + `app/auth/callback` — Entra SSO; `app/pending` — roleless landing; `app/api/documents/[id]/download` — signed-URL broker.
- `components/` — `ui/` atoms (Btn, badges, Modal, FormField, states), `common/` composites (PageHeader, PageStates, FormModal, InfoCard/TableCard, EntityTable), `shell/` (sidebar/topbar/command palette/notifications, nav-driven), then one directory per domain with `detail/` subfolders.
- `lib/domain/` — enums, zod schemas, notification metadata (pure, fully tested); `lib/auth/` — RBAC matrix, route guard, API authorization; `lib/data/` — typed Supabase queries + TanStack Query hooks (`query-keys.ts` is the single key registry); `lib/forms/` — `useZodForm`, `useDetailEdit`; `lib/config/` — `app.ts` branding + `nav.ts` single nav source (sidebar, topbar titles, command palette).
- `supabase/migrations/` — numbered, append-only once deployed (the pre-first-deploy template may edit in place); `supabase/tests/` — pgTAP RLS suites, run by CI's `rls` job.
- `proxy.ts` — Next 16's renamed middleware: session refresh + page role guard.

## Commands

`pnpm test:run` (vitest), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test:e2e` (Playwright), `pnpm db:test` (pgTAP, needs Docker), `pnpm db:types` (regenerate `lib/supabase/database.types.ts`).

## Auth architecture (three layers — keep them aligned)

1. **Page guard:** `proxy.ts` → `lib/auth/route-access.ts`. Deactivated/pending profiles resolve to a null role and land on `/pending`. The proxy deliberately skips `/api/*`.
2. **API routes self-authorize:** always via `requireApiRole(supabase, roles)` from `lib/auth/authorize.ts` — allow-lists only (never deny-lists), and it rejects deactivated (`is_active = false`) and pending (null-role) profiles. Cron routes (none ship; helper in `lib/cron/auth.ts`) use `CRON_SECRET` bearer auth instead.
3. **RLS is the floor:** policies must gate through `public.has_role(...)` / `public.current_app_role()` / `public.is_active_user()` — **never an inline `(select role from public.profiles …)` subquery**, which silently skips the `is_active` check. New tables need pgTAP coverage in `supabase/tests/`, including a deactivated-user assertion.

Roles are `admin / manager / member`; the `can(role, action, resource)` matrix in `lib/auth/roles.ts` gates UI affordances (server always re-checks).

## Front-end conventions

- **Forms:** new/refactored forms use `useZodForm` (`lib/forms/use-zod-form.ts`) + `FormField` (`components/ui/form-field.tsx`); the zod schema is the only validation source. Detail-page edit flows use `useDetailEdit` (`lib/forms/use-detail-edit.ts`) with the domain update schemas from `lib/domain/schemas.ts`.
- **Tables on detail pages:** use `EntityTable` (`components/common/entity-table.tsx`) with a column config instead of hand-rolled `<table className="tbl">` markup.
- **Styling:** no new inline `style={{}}` and no new `globals.css` rules — Tailwind utilities per `docs/tailwind-migration.md` (token utilities like `text-ink-500`/`bg-brand-50`; `rounded-[var(--radius-lg)]`/`shadow-[var(--shadow-card)]` for radius/shadow). Loading/error shells come from `components/common/page-states.tsx`.
- **Data:** components fetch only through the hooks in `lib/data/hooks.ts`; mutations invalidate the entity's `queryKeys.<entity>.all` family (lists, details, and dashboards refresh together — that breadth is intentional).
- **Navigation:** new pages register in `lib/config/nav.ts` (one source for sidebar, topbar titles, command palette) and, if restricted, get a branch in `lib/auth/route-access.ts`.
