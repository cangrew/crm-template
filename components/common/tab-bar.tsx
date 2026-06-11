"use client";

import type { ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";

export type TabDef<K extends string> = { key: K; label: string; icon?: ReactNode };

/**
 * Segmented tab bar used in page headers. Renders one button per tab; the active
 * tab gets the `on` class. Used by account, reports, and costs.
 */
export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly TabDef<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <Segmented>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className={active === t.key ? "on" : ""}
          onClick={() => onChange(t.key)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </Segmented>
  );
}
