import type { AgentStatus } from "@/lib/domain/enums";
import type { AgentInput, AgentUpdate } from "@/lib/domain/schemas";
import type { Agent, TablesInsert, TablesUpdate, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listAgents(supabase: TypedSupabaseClient): Promise<Agent[]> {
  const { data, error } = await supabase.from("agents").select("*").order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function listAgentsByAgency(
  supabase: TypedSupabaseClient,
  agencyId: string,
): Promise<Agent[]> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("agency_id", agencyId)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getAgent(supabase: TypedSupabaseClient, id: string): Promise<Agent> {
  const { data, error } = await supabase.from("agents").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createAgent(
  supabase: TypedSupabaseClient,
  input: AgentInput,
): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .insert(input as TablesInsert<"agents">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgent(
  supabase: TypedSupabaseClient,
  id: string,
  patch: AgentUpdate,
): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .update(patch as TablesUpdate<"agents">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAgentStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: AgentStatus,
): Promise<Agent> {
  return updateAgent(supabase, id, { status });
}

export async function deleteAgent(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("agents").delete().eq("id", id);
  if (error) throw error;
}
