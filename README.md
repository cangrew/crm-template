# CRM Template

A role-based CRM starter for internal tools, built with **Next.js 16 (App Router)** +
**Supabase** (Postgres / Auth / Storage) and **Microsoft Entra ID (Azure AD)** SSO. Clone it
per company, rename the example entity, and build the domains that company needs on top of a
tested auth, RBAC, notifications, documents, and tooling foundation.

What ships working out of the box:

- **Auth**: Entra SSO via Supabase Auth, pending-role provisioning, deactivation that
  actually revokes access, dev-mode auth bypass with a role switcher.
- **RBAC**: three roles — **Admin**, **Manager**, **Member** — enforced in three aligned
  layers (route guard, API allow-lists, RLS).
- **User management**: admin console to assign roles and disable accounts.
- **Notifications**: realtime in-app notifications with per-user muting preferences.
- **Documents**: private-bucket uploads and signed-URL downloads.
- **Contacts**: one end-to-end EXAMPLE entity demonstrating every layer (see below).
- **Tooling**: Vitest (+coverage gates), Playwright, pgTAP RLS suites, ESLint, Prettier,
  Husky + commitlint, GitHub Actions CI, agent rules for Claude Code / Cursor.

## Tech stack

- Next.js 16 App Router, TypeScript (strict), Tailwind CSS v4
- Supabase Postgres + RLS, Supabase Auth (Entra ID OIDC), Supabase Storage
- TanStack Query, `react-hook-form` + `zod`
- Vitest + React Testing Library, Playwright, pgTAP (RLS), ESLint + Prettier
- Husky + lint-staged + commitlint (Conventional Commits), GitHub Actions CI

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker (for the local Supabase stack and RLS tests)

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # then fill in values

# Start the local Supabase stack (Postgres, Auth, Storage, Studio).
pnpm exec supabase start
# Apply the migrations + seed to a clean database at any time:
pnpm exec supabase db reset
# Or load the full sample dataset (users for every role + contacts):
pnpm db:reset:sample

