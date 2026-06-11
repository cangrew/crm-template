"use client";
import { Table } from "@/components/ui/table";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * List-page pattern: PageHeader + filter bar + table + skeleton/empty/error
 * states, with write affordances gated through can(). */
import { BookUser, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ContactsFilterBar } from "@/components/contacts/contacts-filter-bar";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { NewContactModal } from "@/components/contacts/new-contact-modal";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useContacts, useCurrentProfile } from "@/lib/data/hooks";
import { type ContactStatus } from "@/lib/domain/enums";

export default function ContactsPage() {
  const contactsQ = useContacts();
  const profileQ = useCurrentProfile();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ContactStatus>("");
  const [addOpen, setAddOpen] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "contacts");
  const canUpdate = role != null && can(role, "update", "contacts");

  const contacts = contactsQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (contacts ?? []).filter((c) => {
      if (
        ql &&
        !(
          c.name.toLowerCase().includes(ql) ||
          (c.company ?? "").toLowerCase().includes(ql) ||
          (c.email ?? "").toLowerCase().includes(ql)
        )
      )
        return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }, [contacts, q, status]);

  const all = contacts ?? [];
  const active = all.filter((c) => c.status === "active").length;

  if (contactsQ.isError) {
    return <PageErrorState body="Failed to fetch contacts." onRetry={() => contactsQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Contacts"
        subtitle={`${all.length} total · ${active} active`}
        actions={
          canCreate ? (
            <Btn variant="primary" icon={<Plus size={17} />} onClick={() => setAddOpen(true)}>
              New Contact
            </Btn>
          ) : undefined
        }
      />

      <ContactsFilterBar q={q} onQ={setQ} status={status} onStatus={setStatus} />

      {contactsQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Contact", "Company", "Email", "Phone", "Status"].map((h) => (
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
            title={all.length === 0 ? "No contacts yet" : "No contacts match these filters"}
            body={
              all.length === 0
                ? "Add a contact to start tracking relationships."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <ContactsTable rows={filtered} canUpdate={canUpdate} />
      )}

      <NewContactModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
