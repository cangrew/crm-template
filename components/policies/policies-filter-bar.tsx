"use client";

import { Filter, Landmark, Search } from "lucide-react";
import { POLICY_STATUSES, POLICY_STATUS_LABELS, type PolicyStatus } from "@/lib/domain/enums";
import type { Carrier } from "@/lib/supabase/types";

export function PoliciesFilterBar({
  q,
  onQ,
  status,
  onStatus,
  carrierId,
  onCarrierId,
  carriers,
}: {
  q: string;
  onQ: (v: string) => void;
  status: "" | PolicyStatus;
  onStatus: (v: "" | PolicyStatus) => void;
  carrierId: string;
  onCarrierId: (v: string) => void;
  carriers: Carrier[];
}) {
  return (
    <div className="filterbar">
      <div className="fld search">
        <Search size={15} />
        <input
          placeholder="Search policy #, plan, member ID…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <label className="fld">
        <Filter size={15} />
        <select value={status} onChange={(e) => onStatus(e.target.value as "" | PolicyStatus)}>
          <option value="">All statuses</option>
          {POLICY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {POLICY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="fld">
        <Landmark size={15} />
        <select value={carrierId} onChange={(e) => onCarrierId(e.target.value)}>
          <option value="">All carriers</option>
          {carriers.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
