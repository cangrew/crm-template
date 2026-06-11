import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
import { InfoCard } from "@/components/common/info-card";

/**
 * A titled card wrapping a related-records table (detail pages). Shows a count
 * badge in the header and a muted empty message when there are no rows; otherwise
 * renders the supplied `<table>` inside the standard `.tbl-wrap`.
 */
export function TableCard({
  title,
  count,
  isEmpty,
  emptyText,
  children,
}: {
  title: ReactNode;
  count?: number;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <InfoCard
      title={title}
      padded={false}
      action={count != null ? <Badge tone="t-slate">{count}</Badge> : undefined}
    >
      {isEmpty ? (
        <div className="p-5">
          <p className="muted m-0 text-[13px]">{emptyText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </InfoCard>
  );
}
