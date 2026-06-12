import { Table } from "@/components/ui/table";
import type { ReactNode } from "react";
import { TableCard } from "@/components/common/table-card";

export interface EntityColumn<T> {
  key: string;
  label: ReactNode;
  /** Right-align the header (numeric columns). Cells set their own classes. */
  align?: "right";
  /** Class applied to every body cell in this column (e.g. "cell-num strong"). */
  className?: string;
  render: (row: T) => ReactNode;
}

/**
 * Titled card with a related-records table, driven by a column config instead
 * of hand-rolled <table> markup. Wraps {@link TableCard}, so the count badge
 * and empty state come for free. Use for the per-entity tables on detail pages
 * (a client's documents, …).
 */
export function EntityTable<T extends { id: string }>({
  title,
  rows,
  columns,
  emptyText,
  action,
  clickableRows = false,
}: {
  title: ReactNode;
  rows: readonly T[];
  columns: readonly EntityColumn<T>[];
  emptyText: string;
  /** Optional header control (e.g. an "Add" button) rendered after the count. */
  action?: ReactNode;
  clickableRows?: boolean;
}) {
  return (
    <TableCard
      title={title}
      count={rows.length}
      isEmpty={rows.length === 0}
      emptyText={emptyText}
      action={action}
    >
      <Table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={clickableRows ? "clickable" : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableCard>
  );
}
