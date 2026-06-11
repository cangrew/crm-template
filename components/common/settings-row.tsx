"use client";

import type { ReactNode } from "react";

/**
 * A settings list row: leading icon tile, title + subtitle, trailing CTA button.
 * Used by the account security section.
 */
export function SettingsRow({
  icon,
  title,
  sub,
  cta,
  danger,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  cta: string;
  danger?: boolean;
}) {
  return (
    <div className="border-border flex items-center gap-3.5 border-b py-3.5">
      <span className="bg-bg-subtle text-ink-700 grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[var(--radius-md)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-ink-500 mt-0.5 text-[12.5px]">{sub}</div>
      </div>
      <button type="button" className={"btn btn-sm " + (danger ? "btn-danger" : "btn-outline")}>
        {cta}
      </button>
    </div>
  );
}

/**
 * A preference row with a title + subtitle and a custom on/off toggle switch.
 */
export function PreferenceToggleRow({
  title,
  sub,
  on,
  onChange,
}: {
  title: string;
  sub: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <div className="border-border flex items-center gap-4 border-b py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold">{title}</div>
        <div className="text-ink-500 mt-0.5 text-[12.5px]">{sub}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={on}
        aria-label={title}
        className={
          "relative h-6 w-[42px] cursor-pointer rounded-full border-none p-0 transition-colors " +
          (on ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]")
        }
      >
        <span
          className={
            "absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.3)] transition-transform " +
            (on ? "translate-x-[18px]" : "")
          }
        />
      </button>
    </div>
  );
}
