import type { PolicyStatus } from "@/lib/domain/enums";
import type { PolicyInput, PolicyUpdate } from "@/lib/domain/schemas";
import type { Policy, TablesInsert, TablesUpdate, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listPolicies(supabase: TypedSupabaseClient): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPolicy(supabase: TypedSupabaseClient, id: string): Promise<Policy> {
  const { data, error } = await supabase.from("policies").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listPoliciesByClient(
  supabase: TypedSupabaseClient,
  clientId: string,
): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPoliciesByAgent(
  supabase: TypedSupabaseClient,
  agentId: string,
): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPolicy(
  supabase: TypedSupabaseClient,
  input: PolicyInput,
): Promise<Policy> {
  const { data, error } = await supabase
    .from("policies")
    .insert(input as TablesInsert<"policies">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePolicy(
  supabase: TypedSupabaseClient,
  id: string,
  patch: PolicyUpdate,
): Promise<Policy> {
  const { data, error } = await supabase
    .from("policies")
    .update(patch as TablesUpdate<"policies">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePolicyStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: PolicyStatus,
): Promise<Policy> {
  return updatePolicy(supabase, id, { status });
}

export async function deletePolicy(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("policies").delete().eq("id", id);
  if (error) throw error;
}
