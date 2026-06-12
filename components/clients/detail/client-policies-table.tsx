"use client";

import Link from "next/link";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { PolicyBadge } from "@/components/ui/badges";
import { fmtPremium, policyLabel } from "@/components/policies/policies-table";
import { useCarriers } from "@/lib/data/hooks";
import type { Policy } from "@/lib/supabase/types";

export function ClientPoliciesTable({ policies }: { policies: readonly Policy[] }) {
  const carriersQ = useCarriers();
  const carrierName = new Map((carriersQ.data ?? []).map((k) => [k.id, k.name]));

  const columns: readonly EntityColumn<Policy>[] = [
    {
      key: "policy",
      label: "Policy",
      className: "strong",
      render: (p) => (
        <Link href={`/policies/${p.id}`} className="block text-inherit no-underline">
          <span className="mono">{policyLabel(p)}</span>
          {p.plan_name && <div className="muted text-[11px] font-normal">{p.plan_name}</div>}
        </Link>
      ),
    },
    {
      key: "carrier",
      label: "Carrier",
      className: "muted",
      render: (p) => carrierName.get(p.carrier_id) ?? "—",
    },
    { key: "status", label: "Status", render: (p) => <PolicyBadge status={p.status} /> },
    {
      key: "premium",
      label: "Premium",
      align: "right",
      className: "cell-num",
      render: (p) => fmtPremium(p.monthly_premium_cents),
    },
  ];

  return (
    <EntityTable
      title="Policies"
      rows={policies}
      columns={columns}
      emptyText="No policies for this client yet."
      clickableRows
    />
  );
}
