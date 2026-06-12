"use client";
import { Table } from "@/components/ui/table";

import Link from "next/link";
import { CarrierBadge } from "@/components/ui/badges";
import { CarrierStatusPicker } from "@/components/ui/carrier-status-picker";
import type { Carrier } from "@/lib/supabase/types";

export function CarriersTable({
  rows,
  canUpdate,
}: {
  rows: Carrier[];
  /** Whether the current role may change statuses inline. */
  canUpdate: boolean;
}) {
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="clickable">
                <td className="strong">
                  <Link href={`/carriers/${k.id}`} className="block text-inherit no-underline">
                    {k.name}
                    <div className="mono muted text-[11px] font-normal">{k.id.slice(0, 8)}</div>
                  </Link>
                </td>
                <td className="muted">
                  <div className="max-w-[420px] truncate">{k.notes ?? "—"}</div>
                </td>
                <td>
                  {canUpdate ? (
                    <CarrierStatusPicker carrierId={k.id} carrierLabel={k.name} status={k.status} />
                  ) : (
                    <CarrierBadge status={k.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
