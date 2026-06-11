import { Lock } from "lucide-react";

export function ReadOnlyPill({ label = "Read-only" }: { label?: string }) {
  return (
    <span className="readonly-pill">
      <Lock size={13} />
      {label}
    </span>
  );
}
