import type { ContactStatus } from "@/lib/domain/enums";

/** Badge tone tokens (see components/ui/badge.tsx). */
export type Tone =
  | "t-slate"
  | "t-orange"
  | "t-amber"
  | "t-green"
  | "t-red"
  | "t-blue"
  | "t-indigo"
  | "t-teal"
  | "t-violet"
  | "t-green-solid";

/* EXAMPLE ENTITY (contacts) — safe to delete; see README "Removing the example
 * entity". Each status enum gets a tone map so badges, pickers, and filter
 * bars stay visually consistent. */
export const contactTone: Record<ContactStatus, Tone> = {
  lead: "t-amber",
  active: "t-green",
  at_risk: "t-red",
  closed: "t-slate",
};
