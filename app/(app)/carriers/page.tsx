"use client";
import { Table } from "@/components/ui/table";

import { Landmark, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CarriersTable } from "@/components/carriers/carriers-table";
import { NewCarrierModal } from "@/components/carriers/new-carrier-modal";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useCarriers, useCurrentProfile } from "@/lib/data/hooks";

export default function CarriersPage() {
  const carriersQ = useCarriers();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "carriers");
  const canUpdate = role != null && can(role, "update", "carriers");

  const carriers = carriersQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (carriers ?? []).filter((k) => !ql || k.name.toLowerCase().includes(ql));
  }, [carriers, q]);

  const all = carriers ?? [];
  const active = all.filter((k) => k.status === "active").length;

  if (carriersQ.isError) {
    return <PageErrorState body="Failed to fetch carriers." onRetry={() => carriersQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Carriers"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Carrier
            </Btn>
          ) : undefined
        }
      />

      <div className="filterbar">
        <div className="fld search">
          <Search size={15} />
          <input placeholder="Search carriers…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {carriersQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Carrier", "Notes", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[160, 220, 90]} rows={6} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={Landmark}
            title={all.length === 0 ? "No carriers yet" : "No carriers match this search"}
            body={
              all.length === 0
                ? "Add a carrier to start tracking its rates and statements."
                : "Try a different search."
            }
          />
        </div>
      ) : (
        <CarriersTable rows={filtered} canUpdate={canUpdate} />
      )}

      <NewCarrierModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
