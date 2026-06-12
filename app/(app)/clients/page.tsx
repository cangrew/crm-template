"use client";
import { Table } from "@/components/ui/table";

/* List-page pattern: PageHeader + filter bar + table + skeleton/empty/error
 * states, with write affordances gated through can(). */
import { BookUser, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar";
import { ClientsTable } from "@/components/clients/clients-table";
import { NewClientModal } from "@/components/clients/new-client-modal";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useAgents, useClients, useCurrentProfile } from "@/lib/data/hooks";
import { type ClientStatus } from "@/lib/domain/enums";

export default function ClientsPage() {
  const clientsQ = useClients();
  const agentsQ = useAgents();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ClientStatus>("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "clients");
  const canUpdate = role != null && can(role, "update", "clients");

  const clients = clientsQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (clients ?? []).filter((c) => {
      if (
        ql &&
        !(
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(ql) ||
          (c.email ?? "").toLowerCase().includes(ql) ||
          (c.phone ?? "").toLowerCase().includes(ql)
        )
      )
        return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }, [clients, q, status]);

  const all = clients ?? [];
  const active = all.filter((c) => c.status === "active").length;

  if (clientsQ.isError) {
    return <PageErrorState body="Failed to fetch clients." onRetry={() => clientsQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Clients"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Client
            </Btn>
          ) : undefined
        }
      />

      <ClientsFilterBar q={q} onQ={setQ} status={status} onStatus={setStatus} />

      {clientsQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Client", "Agent", "Email", "Phone", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[140, 120, 160, 100, 90]} rows={8} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={BookUser}
            title={all.length === 0 ? "No clients yet" : "No clients match these filters"}
            body={
              all.length === 0
                ? "Add a client to start building the book of business."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <ClientsTable rows={filtered} agents={agentsQ.data ?? []} canUpdate={canUpdate} />
      )}

      <NewClientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
