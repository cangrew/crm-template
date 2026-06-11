# Tailwind migration playbook

This repo ships **Tailwind CSS v4** (`@import "tailwindcss"` in
`app/globals.css`), but most styling historically lived in a large
hand-rolled `globals.css` of custom classes plus inline `style={{}}`
blocks. This playbook captures the pattern used to migrate the **Loads**
feature (the reference PR) so the rest of the app can follow.

Goal: behavior- and pixel-preserving conversion. This is a refactor, not
a redesign — keep exact pixel values via arbitrary utilities.

## 1. Token bridge (already done, app-wide)

The design tokens in `:root` remain the single source of truth. They are
exposed to Tailwind in the `@theme inline` block of `app/globals.css`, so
color/font utilities resolve to those variables:

| Utility family                                        | Resolves to                 | Examples                        |
| ----------------------------------------------------- | --------------------------- | ------------------------------- |
| `bg-brand-*`, `text-brand-*`                          | `var(--brand-50…700)`       | `bg-brand-50`, `text-brand-600` |
| `text-ink-*`                                          | `var(--ink-300…900)`        | `text-ink-500`, `text-ink-800`  |
| `bg-bg`, `bg-bg-subtle`, `bg-bg-inverse`              | `var(--bg*)`                | `bg-bg-subtle`                  |
| `border-border`, `border-border-strong`               | `var(--border*)`            | `border border-border`          |
| `text-success` / `-warn` / `-error`, `border-l-error` | `var(--success/warn/error)` | `border-l-error`                |
| `font-display`, `font-sans`, `font-mono`              | `var(--font-*)`             | `font-display`                  |

Radius/shadow tokens are **not** remapped onto Tailwind's built-in keys
(collision risk). Use arbitrary values referencing the vars:
`rounded-[var(--radius-lg)]`, `rounded-[var(--radius-md)]`,
`shadow-[var(--shadow-card)]`.

## 2. Class / inline-style → utility mapping

These are the conversions applied in the Loads pilot. Spacing uses the
4px scale (`gap-2` = 8px); use arbitrary values (`gap-[14px]`) for
off-scale pixels to preserve parity.

| Source                                                | Tailwind utilities                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `style={{display:"flex",alignItems:"center",gap:14}}` | `flex items-center gap-[14px]`                                                                        |
| `.page`                                               | `mx-auto max-w-[1440px] px-8 pt-[26px] pb-20`                                                         |
| `.page-head` (plain)                                  | `mb-[22px] flex items-start gap-4`                                                                    |
| `.page-title`                                         | `font-display text-[26px] font-bold tracking-[-0.02em]`                                               |
| `.page-sub`                                           | `mt-1 text-sm text-ink-500`                                                                           |
| `.muted` (standalone)                                 | `text-ink-500`                                                                                        |
| `.card`                                               | `rounded-[var(--radius-lg)] border border-border bg-bg shadow-[var(--shadow-card)]`                   |
| `.card-pad`                                           | `p-5`                                                                                                 |
| `.mt24`                                               | `mt-6`                                                                                                |
| `.grid`                                               | `grid gap-[18px]`                                                                                     |
| `.g-2` (+ `.grid`)                                    | `grid grid-cols-2 gap-[18px]`                                                                         |
| `.dash-2col`                                          | `grid grid-cols-[2.1fr_1fr] items-start gap-[18px] [&>*]:min-w-0`                                     |
| `.cell-num`                                           | `text-right font-mono tabular-nums`                                                                   |
| modal overlay                                         | `fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(11,18,32,0.52)] backdrop-blur-[3px]` |

Conventions:

