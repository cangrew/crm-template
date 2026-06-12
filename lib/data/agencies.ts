import type { AgencyStatus } from "@/lib/domain/enums";
import type { AgencyInput, AgencyUpdate } from "@/lib/domain/schemas";
import type { Agency, TablesInsert, TablesUpdate, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listAgencies(supabase: TypedSupabaseClient): Promise<Agency[]> {
  const { data, error } = await supabase.from("agencies").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getAgency(supabase: TypedSupabaseClient, id: string): Promise<Agency> {
  const { data, error } = await supabase.from("agencies").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createAgency(
  supabase: TypedSupabaseClient,
  input: AgencyInput,
): Promise<Agency> {
  const { data, error } = await supabase
    .from("agencies")
    .insert(input as TablesInsert<"agencies">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgency(
  supabase: TypedSupabaseClient,
  id: string,
  patch: AgencyUpdate,
): Promise<Agency> {
  const { data, error } = await supabase
    .from("agencies")
    .update(patch as TablesUpdate<"agencies">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgencyStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: AgencyStatus,
): Promise<Agency> {
  return updateAgency(supabase, id, { status });
}

export async function deleteAgency(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("agencies").delete().eq("id", id);
  if (error) throw error;
}
