import type { ProfileUpdate } from "@/lib/domain/schemas";
import type { Profile, TablesUpdate, TypedSupabaseClient } from "@/lib/supabase/types";

export async function listProfiles(supabase: TypedSupabaseClient): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function getProfile(supabase: TypedSupabaseClient, id: string): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

/** The profile for the currently authenticated user, or null if none. */
export async function getCurrentProfile(supabase: TypedSupabaseClient): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  supabase: TypedSupabaseClient,
  id: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch as TablesUpdate<"profiles">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
