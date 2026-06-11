"use client";

/* Dashboard stub — replace with the KPIs that matter to the company you are
 * tailoring this template for. It intentionally stays light: a StatGrid over
 * the example entity and a recent-records EntityTable, both deletable with
 * the contacts example (see README "Removing the example entity"). */
import Link from "next/link";
import { PageHeader } from "@/components/common/page-header";
import { PageErrorState } from "@/components/common/page-states";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { ContactBadge } from "@/components/ui/badges";
import { useContacts, useCurrentProfile } from "@/lib/data/hooks";
import { APP_ROLE_LABELS } from "@/lib/domain/enums";
import type { Contact } from "@/lib/supabase/types";

const RECENT_COUNT = 5;

const RECENT_COLUMNS: readonly EntityColumn<Contact>[] = [
  {
    key: "name",
    label: "Contact",
    className: "strong",
    render: (c) => (
      <Link href={`/contacts/${c.id}`} className="block text-inherit no-underline">
        {c.name}
      </Link>
    ),
  },
  { key: "company", label: "Company", className: "muted", render: (c) => c.company ?? "—" },
  { key: "status", label: "Status", render: (c) => <ContactBadge status={c.status} /> },
  {
    key: "added",
    label: "Added",
    className: "muted",
    render: (c) => c.created_at.slice(0, 10),
  },
];

export default function DashboardPage() {
  const contactsQ = useContacts();
  const profileQ = useCurrentProfile();

  if (contactsQ.isError) {
    return (
      <PageErrorState body="Failed to load the dashboard." onRetry={() => contactsQ.refetch()} />
    );
  }

  const contacts = contactsQ.data ?? [];
  const byStatus = (s: Contact["status"]) => contacts.filter((c) => c.status === s).length;
  const recent = [...contacts]
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
        <StatCard label="Total contacts" value={contactsQ.isLoading ? "—" : contacts.length} />
        <StatCard label="Active" value={contactsQ.isLoading ? "—" : byStatus("active")} />
        <StatCard label="Leads" value={contactsQ.isLoading ? "—" : byStatus("lead")} />
        <StatCard label="At risk" value={contactsQ.isLoading ? "—" : byStatus("at_risk")} />
      </StatGrid>

      <div className="mt-[18px]">
        <EntityTable
          title="Recent contacts"
          rows={recent}
          columns={RECENT_COLUMNS}
          emptyText="No contacts yet — add one from the Contacts page."
          clickableRows
        />
      </div>
    </div>
  );
}
