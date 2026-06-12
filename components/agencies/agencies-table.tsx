"use client";
import { Table } from "@/components/ui/table";

import Link from "next/link";
import { AgencyBadge } from "@/components/ui/badges";
import { AgencyStatusPicker } from "@/components/ui/agency-status-picker";
import { fmtBpsPercent } from "@/lib/domain/bps";
import type { Agency } from "@/lib/supabase/types";

export function AgenciesTable({
  rows,
  canUpdate,
}: {
  rows: Agency[];
  /** Whether the current role may change statuses inline. */
  canUpdate: boolean;
}) {
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Agency</th>
              <th className="text-right">Commission cut</th>
              <th className="text-right">Override cut</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} className="clickable">
                <td className="strong">
                  <Link href={`/agencies/${g.id}`} className="block text-inherit no-underline">
                    {g.name}
                    <div className="mono muted text-[11px] font-normal">{g.id.slice(0, 8)}</div>
                  </Link>
                </td>
                <td className="cell-num">{fmtBpsPercent(g.commission_cut_bps)}</td>
                <td className="cell-num">{fmtBpsPercent(g.override_cut_bps)}</td>
                <td>
                  {canUpdate ? (
                    <AgencyStatusPicker agencyId={g.id} agencyLabel={g.name} status={g.status} />
                  ) : (
                    <AgencyBadge status={g.status} />
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
