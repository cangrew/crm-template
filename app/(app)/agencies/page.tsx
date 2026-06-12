"use client";
import { Table } from "@/components/ui/table";

import { Building2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AgenciesTable } from "@/components/agencies/agencies-table";
import { NewAgencyModal } from "@/components/agencies/new-agency-modal";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useAgencies, useCurrentProfile } from "@/lib/data/hooks";

export default function AgenciesPage() {
  const agenciesQ = useAgencies();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "agencies");
  const canUpdate = role != null && can(role, "update", "agencies");

  const agencies = agenciesQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (agencies ?? []).filter((g) => !ql || g.name.toLowerCase().includes(ql));
  }, [agencies, q]);

  const all = agencies ?? [];
  const active = all.filter((g) => g.status === "active").length;

  if (agenciesQ.isError) {
    return <PageErrorState body="Failed to fetch agencies." onRetry={() => agenciesQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Agencies"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Agency
            </Btn>
          ) : undefined
        }
      />

      <div className="filterbar">
        <div className="fld search">
          <Search size={15} />
          <input placeholder="Search agencies…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {agenciesQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Agency", "Commission cut", "Override cut", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[160, 110, 110, 90]} rows={6} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={Building2}
            title={all.length === 0 ? "No agencies yet" : "No agencies match this search"}
            body={
              all.length === 0
                ? "Add a sub-agency to start tracking its agents and cuts."
                : "Try a different search."
            }
          />
        </div>
      ) : (
        <AgenciesTable rows={filtered} canUpdate={canUpdate} />
      )}

      <NewAgencyModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
