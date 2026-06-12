"use client";

import { ArrowLeft, ArrowRight, Check, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard, StatGrid } from "@/components/common/stat-card";
import { MatchBadge } from "@/components/ui/badges";
import { Btn } from "@/components/ui/btn";
import { Dropzone, FileCard } from "@/components/ui/dropzone";
import { FormField as Field } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  useBulkInsertLines,
  useCarriers,
  useClients,
  useCreateCsvMapping,
  useCreateStatement,
  useCsvMappingsByCarrier,
  useCurrentProfile,
  usePolicies,
  useStatementUpload,
  useUpdateStatement,
} from "@/lib/data/hooks";
import { fmtMoneyCents } from "@/lib/design/format";
import {
  STATEMENT_FIELDS,
  STATEMENT_FIELD_LABELS,
  computeHeaderSignature,
  prefillMapping,
  type StatementField,
} from "@/lib/domain/mapping-prefill";
import {
  matchLine,
  parseStatementCsv,
  type MatchCandidate,
  type MatchResult,
  type ParsedStatementLine,
  type StatementFieldMapping,
} from "@/lib/domain/statement-matching";
import type { StatementLineInput } from "@/lib/domain/schemas";
import type { MatchStatus } from "@/lib/domain/enums";

const STEPS = [
  { value: "source", label: "Carrier & period" },
  { value: "mapping", label: "Column mapping" },
  { value: "match", label: "Match" },
  { value: "review", label: "Review & create" },
] as const;

type StepValue = (typeof STEPS)[number]["value"];

/** A human decision overriding (or resolving) the matcher's verdict for a row. */
type Resolution =
  | { type: "accept"; policyId: string }
  | { type: "manual"; policyId: string }
  | { type: "ignore" };

interface WizardState {
  step: StepValue;
  carrierId: string;
  /** From <input type="month">, e.g. "2026-05". */
  periodInput: string;
  file: File | null;
  headers: string[];
  rows: Record<string, string>[];
  mapping: StatementFieldMapping;
  /** Null until the mapping step computed its prefill for the current file. */
  prefillSource: "signature" | "fuzzy" | "none" | null;
  saveMapping: boolean;
  mappingName: string;
  /** Keyed by parsed rowIndex. */
  resolutions: Record<number, Resolution>;
}

const INITIAL: WizardState = {
  step: "source",
  carrierId: "",
  periodInput: "",
  file: null,
  headers: [],
  rows: [],
  mapping: {},
  prefillSource: null,
  saveMapping: true,
  mappingName: "",
  resolutions: {},
};

interface EffectiveMatch {
  status: MatchStatus;
  policyId: string | null;
  reason: string | null;
  suggestion: { policyId: string } | null;
}

function effectiveMatch(auto: MatchResult, resolution: Resolution | undefined): EffectiveMatch {
  if (resolution?.type === "ignore") {
    return { status: "ignored", policyId: null, reason: null, suggestion: null };
  }
  if (resolution?.type === "accept") {
    return {
      status: "manual_matched",
      policyId: resolution.policyId,
      reason: "name_dob",
      suggestion: null,
    };
  }
  if (resolution?.type === "manual") {
    return {
      status: "manual_matched",
      policyId: resolution.policyId,
      reason: "manual",
      suggestion: null,
    };
  }
  if (auto.status === "auto_matched") {
    return {
      status: "auto_matched",
      policyId: auto.policyId,
      reason: auto.reason,
      suggestion: null,
    };
  }
  return {
    status: "unmatched",
    policyId: null,
    reason: null,
    suggestion: auto.suggestion ? { policyId: auto.suggestion.policyId } : null,
  };
}

