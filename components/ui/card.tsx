import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The surface primitive (replaces the `.card` globals class): a bordered,
 * shadowed panel on the base background. Pass `className` for layout tweaks
 * (padding, sticky, grid-column, etc.).
 */
export function Card({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Card header row (replaces `.card-head`). Styles its `h3` title, optional
 * `.sub` subtitle and the `.grow` spacer via descendant variants, so existing
 * header markup migrates unchanged.
 */
export function CardHead({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "border-border flex items-center gap-3 border-b px-5 py-4",
        "[&_.sub]:text-ink-500 [&_.grow]:flex-1 [&_.sub]:text-[12.5px] [&>h3]:text-[15px] [&>h3]:font-bold",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Card body padding (replaces `.card-pad`). */
export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
