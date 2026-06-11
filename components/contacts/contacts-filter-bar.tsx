"use client";

/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity". */
import { Filter, Search } from "lucide-react";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/domain/enums";

export function ContactsFilterBar({
  q,
  onQ,
  status,
  onStatus,
}: {
  q: string;
  onQ: (v: string) => void;
  status: "" | ContactStatus;
  onStatus: (v: "" | ContactStatus) => void;
}) {
  return (
    <div className="filterbar">
      <div className="fld search">
        <Search size={15} />
        <input
          placeholder="Search name, company, email…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <label className="fld">
        <Filter size={15} />
        <select value={status} onChange={(e) => onStatus(e.target.value as "" | ContactStatus)}>
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTACT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