export default function NewStatementPage() {
  const router = useRouter();
  const toast = useToast();
  const carriersQ = useCarriers();
  const policiesQ = usePolicies();
  const clientsQ = useClients();
  const profileQ = useCurrentProfile();
  const [state, setState] = useState<WizardState>(INITIAL);
  const mappingsQ = useCsvMappingsByCarrier(state.carrierId);
  const createStatement = useCreateStatement();
  const updateStatement = useUpdateStatement();
  const statementUpload = useStatementUpload();
  const createCsvMapping = useCreateCsvMapping();
  const bulkInsertLines = useBulkInsertLines();
  const [creating, setCreating] = useState(false);

  const carriers = (carriersQ.data ?? []).filter((k) => k.status === "active");
  const carrier = carriers.find((k) => k.id === state.carrierId) ?? null;

  /* ------------------------------------------------------------- parsing --- */
  const parsedLines = useMemo(
    () => parseStatementCsv(state.rows, state.mapping),
    [state.rows, state.mapping],
  );

  const candidates: MatchCandidate[] = useMemo(() => {
    const clientById = new Map((clientsQ.data ?? []).map((c) => [c.id, c]));
    return (policiesQ.data ?? [])
      .filter((p) => p.carrier_id === state.carrierId)
      .map((p) => {
        const c = clientById.get(p.client_id);
        return {
          policyId: p.id,
          policyNumber: p.policy_number,
          carrierMemberId: p.carrier_member_id,
          clientFirstName: c?.first_name ?? "",
          clientLastName: c?.last_name ?? "",
          clientDob: c?.dob ?? null,
        };
      });
  }, [policiesQ.data, clientsQ.data, state.carrierId]);

  const autoResults = useMemo(
    () => parsedLines.map((l) => matchLine(l, candidates)),
    [parsedLines, candidates],
  );

  const effective = useMemo(
    () => parsedLines.map((l, i) => effectiveMatch(autoResults[i], state.resolutions[l.rowIndex])),
    [parsedLines, autoResults, state.resolutions],
  );

  const policyNumber = useMemo(() => {
    const byId = new Map(
      (policiesQ.data ?? []).map((p) => [p.id, p.policy_number ?? p.id.slice(0, 8)]),
    );
    return (id: string | null) => (id ? (byId.get(id) ?? "—") : "—");
  }, [policiesQ.data]);

  const counts = useMemo(() => {
    let auto = 0;
    let manual = 0;
    let suggested = 0;
    let unmatched = 0;
    let ignored = 0;
    for (const e of effective) {
      if (e.status === "auto_matched") auto += 1;
      else if (e.status === "manual_matched") manual += 1;
      else if (e.status === "ignored") ignored += 1;
      else if (e.suggestion) suggested += 1;
      else unmatched += 1;
    }
    return { auto, manual, suggested, unmatched, ignored };
  }, [effective]);

  const totalCents = useMemo(
    () => parsedLines.reduce((sum, l) => sum + l.amountCents, 0),
    [parsedLines],
  );

  /* ------------------------------------------------------------ step flow --- */
  function onFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setState((s) => ({
          ...s,
          file,
          rows: results.data,
          headers: results.meta.fields ?? [],
          mapping: {},
          prefillSource: null,
          resolutions: {},
        }));
      },
      error: () => toast("Could not parse that file. Is it a valid CSV?", "error"),
    });
  }

  function enterMappingStep() {
    setState((s) => {
      if (s.prefillSource !== null) return { ...s, step: "mapping" };
      const { mapping, source } = prefillMapping(s.headers, mappingsQ.data ?? []);
      return {
        ...s,
        step: "mapping",
        mapping,
        prefillSource: source,
        saveMapping: source !== "signature",
        mappingName: s.mappingName || `${carrier?.name ?? "Carrier"} statement`,
      };
    });
  }

  function setMappingField(field: StatementField, header: string) {
    setState((s) => ({
      ...s,
      mapping: { ...s.mapping, [field]: header || undefined },
      // A different mapping reparses the file; stale row decisions are dropped.
      resolutions: {},
    }));
  }

  function resolve(rowIndex: number, resolution: Resolution | null) {
    setState((s) => {
      const next = { ...s.resolutions };
      if (resolution) next[rowIndex] = resolution;
      else delete next[rowIndex];
      return { ...s, resolutions: next };
    });
  }

  /* --------------------------------------------------------------- create --- */
  function buildLineInputs(statementId: string): StatementLineInput[] {
    return parsedLines.map((l, i) => {
      const e = effective[i];
      return {
        statement_id: statementId,
        row_index: l.rowIndex,
        raw: l.raw,
        policy_number: l.policyNumber,
        carrier_member_id: l.carrierMemberId,
        subscriber_name: l.subscriberName,
        subscriber_dob: l.subscriberDob,
        member_count: l.memberCount,
        premium_cents: l.premiumCents,
        amount_cents: l.amountCents,
        line_kind: "commission" as const,
        match_status: e.status,
        matched_policy_id: e.policyId,
        match_reason: e.reason,
      };
    });
  }

  async function create() {
    const { file } = state;
    if (!file || creating) return;
    setCreating(true);
    try {
      const stmt = await createStatement.mutateAsync({
        carrier_id: state.carrierId,
        period_month: `${state.periodInput}-01`,
        uploaded_by: profileQ.data?.id,
      });
      const path = `${stmt.id}/${Date.now()}-${file.name}`;
      await statementUpload.mutateAsync({ path, file });
      await updateStatement.mutateAsync({ id: stmt.id, patch: { storage_path: path } });
      if (state.saveMapping) {
        const mapping: Record<string, string> = {};
        for (const f of STATEMENT_FIELDS) {
          const header = state.mapping[f];
          if (header) mapping[f] = header;
        }
        await createCsvMapping.mutateAsync({
          carrier_id: state.carrierId,
          name: state.mappingName.trim() || `${carrier?.name ?? "Carrier"} statement`,
          mapping,
          header_signature: computeHeaderSignature(state.headers),
        });
      }
      await bulkInsertLines.mutateAsync(buildLineInputs(stmt.id));
      toast("Statement imported", "success");
      router.push(`/statements/${stmt.id}`);
    } catch (e) {
      toast(`Import failed: ${e instanceof Error ? e.message : "unexpected error"}`, "error");
      setCreating(false);
    }
  }

  /* ------------------------------------------------------------ rendering --- */
  const sourceReady = Boolean(state.carrierId && state.periodInput && state.rows.length > 0);
  const mappingReady = Boolean(state.mapping.amount) && parsedLines.length > 0;

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        backHref="/statements"
        backLabel="Back to Statements"
        title="Import statement"
        subtitle="Upload a carrier commission CSV, map its columns, and match its lines to policies."
      />

      <div className="border-border bg-bg rounded-[var(--radius-lg)] border p-6 shadow-[var(--shadow-card)]">
        <Stepper steps={STEPS} current={state.step} />

        <div className="mt-7">
          {state.step === "source" && (
            <div className="grid max-w-[560px] gap-4">
              <Field label="Carrier" required>
                <Select
                  value={state.carrierId}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      carrierId: e.target.value,
                      mapping: {},
                      prefillSource: null,
                      resolutions: {},
                      mappingName: "",
                    }))
                  }
                >
                  <option value="">Select a carrier…</option>
                  {carriers.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Statement period" required>
                <Input
                  type="month"
                  value={state.periodInput}
                  onChange={(e) => setState((s) => ({ ...s, periodInput: e.target.value }))}
                />
              </Field>

              {state.file ? (
                <FileCard
                  name={state.file.name}
                  meta={`${(state.file.size / 1024).toFixed(0)} KB · ${state.rows.length} rows`}
                  onRemove={() =>
                    setState((s) => ({
                      ...s,
                      file: null,
                      rows: [],
                      headers: [],
                      mapping: {},
                      prefillSource: null,
                      resolutions: {},
                    }))
                  }
                />
              ) : (
                <Dropzone
                  label="Drop the carrier statement CSV"
                  hint="Drag and drop or click to browse. CSV files only."
                  accept=".csv,text/csv"
                  onFile={onFile}
                />
              )}
            </div>
          )}

          {state.step === "mapping" && (
            <div className="grid gap-5">
              <div className="grid max-w-[920px] grid-cols-2 gap-4 md:grid-cols-3">
                {STATEMENT_FIELDS.map((field) => (
                  <Field
                    key={field}
                    label={STATEMENT_FIELD_LABELS[field]}
                    required={field === "amount"}
                  >
                    <Select
                      value={state.mapping[field] ?? ""}
                      onChange={(e) => setMappingField(field, e.target.value)}
                    >
                      <option value="">Not in this file</option>
                      {state.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
              </div>

              {parsedLines.length > 0 ? (
                <div className="border-border rounded-[var(--radius-lg)] border">
                  <div className="overflow-x-auto">
                    <Table>
                      <thead>
                        <tr>
                          <th>#</th>
                          {STATEMENT_FIELDS.map((f) => (
                            <th key={f}>{STATEMENT_FIELD_LABELS[f]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLines.slice(0, 5).map((l) => (
                          <tr key={l.rowIndex}>
                            <td className="muted">{l.rowIndex + 1}</td>
                            <td className="mono">{l.policyNumber ?? "—"}</td>
                            <td className="mono">{l.carrierMemberId ?? "—"}</td>
                            <td>{l.subscriberName ?? "—"}</td>
                            <td>{l.subscriberDob ?? "—"}</td>
                            <td className="cell-num">{l.memberCount ?? "—"}</td>
                            <td className="cell-num">
                              {l.premiumCents == null ? "—" : fmtMoneyCents(l.premiumCents / 100)}
                            </td>
                            <td className="cell-num strong">
                              {fmtMoneyCents(l.amountCents / 100)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              ) : (
                <p className="text-ink-500 m-0 text-[13px]">
                  Map the “Amount paid” column to preview the parsed rows. Rows without a parseable
                  amount (subtotals, footers) are dropped automatically.
                </p>
              )}

              <div className="grid max-w-[560px] gap-3">
                <label className="flex items-center gap-2.5 text-[13.5px]">
                  <input
                    type="checkbox"
                    checked={state.saveMapping}
                    onChange={(e) => setState((s) => ({ ...s, saveMapping: e.target.checked }))}
                  />
                  <span>Save mapping for {carrier?.name ?? "this carrier"}</span>
                </label>
                {state.saveMapping && (
                  <Field label="Mapping name">
                    <Input
                      value={state.mappingName}
                      onChange={(e) => setState((s) => ({ ...s, mappingName: e.target.value }))}
                      placeholder={`${carrier?.name ?? "Carrier"} statement`}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          {state.step === "match" && (
            <div className="grid gap-5">
              <StatGrid cols={4}>
                <StatCard label="Total rows" value={parsedLines.length} />
                <StatCard label="Auto-matched" value={counts.auto + counts.manual} />
                <StatCard label="Suggested" value={counts.suggested} />
                <StatCard label="Unmatched" value={counts.unmatched} />
              </StatGrid>

              <div className="border-border rounded-[var(--radius-lg)] border">
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Policy number</th>
                        <th>Subscriber</th>
                        <th className="text-right">Amount</th>
                        <th>Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedLines.map((l, i) => (
                        <MatchRow
                          key={l.rowIndex}
                          line={l}
                          match={effective[i]}
                          candidates={candidates}
                          policyNumber={policyNumber}
                          onResolve={(r) => resolve(l.rowIndex, r)}
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {state.step === "review" && (
            <div className="grid gap-5">
              <StatGrid cols={4}>
                <StatCard label="Lines" value={parsedLines.length} />
                <StatCard label="Matched" value={counts.auto + counts.manual} />
                <StatCard
                  label="Unmatched"
                  value={counts.unmatched + counts.suggested}
                  delta={counts.ignored > 0 ? `${counts.ignored} ignored` : undefined}
                />
                <StatCard label="Total amount" value={fmtMoneyCents(totalCents / 100)} />
              </StatGrid>

              <p className="text-ink-500 m-0 text-[13.5px]">
                Creates a draft statement for {carrier?.name ?? "the carrier"}, uploads the raw CSV
                for audit, and stages {parsedLines.length} lines. Unmatched lines can still be
                resolved on the statement page before posting; nothing hits the ledger until the
                statement is posted.
              </p>
            </div>
          )}
        </div>

        <div className="border-border mt-7 flex items-center justify-between border-t pt-5">
          <div>
            {state.step !== "source" && (
              <Btn
                variant="outline"
                icon={<ArrowLeft size={15} />}
                disabled={creating}
                onClick={() =>
                  setState((s) => {
                    const idx = STEPS.findIndex((st) => st.value === s.step);
                    return { ...s, step: STEPS[Math.max(0, idx - 1)].value };
                  })
                }
              >
                Back
              </Btn>
            )}
          </div>
          <div className="flex gap-2.5">
            {state.step === "source" && (
              <Btn
                variant="primary"
                iconRight={<ArrowRight size={15} />}
                disabled={!sourceReady}
                onClick={enterMappingStep}
              >
                Next
              </Btn>
            )}
            {state.step === "mapping" && (
              <Btn
                variant="primary"
                iconRight={<ArrowRight size={15} />}
                disabled={!mappingReady}
                onClick={() => setState((s) => ({ ...s, step: "match" }))}
              >
                Next
              </Btn>
            )}
            {state.step === "match" && (
              <Btn
                variant="primary"
                iconRight={<ArrowRight size={15} />}
                onClick={() => setState((s) => ({ ...s, step: "review" }))}
              >
                Next
              </Btn>
            )}
            {state.step === "review" && (
              <Btn
                variant="primary"
                icon={creating ? undefined : <Check size={15} />}
                disabled={creating}
                onClick={create}
              >
                {creating ? "Creating…" : "Create statement"}
              </Btn>
            )}
          </div>
        </div>
      </div>

      {state.step === "source" && state.rows.length === 0 && !state.file && (
        <p className="text-ink-500 mt-4 flex items-center gap-2 text-[12.5px]">
          <FileSpreadsheet size={14} />
          The raw CSV is retained privately for audit; only staff can access statements.
        </p>
      )}
    </div>
  );
}

function MatchRow({
  line,
  match,
  candidates,
  policyNumber,
  onResolve,
}: {
  line: ParsedStatementLine;
  match: EffectiveMatch;
  candidates: readonly MatchCandidate[];
  policyNumber: (id: string | null) => string;
  onResolve: (r: Resolution | null) => void;
}) {
  const { suggestion } = match;
  return (
    <tr>
      <td className="muted">{line.rowIndex + 1}</td>
      <td className="mono">{line.policyNumber ?? "—"}</td>
      <td>{line.subscriberName ?? "—"}</td>
      <td className="cell-num strong">{fmtMoneyCents(line.amountCents / 100)}</td>
      <td>
        <div className="flex flex-wrap items-center gap-2">
          <MatchBadge status={match.status} />
          {(match.status === "auto_matched" || match.status === "manual_matched") && (
            <span className="mono text-[12px]">{policyNumber(match.policyId)}</span>
          )}

          {match.status === "manual_matched" && (
            <Btn size="sm" variant="ghost" onClick={() => onResolve(null)}>
              Undo
            </Btn>
          )}

          {match.status === "ignored" && (
            <Btn size="sm" variant="ghost" onClick={() => onResolve(null)}>
              Unignore
            </Btn>
          )}

          {match.status === "unmatched" && suggestion && (
            <>
              <span className="text-ink-500 text-[12px]">
                Suggested: <span className="mono">{policyNumber(suggestion.policyId)}</span>
              </span>
              <Btn
                size="sm"
                variant="outline"
                onClick={() => onResolve({ type: "accept", policyId: suggestion.policyId })}
              >
                Accept
              </Btn>
            </>
          )}

          {match.status === "unmatched" && !suggestion && (
            <Select
              aria-label={`Match row ${line.rowIndex + 1} to a policy`}
              className="!w-[200px] !py-1.5 text-[12.5px]"
              value=""
              onChange={(e) => {
                if (e.target.value) onResolve({ type: "manual", policyId: e.target.value });
              }}
            >
              <option value="">Match to policy…</option>
              {candidates.map((c) => (
                <option key={c.policyId} value={c.policyId}>
                  {(c.policyNumber ?? "(no number)") +
                    ` — ${c.clientFirstName} ${c.clientLastName}`.trimEnd()}
                </option>
              ))}
            </Select>
          )}

          {match.status === "unmatched" && (
            <Btn size="sm" variant="ghost" onClick={() => onResolve({ type: "ignore" })}>
              Ignore
            </Btn>
          )}
        </div>
      </td>
    </tr>
  );
}
