"use client";
import { Table } from "@/components/ui/table";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity". */
import Link from "next/link";
import { ContactBadge } from "@/components/ui/badges";
import { ContactStatusPicker } from "@/components/ui/contact-status-picker";
import type { Contact } from "@/lib/supabase/types";

export function ContactsTable({
  rows,
  canUpdate,
}: {
  rows: Contact[];
  /** Whether the current role may change statuses inline (members are read-only). */
  canUpdate: boolean;
}) {
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>Contact</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="clickable">
                <td className="strong">
                  <Link href={`/contacts/${c.id}`} className="block text-inherit no-underline">
                    {c.name}
                    <div className="mono muted text-[11px] font-normal">{c.id.slice(0, 8)}</div>
                  </Link>
                </td>
                <td className="muted">{c.company ?? "—"}</td>
                <td className="muted">{c.email ?? "—"}</td>
                <td className="muted">{c.phone ?? "—"}</td>
                <td>
                  {canUpdate ? (
                    <ContactStatusPicker contactId={c.id} contactLabel={c.name} status={c.status} />
                  ) : (
                    <ContactBadge status={c.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
