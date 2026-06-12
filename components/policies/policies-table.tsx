"use client";
import { Table } from "@/components/ui/table";

import Link from "next/link";
import { PolicyBadge } from "@/components/ui/badges";
import { PolicyStatusPicker } from "@/components/ui/policy-status-picker";
import { fmtMoneyCents } from "@/lib/design/format";
import type { Agent, Carrier, Client, Policy } from "@/lib/supabase/types";

/** The label shown for a policy anywhere it is named: number or short id. */
export function policyLabel(p: Policy): string {
  return p.policy_number ?? p.id.slice(0, 8);
}

/** Premiums are stored in cents; fmtMoneyCents formats a dollar-valued number. */
export function fmtPremium(cents: number | null): string {
  return cents == null ? "—" : fmtMoneyCents(cents / 100);
}

export function PoliciesTable({
  rows,
  clients,
  carriers,
  agents,
  canUpdate,
}: {
  rows: Policy[];
  /** Lookup lists for resolving the policy's client/carrier/agent names. */
  clients: Client[];
  carriers: Carrier[];
  agents: Agent[];
  /** Whether the current role may change statuses inline (tenants are read-only). */
  canUpdate: boolean;
}) {
  const clientName = new Map(clients.map((c) => [c.id, `${c.first_name} ${c.last_name}`]));
  const carrierName = new Map(carriers.map((k) => [k.id, k.name]));
  const agentName = new Map(agents.map((a) => [a.id, a.full_name]));
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Policy</th>
              <th>Client</th>
              <th>Carrier</th>
              <th>Agent</th>
              <th className="text-right">Members</th>
              <th className="text-right">Premium</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const label = policyLabel(p);
              return (
                <tr key={p.id} className="clickable">
                  <td className="strong">
                    <Link href={`/policies/${p.id}`} className="block text-inherit no-underline">
                      <span className="mono">{label}</span>
                      {p.plan_name && (
                        <div className="muted text-[11px] font-normal">{p.plan_name}</div>
                      )}
                    </Link>
                  </td>
                  <td className="muted">{clientName.get(p.client_id) ?? "—"}</td>
                  <td className="muted">{carrierName.get(p.carrier_id) ?? "—"}</td>
                  <td className="muted">{agentName.get(p.agent_id) ?? "—"}</td>
                  <td className="cell-num">{p.member_count}</td>
                  <td className="cell-num">{fmtPremium(p.monthly_premium_cents)}</td>
                  <td>
                    {canUpdate ? (
                      <PolicyStatusPicker policyId={p.id} policyLabel={label} status={p.status} />
                    ) : (
                      <PolicyBadge status={p.status} />
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
