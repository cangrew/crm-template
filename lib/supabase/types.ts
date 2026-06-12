import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Agency = Tables<"agencies">;
export type Agent = Tables<"agents">;
export type Client = Tables<"clients">;
export type Carrier = Tables<"carriers">;
export type RateSchedule = Tables<"rate_schedules">;
export type CarrierCsvMapping = Tables<"carrier_csv_mappings">;
export type Policy = Tables<"policies">;
export type DocumentRow = Tables<"documents">;
export type CommissionStatement = Tables<"commission_statements">;
export type StatementLine = Tables<"statement_lines">;
export type LedgerEntry = Tables<"ledger_entries">;
export type PayoutStatement = Tables<"payout_statements">;
export type Notification = Tables<"notifications">;
export type NotificationPreference = Tables<"notification_preferences">;
