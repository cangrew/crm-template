"use client";
import { Table } from "@/components/ui/table";

import { Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { NewPolicyModal } from "@/components/policies/new-policy-modal";
import { PoliciesFilterBar } from "@/components/policies/policies-filter-bar";
import { PoliciesTable } from "@/components/policies/policies-table";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import {
  useAgents,
  useCarriers,
  useClients,
  useCurrentProfile,
  usePolicies,
} from "@/lib/data/hooks";
import { type PolicyStatus } from "@/lib/domain/enums";

export default function PoliciesPage() {
  const policiesQ = usePolicies();
  const clientsQ = useClients();
  const carriersQ = useCarriers();
  const agentsQ = useAgents();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | PolicyStatus>("");
  const [carrierId, setCarrierId] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "policies");
  const canUpdate = role != null && can(role, "update", "policies");

  const policies = policiesQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (policies ?? []).filter((p) => {
      if (
        ql &&
        !(
          (p.policy_number ?? "").toLowerCase().includes(ql) ||
          (p.plan_name ?? "").toLowerCase().includes(ql) ||
          (p.carrier_member_id ?? "").toLowerCase().includes(ql)
        )
      )
        return false;
      if (status && p.status !== status) return false;
      if (carrierId && p.carrier_id !== carrierId) return false;
      return true;
    });
  }, [policies, q, status, carrierId]);

  const all = policies ?? [];
  const active = all.filter((p) => p.status === "active").length;

  if (policiesQ.isError) {
    return <PageErrorState body="Failed to fetch policies." onRetry={() => policiesQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Policies"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Policy
            </Btn>
          ) : undefined
        }
      />

      <PoliciesFilterBar
        q={q}
        onQ={setQ}
        status={status}
        onStatus={setStatus}
        carrierId={carrierId}
        onCarrierId={setCarrierId}
        carriers={carriersQ.data ?? []}
      />

      {policiesQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Policy", "Client", "Carrier", "Agent", "Members", "Premium", "Status"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <TableSkeleton cols={[140, 130, 120, 120, 70, 90, 90]} rows={8} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={ShieldCheck}
            title={all.length === 0 ? "No policies yet" : "No policies match these filters"}
            body={
              all.length === 0
                ? "Add a policy to start tracking production."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <PoliciesTable
          rows={filtered}
          clients={clientsQ.data ?? []}
          carriers={carriersQ.data ?? []}
          agents={agentsQ.data ?? []}
          canUpdate={canUpdate}
        />
      )}

      <NewPolicyModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
