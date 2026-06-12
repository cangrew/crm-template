"use client";
import { Table } from "@/components/ui/table";

import { Filter, Plus, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AgentsTable } from "@/components/agents/agents-table";
import { NewAgentModal } from "@/components/agents/new-agent-modal";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useAgencies, useAgents, useCurrentProfile } from "@/lib/data/hooks";
import { AGENT_STATUSES, AGENT_STATUS_LABELS, type AgentStatus } from "@/lib/domain/enums";

export default function AgentsPage() {
  const agentsQ = useAgents();
  const agenciesQ = useAgencies();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | AgentStatus>("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "agents");
  const canUpdate = role != null && can(role, "update", "agents");

  const agents = agentsQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (agents ?? []).filter((a) => {
      if (
        ql &&
        !(
          a.full_name.toLowerCase().includes(ql) ||
          (a.email ?? "").toLowerCase().includes(ql) ||
          (a.npn ?? "").toLowerCase().includes(ql)
        )
      )
        return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }, [agents, q, status]);

  const all = agents ?? [];
  const active = all.filter((a) => a.status === "active").length;

  if (agentsQ.isError) {
    return <PageErrorState body="Failed to fetch agents." onRetry={() => agentsQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Agents"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Agent
            </Btn>
          ) : undefined
        }
      />

      <div className="filterbar">
        <div className="fld search">
          <Search size={15} />
          <input
            placeholder="Search name, email, NPN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <label className="fld">
          <Filter size={15} />
          <select value={status} onChange={(e) => setStatus(e.target.value as "" | AgentStatus)}>
            <option value="">All statuses</option>
            {AGENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {AGENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {agentsQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Agent", "Agency", "NPN", "Split", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[150, 130, 100, 70, 90]} rows={8} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={UserRound}
            title={all.length === 0 ? "No agents yet" : "No agents match these filters"}
            body={
              all.length === 0
                ? "Add an agent to start tracking production."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <AgentsTable rows={filtered} agencies={agenciesQ.data ?? []} canUpdate={canUpdate} />
      )}

      <NewAgentModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
