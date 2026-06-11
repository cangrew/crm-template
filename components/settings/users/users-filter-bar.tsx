"use client";

import { Search } from "lucide-react";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";

export function UsersFilterBar({
  q,
  onQ,
  role,
  onRole,
}: {
  q: string;
  onQ: (v: string) => void;
  role: "" | AppRole;
  onRole: (v: "" | AppRole) => void;
}) {
  return (
    <div className="filterbar">
      <div className="fld search">
        <Search size={15} />
        <input
          aria-label="Search by name or email"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <label className="fld">
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(e) => onRole(e.target.value as "" | AppRole)}
        >
          <option value="">All roles</option>
          {(Object.keys(APP_ROLE_LABELS) as AppRole[]).map((r) => (
            <option key={r} value={r}>
              {APP_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
