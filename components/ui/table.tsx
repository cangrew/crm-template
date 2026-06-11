import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Data table primitive (replaces the `.tbl` globals class). All of the former
 * descendant styling — sticky uppercase headers, row borders, hover, the
 * `.clickable`/`.row-alert` row modifiers and the `.strong`/`.mono` cell
 * tokens — is reproduced here via descendant variants, so existing
 * `<thead>/<tbody>` markup migrates unchanged.
 */
export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-[13.5px]",
        // header cells
        "[&_thead_th]:border-border [&_thead_th]:bg-bg-subtle [&_thead_th]:text-ink-500 [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:border-b [&_thead_th]:px-[var(--cell-px)] [&_thead_th]:py-2.5 [&_thead_th]:text-left [&_thead_th]:text-[11px] [&_thead_th]:font-semibold [&_thead_th]:tracking-[0.04em] [&_thead_th]:whitespace-nowrap [&_thead_th]:uppercase",
        // body cells
        "[&_tbody_td]:border-border [&_tbody_td]:text-ink-700 [&_tbody_td]:border-b [&_tbody_td]:px-[var(--cell-px)] [&_tbody_td]:py-[var(--row-py)] [&_tbody_td]:align-middle",
        // rows + modifiers
        "[&_tbody_tr:hover]:bg-bg-subtle [&_tbody_tr]:transition-[background] [&_tbody_tr]:duration-[120ms] [&_tbody_tr.clickable]:cursor-pointer [&_tbody_tr.row-alert]:bg-[#fef6f6] [&_tbody_tr.row-alert:hover]:bg-[#fdedec]",
        // cell text tokens (scoped to the table, mirroring `.tbl .strong/.mono/.muted`)
        "[&_.strong]:text-ink-900 [&_.muted]:text-ink-500 [&_.mono]:font-mono [&_.mono]:text-[12.5px] [&_.strong]:font-semibold",
        className,
      )}
    >
      {children}
    </table>
  );
}
