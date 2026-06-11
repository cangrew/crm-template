import type { NotificationType } from "@/lib/domain/notifications";
import type {
  NotificationPreference,
  TablesInsert,
  TypedSupabaseClient,
} from "@/lib/supabase/types";

/** The current user's notification preferences (RLS scopes to their rows). */
export async function listPreferences(
  supabase: TypedSupabaseClient,
): Promise<NotificationPreference[]> {
  const { data, error } = await supabase.from("notification_preferences").select("*").order("type");
  if (error) throw error;
  return data ?? [];
}

/** Mute or unmute a notification type for a user (upsert on user_id + type). */
export async function setPreference(
  supabase: TypedSupabaseClient,
  userId: string,
  type: NotificationType,
  muted: boolean,
): Promise<void> {
  const row: TablesInsert<"notification_preferences"> = {
    user_id: userId,
    type,
    muted,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id,type" });
  if (error) throw error;
}
