import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";

export type AccountProfile = { id: string; full_name: string; email: string; role: AppRole };

export function AccountSummaryCard({ profile }: { profile: AccountProfile }) {
  return (
    <div className="border-border bg-bg flex items-center gap-5 rounded-[var(--radius-lg)] border px-6 py-[22px] shadow-[var(--shadow-card)]">
      <Avatar name={profile.full_name || profile.email} size={64} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[22px] font-bold tracking-[-0.02em]">
          {profile.full_name || "—"}
        </div>
        <div className="text-ink-500 mt-2 flex flex-wrap items-center gap-3.5 text-[13.5px]">
          <span>{profile.email}</span>
          <span className="text-ink-300">·</span>
          <Badge tone="t-orange">
            <span className="bdot" />
            {APP_ROLE_LABELS[profile.role]}
          </Badge>
        </div>
      </div>
    </div>
  );
}