# Run the app:
pnpm dev
```

`pnpm exec supabase start` prints the local API URL and keys. Put them in `.env.local` as
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Open [http://localhost:3000](http://localhost:3000). With `NEXT_PUBLIC_BYPASS_AUTH=1` the
shell auto-signs you in as the seeded admin and shows a **DEV** pill in the topbar that flips
between the seeded `admin@example.com`, `manager@example.com`, and `member@example.com`
users (password `dev-password`, sample seed only).

### Resetting a drifted local stack

If the local Supabase stack drifts (e.g. the Auth container errors with
`column refresh_tokens.parent does not exist`, or auth requests start returning `502`), the
internal `auth`/`storage` schemas in the persisted Docker volume are out of sync with the
current images. A plain `db reset` only rebuilds the `public` schema, so it won't fix this.
Recreate the volume from scratch:

```bash
pnpm db:dev:nuke
```

## Roles & RBAC

| Resource  | Admin | Manager                | Member |
| --------- | ----- | ---------------------- | ------ |
| contacts  | CRUD  | create / read / update | read   |
| documents | CRUD  | CRUD                   | read   |
| users     | CRUD  | —                      | —      |

The same matrix is enforced in **three aligned layers** — keep them in sync when you change
anything:

1. **Page guard:** `proxy.ts` → `lib/auth/route-access.ts`. Deactivated/pending profiles
   resolve to a null role and land on `/pending`. The proxy deliberately skips `/api/*`.
2. **API routes self-authorize** via `requireApiRole(supabase, roles)` from
   `lib/auth/authorize.ts` — allow-lists only, rejecting deactivated and pending profiles.
3. **RLS is the floor:** policies gate through `public.has_role(...)` /
   `public.current_app_role()` / `public.is_active_user()` — **never** an inline
   `select role from profiles` subquery, which would silently skip the `is_active` check.

UI affordances (buttons, pickers) are additionally gated with `can(role, action, resource)`
from `lib/auth/roles.ts` — for usability only; the server always re-checks.

To rename or extend the roles: change the `app_role` enum in a new migration, then
`lib/domain/enums.ts` (`APP_ROLES`/labels), the matrix in `lib/auth/roles.ts`, the allow-list
constants in `lib/auth/authorize.ts`, `lib/dev/dev-users.ts`, the seeds, and the pgTAP
suites.

## The contacts example entity

`contacts` exists so every pattern in the stack has one worked, tested example. Each file
involved carries an `EXAMPLE ENTITY` header comment. The full chain:

| Layer        | Files                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Schema + RLS | `supabase/migrations/0003_contacts.sql` (+ notification triggers)                      |
| pgTAP        | `supabase/tests/{rls_test,notifications_test,account_provisioning_test}.sql`           |
| Domain       | `lib/domain/enums.ts` (statuses + labels), `lib/domain/schemas.ts` (insert/update zod) |
| Types        | `lib/supabase/database.types.ts`, `lib/supabase/types.ts`                              |
| Data         | `lib/data/contacts.ts`, `lib/data/query-keys.ts`, `lib/data/hooks.ts`                  |
| UI           | `components/contacts/*`, `components/ui/{badges,contact-status-picker}.tsx`            |
| Pages        | `app/(app)/contacts/{page,[id]/page}.tsx`, dashboard stub, nav entry, command palette  |
| Design       | `lib/design/tones.ts` (`contactTone`)                                                  |
| E2E          | `e2e/contacts.spec.ts`                                                                 |

**Adding a real entity:** copy the chain top to bottom — migration (enum, table, index,
`updated_at` trigger, RLS via `has_role()`, notification triggers if wanted, pgTAP suite
including a deactivated-user assertion), then domain enums/schemas, regenerated types, data
module + query keys + hooks, components, pages, a nav entry in `lib/config/nav.ts`, and a
route-access branch if the area is restricted.

**Removing the example:** delete everything marked `EXAMPLE ENTITY` (grep for it), drop the
`contacts` sections from `query-keys.ts`/`hooks.ts`/`types.ts`/`database.types.ts`, replace
the notification types (SQL enum in `0002` + `lib/domain/notifications.ts` + the contact
triggers in `0003`) with your own, re-point or drop `documents.contact_id` (`0004`), trim the
nav/command-palette/dashboard references, and update the seeds + pgTAP fixtures. Do this
**before your first deploy** so you can edit the migrations in place; afterwards, schema
changes need new append-only migrations.

## Tailoring checklist (per company)

1. `package.json` `name`, `lib/config/app.ts` (`APP_NAME`, `APP_DESCRIPTION`),
   `supabase/config.toml` `project_id`, `app/icon.svg`.
2. Design tokens in `app/globals.css` (brand palette, fonts, radii).
3. Roles (see above) and the RBAC matrix.
4. Replace the contacts example with the company's real entities.
5. Notification types + audiences.
6. `.env.local` + hosted Supabase project + Entra app registration (below).

## Environment variables

See [`.env.local.example`](./.env.local.example). Summary:

| Variable                                 | Scope        | Purpose                                         |
| ---------------------------------------- | ------------ | ----------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | client       | Supabase API URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | client       | Supabase anon/publishable key                   |
| `SUPABASE_SERVICE_ROLE_KEY`              | server       | Privileged server tasks (e.g. future cron jobs) |
| `CRON_SECRET`                            | server       | Bearer secret for scheduled jobs (helper wired) |
| `SUPABASE_AUTH_EXTERNAL_AZURE_CLIENT_ID` | server (CLI) | Entra app client id (local dev)                 |
| `SUPABASE_AUTH_EXTERNAL_AZURE_SECRET`    | server (CLI) | Entra app client secret (local dev)             |
| `SUPABASE_AUTH_EXTERNAL_AZURE_URL`       | server (CLI) | Entra tenant issuer URL (local dev)             |
| `NEXT_PUBLIC_BYPASS_AUTH`                | dev only     | Auth bypass + role switcher (inert in prod)     |

## Microsoft Entra ID (Azure AD) SSO setup

Authentication is brokered by Supabase Auth using the Azure (Entra ID) OAuth provider. There
is no password UI — users sign in with Microsoft only. (Swapping the provider is a
per-company decision: change `signInWithOAuth({ provider })` in
`app/(auth)/login/page.tsx` and configure the matching provider in Supabase Auth.)

1. **Register an app** in the Microsoft Entra admin center (Azure AD → App registrations →
   New registration). Choose single-tenant if you want to restrict logins to your org.
2. **Redirect URI (Web):** set it to your Supabase Auth callback,
   `https://<your-project-ref>.supabase.co/auth/v1/callback` (and the local equivalent,
   `http://127.0.0.1:54321/auth/v1/callback`, for local dev).
3. **Create a client secret** (Certificates & secrets) and note the value.
4. **Configure the provider in Supabase:**
   - **Local dev:** the Supabase CLI reads `[auth.external.azure]` in
     [`supabase/config.toml`](./supabase/config.toml), which pulls secrets from the
     `SUPABASE_AUTH_EXTERNAL_AZURE_*` env vars. Set them in `.env.local`, then restart with
     `pnpm exec supabase start`.
   - **Hosted Supabase:** enable Azure under Authentication → Providers and paste the client
     id/secret and (optionally) the tenant URL there.
5. **App redirect URLs:** the app's own OAuth landing route is
   [`app/auth/callback/route.ts`](./app/auth/callback/route.ts) (`/auth/callback`). Add your
   site URLs (e.g. `http://localhost:3000`, your production URL) to Supabase Auth's allowed
   redirect URLs.

On first successful login a `profiles` row is auto-created with **no role** (pending) via a
Postgres trigger. A pending user is signed in but has no access — they land on `/pending`
until an Admin assigns them a role from **User Management**. Disabling a user there
(`is_active = false`) revokes access immediately: both the route guard and RLS resolve a
deactivated profile to no role (see `current_app_role()`).

## Scripts

| Command                             | Description                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                          | Start the dev server                                         |
| `pnpm build` / `pnpm start`         | Production build / serve                                     |
| `pnpm lint`                         | ESLint                                                       |
| `pnpm format` / `pnpm format:check` | Prettier write / check                                       |
| `pnpm typecheck`                    | `tsc --noEmit`                                               |
| `pnpm test` / `pnpm test:run`       | Vitest (watch / once)                                        |
| `pnpm test:coverage`                | Vitest with coverage (80% gates on `lib/domain`, `lib/auth`) |
| `pnpm test:e2e`                     | Playwright E2E                                               |
| `pnpm db:reset` / `db:reset:sample` | Rebuild the local DB (minimal seed / full sample)            |
| `pnpm db:test`                      | pgTAP RLS/policy suite (requires Docker + local Supabase)    |
| `pnpm db:types`                     | Regenerate `lib/supabase/database.types.ts`                  |

## Testing

- **Unit (Vitest):** domain enums/schemas, notification metadata, auth/RBAC helpers, form
  hooks, data modules, and component tests. Coverage is gated at 80% on `lib/domain/**` and
  `lib/auth/**`.
- **RLS (pgTAP):** `pnpm db:test` runs `supabase/tests/*.sql` against the local stack —
  per-role matrices, provisioning, deactivation, notification fan-out/muting, and storage
  bucket policies. CI's `rls` job runs the same suite.
- **E2E (Playwright):** bypass-mode smoke specs in `e2e/` (shell, notifications UI,
  contacts chrome). CI builds and serves the app with `NEXT_PUBLIC_BYPASS_AUTH=1`.

> `lib/supabase/database.types.ts` is generated. After any migration change, run a local
> stack and `pnpm db:types` so the checked-in types match the schema.

## Routes

```
app/(auth)/login/page.tsx            # Microsoft SSO sign-in
app/auth/callback/route.ts           # OAuth code exchange
app/pending/page.tsx                 # signed in, no role yet
app/(app)/layout.tsx                 # auth guard + role-filtered shell
app/(app)/page.tsx                   # dashboard stub
app/(app)/contacts/{page,[id]/page}.tsx   # EXAMPLE entity
app/(app)/documents/page.tsx         # uploads + signed downloads
app/(app)/account/page.tsx           # profile + notification preferences
app/(app)/settings/users/page.tsx    # admin only
app/api/documents/[id]/download/route.ts  # signed-URL broker (requireApiRole)
proxy.ts                             # session refresh + role guard (Next 16)
```

## Deploying to Vercel

1. Import the repo into Vercel (framework preset: Next.js).
2. Set environment variables in the Vercel project (Production + Preview):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from your hosted Supabase
   project), and `SUPABASE_SERVICE_ROLE_KEY` if you add server jobs. The
   `SUPABASE_AUTH_EXTERNAL_AZURE_*` vars are **not** needed on Vercel — the Azure provider
   is configured in the hosted Supabase dashboard.
3. In Supabase Auth settings, add your Vercel URLs to the allowed redirect URLs and set the
   site URL.
4. In the Entra app registration, add the Supabase callback
   (`https://<project-ref>.supabase.co/auth/v1/callback`) as a redirect URI.
5. Apply migrations to the hosted database: `pnpm exec supabase link --project-ref <ref>`
   then `pnpm exec supabase db push` — or add the repo secrets used by
   [`deploy-migrations.yml`](./.github/workflows/deploy-migrations.yml) and let CI do it.

### Adding scheduled jobs (Vercel Cron)

The template ships no cron routes, but the auth helper is wired: create
`app/api/cron/<job>/route.ts` that checks
`isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)`
(`lib/cron/auth.ts`) and uses `createAdminClient()` (`lib/supabase/admin.ts`, service role)
for writes that bypass RLS.
Register the schedule in a `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/<job>", "schedule": "0 6 * * 1" }] }
```

Vercel attaches the bearer secret automatically; the proxy deliberately skips `/api/*` so
cookie-less cron requests are never redirected to `/login`.

## Conventions

Development follows the red-green-refactor-review-commit loop and Conventional Commits, with
pre-commit (lint-staged), pre-push (typecheck + unit tests), and commit-msg (commitlint)
hooks, plus GitHub Actions CI. See
[`.claude/rules/development-conventions.md`](./.claude/rules/development-conventions.md)
(mirrored in `.cursor/rules/development-conventions.mdc`).
