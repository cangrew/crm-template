"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageDetailLoading, PageErrorState } from "@/components/common/page-states";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { MatchBadge, StatementBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { can, isAdmin } from "@/lib/auth/roles";
import {
  useCarriers,
  useCurrentProfile,
  useDeleteStatement,
  usePolicies,
  useSetLineMatch,
  useStatement,
  useStatementLines,
  useUpdateLine,
  useVoidStatement,
} from "@/lib/data/hooks";
import { queryKeys } from "@/lib/data/query-keys";
import { fmtMoneyCents, fmtMonth } from "@/lib/design/format";
import { LINE_KINDS, LINE_KIND_LABELS, type LineKind } from "@/lib/domain/enums";
import type { Policy, StatementLine } from "@/lib/supabase/types";

export default function StatementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const statementQ = useStatement(id);
  const linesQ = useStatementLines(id);
  const carriersQ = useCarriers();
  const policiesQ = usePolicies();
  const profileQ = useCurrentProfile();
  const deleteStatement = useDeleteStatement();
  const voidStatement = useVoidStatement();
  const updateLine = useUpdateLine();
  const setLineMatch = useSetLineMatch();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [posting, setPosting] = useState(false);

  const role = profileQ.data?.role ?? null;
  const canUpdate = role != null && can(role, "update", "statements");
  const admin = role != null && isAdmin(role);

  const statement = statementQ.data;
  const lines = useMemo(() => linesQ.data ?? [], [linesQ.data]);

  const carrierPolicies: Policy[] = useMemo(
    () => (policiesQ.data ?? []).filter((p) => p.carrier_id === statement?.carrier_id),
    [policiesQ.data, statement?.carrier_id],
  );
  const policyNumberById = useMemo(
    () => new Map((policiesQ.data ?? []).map((p) => [p.id, p.policy_number ?? p.id.slice(0, 8)])),
    [policiesQ.data],
  );

  const unposted = statement?.status === "draft" || statement?.status === "matching";

  const stats = useMemo(() => {
    let matched = 0;
    let unmatched = 0;
    let total = 0;
    for (const l of lines) {
      total += l.amount_cents;
      if (l.match_status === "auto_matched" || l.match_status === "manual_matched") matched += 1;
      else if (l.match_status === "unmatched") unmatched += 1;
    }
    return { matched, unmatched, total };
  }, [lines]);

  async function post() {
    if (posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/statements/${id}/post`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        posted?: number;
        entries?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Posting failed.");
      toast(`Posted ${body.posted} lines → ${body.entries} ledger entries`, "success");
      qc.invalidateQueries({ queryKey: queryKeys.statements.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
    } catch (e) {
      toast(`Could not post: ${e instanceof Error ? e.message : "unexpected error"}`, "error");
    } finally {
      setPosting(false);
    }
  }

  if (statementQ.isError) {
    return (
      <PageErrorState body="Failed to load this statement." onRetry={() => statementQ.refetch()} />
    );
  }
  if (statementQ.isLoading || !statement) {
    return <PageDetailLoading rows={6} />;
  }

  const carrierName =
    (carriersQ.data ?? []).find((k) => k.id === statement.carrier_id)?.name ?? "Carrier";

  const lineEditable = unposted && canUpdate;

  const columns: EntityColumn<StatementLine>[] = [
    { key: "row", label: "Row #", className: "muted", render: (l) => l.row_index + 1 },
    {
      key: "policy",
      label: "Policy number",
      className: "mono",
      render: (l) => l.policy_number ?? "—",
    },
    { key: "subscriber", label: "Subscriber", render: (l) => l.subscriber_name ?? "—" },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      className: "cell-num strong",
      render: (l) => fmtMoneyCents(l.amount_cents / 100),
    },
    {
      key: "kind",
      label: "Kind",
      render: (l) =>
        lineEditable ? (
          <Select
            aria-label={`Line ${l.row_index + 1} kind`}
            className="!w-[150px] !py-1.5 text-[12.5px]"
            value={l.line_kind}
            onChange={(e) =>
              updateLine.mutate(
                { lineId: l.id, patch: { line_kind: e.target.value as LineKind } },
                { onError: (err) => toast(`Could not update: ${err.message}`, "error") },
              )
            }
          >
            {LINE_KINDS.map((k) => (
              <option key={k} value={k}>
                {LINE_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        ) : (
          LINE_KIND_LABELS[l.line_kind]
        ),
    },
    {
      key: "match",
      label: "Match",
      render: (l) => (
        <div className="flex flex-wrap items-center gap-2">
          <MatchBadge status={l.match_status} />
          {l.matched_policy_id && (
            <span className="mono text-[12px]">
              {policyNumberById.get(l.matched_policy_id) ?? "—"}
            </span>
          )}
          {lineEditable && l.match_status === "unmatched" && (
            <>
              <Select
                aria-label={`Match line ${l.row_index + 1} to a policy`}
                className="!w-[190px] !py-1.5 text-[12.5px]"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  setLineMatch.mutate(
                    {
                      lineId: l.id,
                      patch: {
                        match_status: "manual_matched",
                        matched_policy_id: e.target.value,
                        match_reason: "manual",
                      },
                    },
                    { onError: (err) => toast(`Could not match: ${err.message}`, "error") },
                  );
                }}
              >
                <option value="">Match to policy…</option>
                {carrierPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policy_number ?? p.id.slice(0, 8)}
                  </option>
                ))}
              </Select>
              <Btn
                size="sm"
                variant="ghost"
                onClick={() =>
                  setLineMatch.mutate(
                    {
                      lineId: l.id,
                      patch: {
                        match_status: "ignored",
                        matched_policy_id: null,
                        match_reason: null,
                      },
                    },
                    { onError: (err) => toast(`Could not ignore: ${err.message}`, "error") },
                  )
                }
              >
                Ignore
              </Btn>
            </>
          )}
          {lineEditable && l.match_status === "ignored" && (
            <Btn
              size="sm"
              variant="ghost"
              onClick={() =>
                setLineMatch.mutate(
                  {
                    lineId: l.id,
                    patch: {
                      match_status: "unmatched",
                      matched_policy_id: null,
                      match_reason: null,
                    },
                  },
                  { onError: (err) => toast(`Could not update: ${err.message}`, "error") },
                )
              }
            >
              Unignore
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/statements"
        backLabel="Back to Statements"
        title={`${carrierName} — ${fmtMonth(statement.period_month)}`}
        subtitle={<span className="mono">{statement.id.slice(0, 8)}</span>}
        badges={<StatementBadge status={statement.status} />}
        actions={
          <>
            {unposted && canUpdate && (
              <Btn
                variant="primary"
                icon={<CheckCircle2 size={15} />}
                disabled={posting || stats.matched === 0}
                onClick={post}
              >
                {posting ? "Posting…" : "Post statement"}
              </Btn>
            )}
            {unposted && admin && (
              <Btn
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Btn>
            )}
            {statement.status === "posted" && admin && (
              <Btn variant="danger" icon={<Ban size={15} />} onClick={() => setConfirmVoid(true)}>
                Void statement
              </Btn>
            )}
          </>
        }
      />

      <div className="mb-6">
        <StatGrid cols={4}>
          <StatCard label="Lines" value={lines.length} />
          <StatCard label="Matched" value={stats.matched} />
          <StatCard label="Unmatched" value={stats.unmatched} />
          <StatCard label="Total amount" value={fmtMoneyCents(stats.total / 100)} />
        </StatGrid>
      </div>

      <EntityTable
        title="Statement lines"
        rows={lines}
        columns={columns}
        emptyText={linesQ.isLoading ? "Loading lines…" : "No lines on this statement."}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteStatement.mutate(statement.id, {
            onSuccess: () => {
              toast("Statement deleted", "success");
              router.push("/statements");
            },
            onError: (e) => toast(`Could not delete: ${e.message}`, "error"),
          })
        }
        title="Delete statement?"
        body={`Permanently remove this ${carrierName} statement for ${fmtMonth(statement.period_month)} and all of its staged lines. Nothing has been posted to the ledger.`}
        hint="This cannot be undone."
      />

      <ConfirmDialog
        open={confirmVoid}
        onClose={() => setConfirmVoid(false)}
        onConfirm={() =>
          voidStatement.mutate(statement.id, {
            onSuccess: () =>
              toast("Statement voided — reversing ledger entries written", "success"),
            onError: (e) => toast(`Could not void: ${e.message}`, "error"),
          })
        }
        title="Void statement?"
        body={`Write exact reversing ledger entries for every posted line of this ${carrierName} statement and mark it void. Payee balances will be reduced accordingly.`}
        hint="Reversals are appended to the ledger; the audit trail is preserved."
        confirmLabel="Void statement"
      />
    </div>
  );
}