- Use `cn()` from `lib/utils.ts` for conditional/merged class lists
  (e.g. the kanban column's `isOver ? "bg-brand-50" : "bg-bg-subtle"`).
- Prefer token utilities (`bg-brand-50`, `text-error`) over arbitrary
  values; fall back to `*-[var(--token)]` only for radius/shadow.
- A genuinely dynamic value (e.g. the kanban column dot color, which
  comes from a per-status map) stays as an inline `style`.
- Hardcoded one-off hex that isn't a token stays as an arbitrary value
  (e.g. the error banner `bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]`).
- Run prettier after editing so `prettier-plugin-tailwindcss` orders the
  classes.

## 3. What to convert vs. keep (important)

Convert in the call site:

- **All inline `style={{}}` blocks.** This is the core of the migration.
- **Self-contained, single-selector layout/typography classes** — those
  defined by exactly one CSS rule with no descendant/pseudo dependencies:
  `.page`, `.page-head` (plain), `.page-title`, `.page-sub`, `.card`,
  `.card-pad`, `.muted`, `.mt24`, `.grid`, `.g-2`, `.dash-2col`,
  `.cell-num`, `.spacer`.

**Keep as-is** (do not inline) — classes that rely on descendant or
pseudo selectors, or are reused heavily app-wide as a design-system
vocabulary. Inlining these would either drop behavior or scatter fragile
utility soup across dozens of call sites:

- `.card-head` (styles its child `h3`, `.sub`, `.grow` via descendant
  selectors), `.kv` (`dt`/`dd`), `.tbl` (`thead`/`tbody`/`tr:hover`/
  `.row-alert`), `.fld` (focus-within), `.seg` + `.on`, `.btn` + all
  variants, `.inp`/`.sel`/`.ta` (focus/`.err`), `.badge` + tones,
  `.skel`, `.route`, `.back-link`, `.err-msg`, `.ac-flabel`.
- The standalone `.mono`/`.strong` tokens are only defined under `.tbl`;
  outside a table they are no-ops. Leave them untouched to preserve the
  current rendering (do **not** add `font-mono`/`font-bold`, that would
  change appearance).

### Follow-up: componentize the kept primitives

The kept primitives are now typed React components (Tailwind utilities +
`cva` for variants); each keeps its former descendant/pseudo styling via
arbitrary descendant variants (e.g. `[&_thead_th]:…`) so call-site markup
migrates unchanged. Their `globals.css` rules have been deleted. Done:

- `Card` / `CardHead` / `CardBody` — `components/ui/card.tsx` (was `.card`,
  `.card-head`, `.card-pad`); `Btn` (`.btn`) already existed.
- `Input` / `Select` / `Textarea` — `components/ui/input.tsx`, `cva` `err`
  state, native ref passthrough for react-hook-form (was `.inp`/`.sel`/`.ta`).
- `Table` — `components/ui/table.tsx` (was `.tbl` + `.clickable`/`.row-alert`/
  `.strong`/`.mono`); the `.tbl-wrap` scroll wrapper is now inline
  `overflow-x-auto`.
- `Segmented` — `components/ui/segmented.tsx` (was `.seg`/`.on`).
- `Badge` — `components/ui/badge.tsx`, `cva` tones + shared `Tone` type in
  `lib/design/tones.ts` (was `.badge`/`.t-*`); the status picker's
  `.badge-pick*` extras and `.flag-none` remain.
- `Field` label/error — `FormField` (`components/ui/form-field.tsx`).

Note: the menu/cmdk selected-state marker was renamed `.sel` → `.is-active`
to decouple it from the deleted form `.sel` rule.

## 4. Per-file process

1. **Extract** any inlined sub-components into their own files first
   (markup unchanged), so the styling diff is isolated and reviewable.
2. **Convert** inline styles + self-contained classes per §2/§3.
3. **Prettier**: `pnpm format` (orders Tailwind classes).
4. **Review** the staged diff (`typescript-reviewer`) — watch for px /
   color mismatches and dropped descendant styling.
5. **Verify**: `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, `pnpm run
build`, and confirm any new token utilities appear in the built CSS
   (`grep` the file in `.next/static/chunks/*.css`).
6. **Commit** with `refactor:` (behavior-preserving).

## 5. Rollout checklist (remaining surfaces)

Each is a focused follow-up PR off `main`:

- [x] `app/(app)/page.tsx` (dashboard layout classes + skeletons)
- [x] `app/(app)/drivers/page.tsx`, `drivers/[id]/page.tsx`
- [x] `app/(app)/dispatchers/page.tsx`, `dispatchers/[id]/page.tsx`
- [x] `app/(app)/payments/page.tsx`, `payments/[id]/page.tsx`
- [x] `app/(app)/costs/page.tsx`, `documents/page.tsx`, `timeclock/page.tsx`
- [x] `app/(app)/reports/page.tsx`, `account/page.tsx`, `settings/users/page.tsx`
- [x] `app/(auth)/login/page.tsx`
- [x] `app/(app)/payroll/page.tsx`, `payroll/[id]/page.tsx` (not originally listed
      but swept for completeness)
- [x] `components/shell/*` (sidebar, topbar, profile-menu, command-palette, notifications)
- [x] App-wide inline-`style` + self-contained layout-class sweep (feature
      components, `components/ui/*`, dashboard cards). All static `style={{}}`
      converted; only genuinely dynamic values remain (tone/color maps,
      percentage widths/heights, dynamic `gridTemplateColumns`, prop-driven
      `width`/`size`, dynamic `g-${n}` grids, SVG presentation attributes).
- [x] Primitive componentization (§3): `Card`/`CardHead`/`CardBody`,
      `Input`/`Select`/`Textarea`, `Table`, `Segmented`, `Badge` (+ `Btn`,
      `FormField`, `EntityTable`) are now components and their `globals.css`
      base rules are deleted. Remaining `globals.css` classes are the
      single-property tokens kept by design (`.muted`, `.cell-num`, `.spacer`,
      `.mono`/`.strong`, `.kv`, the grid `.g-*` helpers used by the dynamic
      dashboard grid) and shell/menu vocabulary (`.side*`, `.top*`, `.menu*`,
      `.cmdk*`, `.ntf*`, `.badge-pick*`, `.filterbar`, `.fld`, `.kpi*`, etc.).
