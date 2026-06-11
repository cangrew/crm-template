import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented control container (replaces the `.seg` globals class). Renders its
 * child `<button>`s with the segmented styling — the active button gets the
 * `on` marker class — via descendant variants, so existing button markup
 * migrates unchanged.
 */
export function Segmented({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "border-border bg-bg-subtle inline-flex rounded-[var(--radius-md)] border p-[3px]",
        "[&>button]:text-ink-500 [&>button]:inline-flex [&>button]:cursor-pointer [&>button]:items-center [&>button]:gap-1.5 [&>button]:rounded-[var(--radius-sm)] [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-[13px] [&>button]:py-1.5 [&>button]:text-[13px] [&>button]:font-semibold",
        "[&>button>svg]:h-[15px] [&>button>svg]:w-[15px]",
        "[&>button.on]:bg-bg [&>button.on]:text-ink-900 [&>button.on]:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
