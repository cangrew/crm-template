"use client";
import { Table } from "@/components/ui/table";

import Link from "next/link";
import { ClientBadge } from "@/components/ui/badges";
import { ClientStatusPicker } from "@/components/ui/client-status-picker";
import type { Agent, Client } from "@/lib/supabase/types";

export function ClientsTable({
  rows,
  agents,
  canUpdate,
}: {
  rows: Client[];
  /** For resolving agent names; a client without one is unassigned (house). */
  agents: Agent[];
  /** Whether the current role may change statuses inline (tenants are read-only). */
  canUpdate: boolean;
}) {
  const agentName = new Map(agents.map((a) => [a.id, a.full_name]));
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Agent</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const fullName = `${c.first_name} ${c.last_name}`;
              return (
                <tr key={c.id} className="clickable">
                  <td className="strong">
                    <Link href={`/clients/${c.id}`} className="block text-inherit no-underline">
                      {fullName}
                      <div className="mono muted text-[11px] font-normal">{c.id.slice(0, 8)}</div>
                    </Link>
                  </td>
                  <td className="muted">{c.agent_id ? (agentName.get(c.agent_id) ?? "—") : "—"}</td>
                  <td className="muted">{c.email ?? "—"}</td>
                  <td className="muted">{c.phone ?? "—"}</td>
                  <td>
                    {canUpdate ? (
                      <ClientStatusPicker
                        clientId={c.id}
                        clientLabel={fullName}
                        status={c.status}
                      />
                    ) : (
                      <ClientBadge status={c.status} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
