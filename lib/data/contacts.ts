/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * Canonical data-layer module shape: pure async functions over the typed
 * Supabase client, one file per entity, consumed only via lib/data/hooks.ts. */
import type { ContactStatus } from "@/lib/domain/enums";
import type { ContactInput, ContactUpdate } from "@/lib/domain/schemas";
import type {
  Contact,
  TablesInsert,
  TablesUpdate,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

export async function listContacts(supabase: TypedSupabaseClient): Promise<Contact[]> {
  const { data, error } = await supabase.from("contacts").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getContact(supabase: TypedSupabaseClient, id: string): Promise<Contact> {
  const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createContact(
  supabase: TypedSupabaseClient,
  input: ContactInput,
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert(input as TablesInsert<"contacts">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContact(
  supabase: TypedSupabaseClient,
  id: string,
  patch: ContactUpdate,
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update(patch as TablesUpdate<"contacts">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContactStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: ContactStatus,
): Promise<Contact> {
  return updateContact(supabase, id, { status });
}

export async function deleteContact(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}
