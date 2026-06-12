import type { CsvMappingInput, CsvMappingUpdate } from "@/lib/domain/schemas";
import type {
  CarrierCsvMapping,
  TablesInsert,
  TablesUpdate,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

export async function listCsvMappingsByCarrier(
  supabase: TypedSupabaseClient,
  carrierId: string,
): Promise<CarrierCsvMapping[]> {
  const { data, error } = await supabase
    .from("carrier_csv_mappings")
    .select("*")
    .eq("carrier_id", carrierId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCsvMapping(
  supabase: TypedSupabaseClient,
  input: CsvMappingInput,
): Promise<CarrierCsvMapping> {
  const { data, error } = await supabase
    .from("carrier_csv_mappings")
    .insert(input as TablesInsert<"carrier_csv_mappings">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCsvMapping(
  supabase: TypedSupabaseClient,
  id: string,
  patch: CsvMappingUpdate,
): Promise<CarrierCsvMapping> {
  const { data, error } = await supabase
    .from("carrier_csv_mappings")
    .update(patch as TablesUpdate<"carrier_csv_mappings">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCsvMapping(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("carrier_csv_mappings").delete().eq("id", id);
  if (error) throw error;
}
