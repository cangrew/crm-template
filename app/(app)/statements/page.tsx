"use client";
import { Table } from "@/components/ui/table";

import { FileSpreadsheet, Filter, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageErrorState } from "@/components/common/page-states";
import { PageHeader } from "@/components/common/page-header";
import { StatementBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { can } from "@/lib/auth/roles";
import { useCarriers, useCurrentProfile, useStatements } from "@/lib/data/hooks";
import { fmtMoneyCents, fmtMonth } from "@/lib/design/format";
import {
  STATEMENT_STATUSES,
  STATEMENT_STATUS_LABELS,
  type StatementStatus,
} from "@/lib/domain/enums";

export default function StatementsPage() {
  const statementsQ = useStatements();
  const carriersQ = useCarriers();
  const profileQ = useCurrentProfile();
  const [carrierId, setCarrierId] = useState("");
  const [status, setStatus] = useState<"" | StatementStatus>("");

  const role = profileQ.data?.role ?? null;
  const canCreate = role != null && can(role, "create", "statements");

  const carriers = useMemo(() => carriersQ.data ?? [], [carriersQ.data]);
  const carrierName = useMemo(() => new Map(carriers.map((k) => [k.id, k.name])), [carriers]);

  const all = useMemo(() => statementsQ.data ?? [], [statementsQ.data]);
  const filtered = useMemo(
    () =>
      all.filter((s) => {
        if (carrierId && s.carrier_id !== carrierId) return false;
        if (status && s.status !== status) return false;
        return true;
      }),
    [all, carrierId, status],
  );

  if (statementsQ.isError) {
    return (
      <PageErrorState body="Failed to fetch statements." onRetry={() => statementsQ.refetch()} />
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="Statements"
        subtitle={`${all.length} imported`}
        actions={
          canCreate ? (
            <Link href="/statements/new" className="no-underline">
              <Btn variant="primary" icon={<Plus size={17} />}>
                Import statement
              </Btn>
            </Link>
          ) : undefined
        }
      />

      <div className="filterbar">
        <label className="fld">
          <Landmark size={15} />
          <select value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
            <option value="">All carriers</option>
            {carriers.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </label>
        <label className="fld">
          <Filter size={15} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | StatementStatus)}
          >
            <option value="">All statuses</option>
            {STATEMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATEMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {statementsQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["Period", "Carrier", "Lines", "Total", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[120, 160, 60, 90, 90]} rows={6} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={FileSpreadsheet}
            title={
              all.length === 0 ? "No statements imported yet" : "No statements match these filters"
            }
            body={
              all.length === 0
                ? "Import a carrier commission statement to start posting commissions."
                : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Carrier</th>
                  <th>Lines</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="clickable">
                    <td className="strong">
                      <Link
                        href={`/statements/${s.id}`}
                        className="block text-inherit no-underline"
                      >
                        {fmtMonth(s.period_month)}
                        <div className="mono muted text-[11px] font-normal">{s.id.slice(0, 8)}</div>
                      </Link>
                    </td>
                    <td>{carrierName.get(s.carrier_id) ?? "—"}</td>
                    <td className="cell-num">{s.line_count}</td>
                    <td className="cell-num strong">{fmtMoneyCents(s.total_amount_cents / 100)}</td>
                    <td>
                      <StatementBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
