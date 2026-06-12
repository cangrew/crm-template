import type { StatementInput, StatementLineInput } from "@/lib/domain/schemas";
import type { Json } from "@/lib/supabase/database.types";
import type {
  CommissionStatement,
  StatementLine,
  TablesInsert,
  TablesUpdate,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

/** Raw-CSV audit copies live in this private, staff-only bucket. */
export const STATEMENTS_BUCKET = "statements";

/** Chunk size for bulk line inserts (statements run to thousands of rows). */
const LINE_INSERT_CHUNK = 500;

/**
 * One ledger row in post_statement's wire format — the engine's
 * LedgerEntryDraft (lib/domain/commission-engine.ts) flattened to the RPC's
 * snake_case contract plus its line/policy/period context.
 */
export interface LedgerEntryWire {
  statement_line_id: string;
  policy_id: string;
  entry_kind: string;
  payee_type: string;
  agent_id: string | null;
  agency_id: string | null;
  amount_cents: number;
  applied_bps: number | null;
  period_month: string;
}

export async function listStatements(
  supabase: TypedSupabaseClient,
): Promise<CommissionStatement[]> {
  const { data, error } = await supabase
    .from("commission_statements")
    .select("*")
    .order("period_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getStatement(
  supabase: TypedSupabaseClient,
  id: string,
): Promise<CommissionStatement> {
  const { data, error } = await supabase
    .from("commission_statements")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createStatement(
  supabase: TypedSupabaseClient,
  input: StatementInput,
): Promise<CommissionStatement> {
  const { data, error } = await supabase
    .from("commission_statements")
    .insert(input as TablesInsert<"commission_statements">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStatement(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("commission_statements").delete().eq("id", id);
  if (error) throw error;
}

export async function listStatementLines(
  supabase: TypedSupabaseClient,
  statementId: string,
): Promise<StatementLine[]> {
  const { data, error } = await supabase
    .from("statement_lines")
    .select("*")
    .eq("statement_id", statementId)
    .order("row_index");
  if (error) throw error;
  return data ?? [];
}

/** Insert parsed lines in chunks so multi-thousand-row statements fit. */
export async function bulkInsertLines(
  supabase: TypedSupabaseClient,
  lines: StatementLineInput[],
): Promise<void> {
  for (let i = 0; i < lines.length; i += LINE_INSERT_CHUNK) {
    const chunk = lines.slice(i, i + LINE_INSERT_CHUNK);
    const { error } = await supabase
      .from("statement_lines")
      .insert(chunk as TablesInsert<"statement_lines">[]);
    if (error) throw error;
  }
}

export async function setLineMatch(
  supabase: TypedSupabaseClient,
  lineId: string,
  patch: Pick<
    TablesUpdate<"statement_lines">,
    "match_status" | "matched_policy_id" | "match_reason"
  >,
): Promise<StatementLine> {
  const { data, error } = await supabase
    .from("statement_lines")
    .update(patch)
    .eq("id", lineId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Atomically persist the engine's allocations via the post_statement RPC. */
export async function postStatement(
  supabase: TypedSupabaseClient,
  statementId: string,
  entries: LedgerEntryWire[],
): Promise<void> {
  const { error } = await supabase.rpc("post_statement", {
    p_statement_id: statementId,
    p_entries: entries as unknown as Json,
  });
  if (error) throw error;
}

/** Admin-only reversal: inserts exact negations and marks the statement void. */
export async function voidStatement(
  supabase: TypedSupabaseClient,
  statementId: string,
): Promise<void> {
  const { error } = await supabase.rpc("void_statement", { p_statement_id: statementId });
  if (error) throw error;
}

/** Signed upload URL for the raw-CSV audit copy (staff-only bucket). */
export async function createStatementUploadUrl(
  supabase: TypedSupabaseClient,
  path: string,
): Promise<{ token: string }> {
  const { data, error } = await supabase.storage
    .from(STATEMENTS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw error;
  return { token: data.token };
}
