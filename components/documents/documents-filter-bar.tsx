"use client";

import { Filter, Search } from "lucide-react";
import { KIND_LABELS } from "@/components/documents/document-card";

export function DocumentsFilterBar({
  q,
  onQ,
  kind,
  onKind,
  kinds,
}: {
  q: string;
  onQ: (v: string) => void;
  kind: string;
  onKind: (v: string) => void;
  kinds: string[];
}) {
  return (
    <div className="filterbar">
      <div className="fld search">
        <Search size={15} />
        <input
          aria-label="Search documents by file path or kind"
          placeholder="Search file path, kind…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
        />
      </div>
      <label className="fld">
        <Filter size={15} />
        <select aria-label="Filter by kind" value={kind} onChange={(e) => onKind(e.target.value)}>
          <option value="">All kinds</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k] ?? k}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
