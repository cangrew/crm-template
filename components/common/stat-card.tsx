import type { ReactNode } from "react";

type Cols = 2 | 3 | 4;
type DeltaDir = "up" | "down" | "flat";

/**
 * A `.g-N grid` of stat cards. Used by reports and costs tab headers.
 */
export function StatGrid({ cols, children }: { cols: Cols; children: ReactNode }) {
  return <div className={`g-${cols} grid`}>{children}</div>;
}

/**
 * An icon-less metric card (`.card kpi`): label, value, and an optional delta line.
 * For metric cards with a leading icon, use `components/ui/kpi-card.tsx` instead.
 */
export function StatCard({
  label,
  value,
  delta,
  deltaDir = "flat",
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaDir?: DeltaDir;
}) {
  return (
    <div className="kpi border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val">{value}</div>
      {delta != null && <span className={"kpi-delta delta-" + deltaDir}>{delta}</span>}
    </div>
  );
}
