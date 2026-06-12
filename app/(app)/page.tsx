"use client";

/* Dashboard stub — replace with the KPIs that matter as the platform grows.
 * It intentionally stays light: a StatGrid over the client book and a
 * recent-records EntityTable. */
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { PageErrorState } from "@/components/common/page-states";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { ClientBadge } from "@/components/ui/badges";
import { useClients, useCurrentProfile } from "@/lib/data/hooks";
import { APP_ROLE_LABELS } from "@/lib/domain/enums";
import type { Client } from "@/lib/supabase/types";

const RECENT_COUNT = 5;

const RECENT_COLUMNS: readonly EntityColumn<Client>[] = [
  {
    key: "name",
    label: "Client",
    className: "strong",
    render: (c) => (
      <Link href={`/clients/${c.id}`} className="block text-inherit no-underline">
        {`${c.first_name} ${c.last_name}`}
      </Link>
    ),
  },
  { key: "email", label: "Email", className: "muted", render: (c) => c.email ?? "—" },
  { key: "status", label: "Status", render: (c) => <ClientBadge status={c.status} /> },
  {
    key: "added",
    label: "Added",
    className: "muted",
    render: (c) => c.created_at.slice(0, 10),
  },
];

export default function DashboardPage() {
  const clientsQ = useClients();
  const profileQ = useCurrentProfile();

  if (clientsQ.isError) {
    return (
      <PageErrorState body="Failed to load the dashboard." onRetry={() => clientsQ.refetch()} />
    );
  }

  const clients = clientsQ.data ?? [];
  const byStatus = (s: Client["status"]) => clients.filter((c) => c.status === s).length;
  const recent = [...clients]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, RECENT_COUNT);

  const name = profileQ.data?.full_name || profileQ.data?.email || "there";
  const roleLabel = profileQ.data?.role ? APP_ROLE_LABELS[profileQ.data.role] : null;

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        subtitle={roleLabel ? `Signed in as ${roleLabel}` : "Here's where things stand"}
      />

      <StatGrid cols={4}>
        <StatCard label="Total clients" value={clientsQ.isLoading ? "—" : clients.length} />
        <StatCard label="Active" value={clientsQ.isLoading ? "—" : byStatus("active")} />
        <StatCard label="Prospects" value={clientsQ.isLoading ? "—" : byStatus("prospect")} />
        <StatCard label="Inactive" value={clientsQ.isLoading ? "—" : byStatus("inactive")} />
      </StatGrid>

      <div className="mt-[18px]">
        <EntityTable
          title="Recent clients"
          rows={recent}
          columns={RECENT_COLUMNS}
          emptyText="No clients yet — add one from the Clients page."
          clickableRows
        />
      </div>
    </div>
  );
}
