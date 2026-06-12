"use client";

import { Filter, Search } from "lucide-react";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/domain/enums";

export function ClientsFilterBar({
  q,
  onQ,
  status,
  onStatus,
}: {
  q: string;
  onQ: (v: string) => void;
  status: "" | ClientStatus;
  onStatus: (v: "" | ClientStatus) => void;
}) {
  return (
    <div className="filterbar">
      <div className="fld search">
        <Search size={15} />
        <input
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <label className="fld">
        <Filter size={15} />
        <select value={status} onChange={(e) => onStatus(e.target.value as "" | ClientStatus)}>
          <option value="">All statuses</option>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
