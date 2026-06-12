import type { RateScheduleInput, RateScheduleUpdate } from "@/lib/domain/schemas";
import type {
  RateSchedule,
  TablesInsert,
  TablesUpdate,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

export async function listRateSchedulesByCarrier(
  supabase: TypedSupabaseClient,
  carrierId: string,
): Promise<RateSchedule[]> {
  const { data, error } = await supabase
    .from("rate_schedules")
    .select("*")
    .eq("carrier_id", carrierId)
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRateSchedule(
  supabase: TypedSupabaseClient,
  input: RateScheduleInput,
): Promise<RateSchedule> {
  const { data, error } = await supabase
    .from("rate_schedules")
    .insert(input as TablesInsert<"rate_schedules">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRateSchedule(
  supabase: TypedSupabaseClient,
  id: string,
  patch: RateScheduleUpdate,
): Promise<RateSchedule> {
  const { data, error } = await supabase
    .from("rate_schedules")
    .update(patch as TablesUpdate<"rate_schedules">)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRateSchedule(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("rate_schedules").delete().eq("id", id);
  if (error) throw error;
}
