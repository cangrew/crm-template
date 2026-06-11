import { Input } from "@/components/ui/input";
import { Lock, Mail, Smartphone } from "lucide-react";
import type { AccountProfile } from "@/components/account/account-summary-card";
import { InfoCard } from "@/components/common/info-card";
import { SettingsRow } from "@/components/common/settings-row";
import { APP_ROLE_LABELS } from "@/lib/domain/enums";

function AccountField({
  label,
  value,
  locked,
}: {
  label: string;
  value: string;
  locked?: boolean;
}) {
  const id = "acct-" + label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink-700 text-[12.5px] font-semibold">
        {label}
      </label>
      <Input id={id} className="h-10" defaultValue={value} disabled={locked} />
    </div>
  );
}

export function ProfileTab({ profile }: { profile: AccountProfile }) {
  return (
    <div className="mt-6 grid gap-[18px]">
      <InfoCard title="Personal info">
        <div className="grid grid-cols-2 gap-x-[18px] gap-y-4">
          <AccountField label="Full name" value={profile.full_name || "—"} />
          <AccountField label="Email" value={profile.email} locked />
          <AccountField label="Role" value={APP_ROLE_LABELS[profile.role]} locked />
          <AccountField label="Time zone" value="America/New_York" />
        </div>
        <p className="text-ink-500 mt-4 flex items-center gap-[7px] text-[12.5px]">
          <Lock size={14} /> Email and role are managed by an administrator.
        </p>
      </InfoCard>

      <InfoCard title="Security">
        <SettingsRow
          icon={<Mail size={18} />}
          title="Microsoft Entra ID"
          sub="Sign in with your work account · single sign-on"
          cta="Manage"
        />
        <SettingsRow
          icon={<Smartphone size={18} />}
          title="Two-factor authentication"
          sub="Required by your organization, enforced via Entra"
          cta="View policy"
        />
        <SettingsRow
          icon={<Lock size={18} />}
          title="Active sessions"
          sub="2 active devices, last login from this browser"
          cta="Sign out other devices"
          danger
        />
      </InfoCard>
    </div>
  );
}
