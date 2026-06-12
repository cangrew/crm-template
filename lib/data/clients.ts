import type { ClientStatus } from "@/lib/domain/enums";
import type { ClientInput, ClientUpdate } from "@/lib/domain/schemas";
import type { Client, TablesInsert, TablesUpdate, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listClients(supabase: TypedSupabaseClient): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*").order("last_name");
  if (error) throw error;
  return data ?? [];
}

export async function listClientsByAgent(
  supabase: TypedSupabaseClient,
  agentId: string,
): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("agent_id", agentId)
    .order("last_name");
  if (error) throw error;
  return data ?? [];
}

export async function getClient(supabase: TypedSupabaseClient, id: string): Promise<Client> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createClient(
  supabase: TypedSupabaseClient,
  input: ClientInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(input as TablesInsert<"clients">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  supabase: TypedSupabaseClient,
  id: string,
  patch: ClientUpdate,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(patch as TablesUpdate<"clients">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClientStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: ClientStatus,
): Promise<Client> {
  return updateClient(supabase, id, { status });
}

export async function deleteClient(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
