import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/design/tones";
import { cn } from "@/lib/utils";

/**
 * Pill badge primitive (replaces the `.badge` + `.t-*` globals classes). Tones
 * map 1:1 to the former tone classes. A `<span className="bdot" />` child still
 * renders the leading dot (styled via descendant variants); leading `svg`
 * icons are sized to 12px.
 */
export const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border px-2.5 py-[3px] text-xs font-semibold leading-[1.4]",
    "[&>svg]:h-3 [&>svg]:w-3",
    "[&>.bdot]:h-1.5 [&>.bdot]:w-1.5 [&>.bdot]:shrink-0 [&>.bdot]:rounded-full [&>.bdot]:bg-current",
  ),
  {
    variants: {
      tone: {
        "t-slate": "border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]",
        "t-orange": "border-brand-200 bg-brand-50 text-brand-700",
        "t-amber": "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
        "t-green": "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
        "t-red": "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
        "t-blue": "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
        "t-indigo": "border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca]",
        "t-teal": "border-[#99f6e4] bg-[#f0fdfa] text-[#0f766e]",
        "t-violet": "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
        "t-green-solid": "border-success bg-success text-white [&>.bdot]:bg-white",
      } satisfies Record<Tone, string>,
    },
    defaultVariants: { tone: "t-slate" },
  },
);

export function Badge({
  tone,
  className,
  children,
  ...rest
}: {
  tone?: Tone;
  className?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...rest}>
      {children}
    </span>
  );
}
