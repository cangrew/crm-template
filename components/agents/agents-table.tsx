"use client";
import { Table } from "@/components/ui/table";

import Link from "next/link";
import { AgentBadge } from "@/components/ui/badges";
import { AgentStatusPicker } from "@/components/ui/agent-status-picker";
import { fmtBpsPercent } from "@/lib/domain/bps";
import type { Agency, Agent } from "@/lib/supabase/types";

export function AgentsTable({
  rows,
  agencies,
  canUpdate,
}: {
  rows: Agent[];
  /** For resolving agency names; an agent without one is direct under Findway. */
  agencies: Agency[];
  /** Whether the current role may change statuses inline. */
  canUpdate: boolean;
}) {
  const agencyName = new Map(agencies.map((g) => [g.id, g.name]));
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Agency</th>
              <th>NPN</th>
              <th className="text-right">Split</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="clickable">
                <td className="strong">
                  <Link href={`/agents/${a.id}`} className="block text-inherit no-underline">
                    {a.full_name}
                    <div className="mono muted text-[11px] font-normal">{a.email ?? ""}</div>
                  </Link>
                </td>
                <td className="muted">
                  {a.agency_id ? (agencyName.get(a.agency_id) ?? "—") : "Findway (direct)"}
                </td>
                <td className="mono muted">{a.npn ?? "—"}</td>
                <td className="cell-num">{fmtBpsPercent(a.commission_split_bps)}</td>
                <td>
                  {canUpdate ? (
                    <AgentStatusPicker agentId={a.id} agentLabel={a.full_name} status={a.status} />
                  ) : (
                    <AgentBadge status={a.status} />
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
