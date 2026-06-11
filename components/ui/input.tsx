import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Text field primitives (replace the `.inp`/`.sel`/`.ta` globals classes).
 * `err` swaps the border to the error color (and keeps it on focus), mirroring
 * the former `.err` modifier. Refs and all native props pass straight through,
 * so react-hook-form `{...register()}` spreads keep working.
 */
const field = cva(
  cn(
    "box-border w-full max-w-full min-w-0 rounded-[var(--radius-md)] border bg-bg px-[13px] py-2.5",
    "font-sans text-sm text-ink-900 outline-none transition-[border-color,box-shadow] duration-150",
    "focus:shadow-[var(--ring-brand)]",
  ),
  {
    variants: {
      err: {
        true: "border-error focus:border-error",
        false: "border-border focus:border-brand-500",
      },
    },
    defaultVariants: { err: false },
  },
);

export function Input({
  className,
  err,
  ...rest
}: React.ComponentPropsWithRef<"input"> & { err?: boolean }) {
  return <input className={cn(field({ err }), className)} {...rest} />;
}

export function Select({
  className,
  err,
  ...rest
}: React.ComponentPropsWithRef<"select"> & { err?: boolean }) {
  return <select className={cn(field({ err }), className)} {...rest} />;
}

export function Textarea({
  className,
  err,
  ...rest
}: React.ComponentPropsWithRef<"textarea"> & { err?: boolean }) {
  return (
    <textarea
      className={cn(field({ err }), "min-h-20 resize-y leading-normal", className)}
      {...rest}
    />
  );
}
