"use client";

import { InfoCard } from "@/components/common/info-card";
import { PreferenceToggleRow } from "@/components/common/settings-row";
import { useNotificationPreferences, useSetNotificationPreference } from "@/lib/data/hooks";
import type { AppRole } from "@/lib/domain/enums";
import {
  NOTIFICATION_TYPE_LABELS,
  notificationPriority,
  typesForRole,
} from "@/lib/domain/notifications";

export function PreferencesTab({ userId, role }: { userId: string; role: AppRole }) {
  const prefsQ = useNotificationPreferences();
  const setPref = useSetNotificationPreference();

  const types = typesForRole(role);
  const mutedTypes = new Set((prefsQ.data ?? []).filter((p) => p.muted).map((p) => p.type));

  return (
    <div className="mt-6 grid gap-[18px]">
      <InfoCard title="In-app notifications">
        {types.map((type) => {
          const isOn = !mutedTypes.has(type);
          return (
            <PreferenceToggleRow
              key={type}
              title={NOTIFICATION_TYPE_LABELS[type]}
              sub={
                notificationPriority(type) === "high"
                  ? "High-priority alert shown in your notification bell."
                  : "Shown in your notification bell."
              }
              on={isOn}
              onChange={() => setPref.mutate({ userId, type, muted: isOn })}
            />
          );
        })}
      </InfoCard>

      <div className="border-border bg-bg-subtle flex items-center gap-4 rounded-[var(--radius-lg)] border px-[18px] py-3.5">
        <span className="text-ink-500 flex-1 text-[13px]">
          Turning a type off stops new notifications of that kind. Changes save automatically.
        </span>
      </div>
    </div>
  );
}
