"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Labeled form field: title (with optional required marker), the control, and
 * an optional error line. The control is nested inside the <label>, so clicking
 * the label focuses it without manual id/htmlFor wiring. This is the one field
 * wrapper for every form — modals, detail cards, settings.
 */
export function FormField({
  label,
  required,
  err,
  children,
}: {
  label: string;
  required?: boolean;
  err?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-ink-800 text-[13px] font-semibold">
          {label}
          {required && <span className="text-brand-600"> *</span>}
        </span>
        {children}
      </label>
      {err && (
        <div className="err-msg">
          <TriangleAlert size={13} />
          {err}
        </div>
      )}
    </div>
  );
}
