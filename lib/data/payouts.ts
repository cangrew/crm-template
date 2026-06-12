import type { PayoutStatus } from "@/lib/domain/enums";
import type { PayoutStatementInput } from "@/lib/domain/schemas";
import type { PayoutStatement, TablesInsert, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listPayoutStatements(
  supabase: TypedSupabaseClient,
): Promise<PayoutStatement[]> {
  const { data, error } = await supabase
    .from("payout_statements")
    .select("*")
    .order("period_month", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPayoutStatement(
  supabase: TypedSupabaseClient,
  input: PayoutStatementInput,
): Promise<PayoutStatement> {
  const { data, error } = await supabase
    .from("payout_statements")
    .insert(input as TablesInsert<"payout_statements">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayoutStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: PayoutStatus,
): Promise<PayoutStatement> {
  const { data, error } = await supabase
    .from("payout_statements")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePayoutStatement(
  supabase: TypedSupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("payout_statements").delete().eq("id", id);
  if (error) throw error;
}
