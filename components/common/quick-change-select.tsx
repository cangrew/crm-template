"use client";

import type { ReactNode } from "react";

/**
 * Inline quick-change control: a visible badge (passed as `children`) overlaid by
 * a transparent, zero-width native `<select>` so a status/role can be changed in
 * place inside a table row without navigating. `stopPropagation` is baked in so
 * the change does not trigger the row's click/navigation handler.
 *
 * Extracted from the drivers table status cell; also used for user roles.
 */
export function QuickChangeSelect<T extends string>({
  value,
  options,
  onChange,
  title,
  children,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        title={title}
        aria-label={title}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none border-none bg-transparent p-0 opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {children}
    </span>
  );
}
