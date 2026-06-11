import type { Notification, TypedSupabaseClient } from "@/lib/supabase/types";

/** How many notifications the panel feed loads at once. */
const FEED_LIMIT = 30;

/** Most-recent-first feed of the current user's notifications. */
export async function listNotifications(
  supabase: TypedSupabaseClient,
  limit: number = FEED_LIMIT,
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Count of the current user's unread notifications. */
export async function unreadCount(supabase: TypedSupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

/** Mark a single notification read. RLS limits this to the owner's rows. */
export async function markRead(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Mark every unread notification for the current user as read. */
export async function markAllRead(supabase: TypedSupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}
