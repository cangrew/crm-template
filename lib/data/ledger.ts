import type { LedgerEntry, TypedSupabaseClient } from "@/lib/supabase/types";

/* The ledger is append-only: this module is read-only by design. Writes
 * happen exclusively inside the post_statement / void_statement RPCs (see
 * lib/data/statements.ts). */

export async function listLedgerByAgent(
  supabase: TypedSupabaseClient,
  agentId: string,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLedgerByAgency(
  supabase: TypedSupabaseClient,
  agencyId: string,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLedgerByPolicy(
  supabase: TypedSupabaseClient,
  policyId: string,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLedgerByPeriod(
  supabase: TypedSupabaseClient,
  periodMonth: string,
): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("period_month", periodMonth)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
