import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "orange" | "green" | "red" | "blue" | "amber";

const toneBg: Record<Tone, string> = {
  orange: "var(--brand-50)",
  green: "#f0fdf4",
  red: "#fef2f2",
  blue: "#eff6ff",
  amber: "#fffbeb",
};
const toneFg: Record<Tone, string> = {
  orange: "var(--brand-600)",
  green: "#15803d",
  red: "#b91c1c",
  blue: "#1d4ed8",
  amber: "#b45309",
};

type Props = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  onClick?: () => void;
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
  delta,
  deltaDir,
  onClick,
}: Props) {
  const deltaCls =
    deltaDir === "up" ? "delta-up" : deltaDir === "down" ? "delta-down" : "delta-flat";
  return (
    <Card className={cn("kpi", onClick ? "cursor-pointer" : "cursor-default")} onClick={onClick}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" style={{ background: toneBg[tone], color: toneFg[tone] }}>
          <Icon size={19} />
        </span>
      </div>
      <div className="kpi-val">{value}</div>
      {delta && (
        <span className={"kpi-delta " + deltaCls}>
          {deltaDir === "up" && <ArrowUp size={13} />}
          {deltaDir === "down" && <ArrowDown size={13} />}
          {delta}
        </span>
      )}
    </Card>
  );
}
