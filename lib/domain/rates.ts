/**
 * Rate-schedule selection and expected-commission math, used by the statement
 * posting flow (to compute splits' context) and the reconciliation report
 * (expected vs received).
 */
import { applyBps } from "./money";

export interface RateScheduleLike {
  id: string;
  carrier_id: string;
  rate_type: "pmpm" | "percent_of_premium";
  business_type: "new_business" | "renewal";
  pmpm_cents: number | null;
  percent_bps: number | null;
  /** ISO dates; effective_to null = open-ended. Window is inclusive. */
  effective_from: string;
  effective_to: string | null;
  /** null = applies to all states. */
  state: string | null;
}

export interface PickRateQuery {
  businessType: "new_business" | "renewal";
  /** ISO date (the statement period month). */
  periodMonth: string;
  state?: string;
}

/**
 * Select the rate schedule in force for a business type and period. A
 * state-specific schedule beats the catch-all when the query carries a state;
 * without a state, only catch-all schedules are considered. More than one
 * surviving schedule means the windows overlap — that is a data error, so it
 * throws rather than silently picking one.
 */
export function pickRate(
  schedules: readonly RateScheduleLike[],
  { businessType, periodMonth, state }: PickRateQuery,
): RateScheduleLike | null {
  const inWindow = schedules.filter(
    (s) =>
      s.business_type === businessType &&
      s.effective_from <= periodMonth &&
      (s.effective_to === null || periodMonth <= s.effective_to),
  );

  const stateSpecific = state ? inWindow.filter((s) => s.state === state) : [];
  const candidates = stateSpecific.length > 0 ? stateSpecific : inWindow.filter((s) => !s.state);

  if (candidates.length > 1) {
    throw new Error(
      `ambiguous rate schedules for ${businessType} @ ${periodMonth}: ${candidates
        .map((s) => s.id)
        .join(", ")}`,
    );
  }
  return candidates[0] ?? null;
}

/**
 * What the carrier should have paid for one policy-month under a rate
 * schedule: PMPM rates multiply by enrolled members; percent rates apply to
 * the monthly premium.
 */
export function expectedCommissionCents(
  rate: RateScheduleLike,
  { memberCount, premiumCents }: { memberCount: number; premiumCents: number },
): number {
  if (rate.rate_type === "pmpm") {
    return (rate.pmpm_cents ?? 0) * memberCount;
  }
  return applyBps(premiumCents, rate.percent_bps ?? 0);
}
