import type { CarrierStatus } from "@/lib/domain/enums";
import type { CarrierInput, CarrierUpdate } from "@/lib/domain/schemas";
import type {
  Carrier,
  TablesInsert,
  TablesUpdate,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

export async function listCarriers(supabase: TypedSupabaseClient): Promise<Carrier[]> {
  const { data, error } = await supabase.from("carriers").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCarrier(supabase: TypedSupabaseClient, id: string): Promise<Carrier> {
  const { data, error } = await supabase.from("carriers").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createCarrier(
  supabase: TypedSupabaseClient,
  input: CarrierInput,
): Promise<Carrier> {
  const { data, error } = await supabase
    .from("carriers")
    .insert(input as TablesInsert<"carriers">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCarrier(
  supabase: TypedSupabaseClient,
  id: string,
  patch: CarrierUpdate,
): Promise<Carrier> {
  const { data, error } = await supabase
    .from("carriers")
    .update(patch as TablesUpdate<"carriers">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCarrierStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: CarrierStatus,
): Promise<Carrier> {
  return updateCarrier(supabase, id, { status });
}

export async function deleteCarrier(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("carriers").delete().eq("id", id);
  if (error) throw error;
}
