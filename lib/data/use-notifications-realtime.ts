"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./query-keys";

/**
 * Subscribe to realtime inserts on the current user's notifications and refresh
 * the notification queries when one arrives. RLS already scopes the rows to the
 * user; the explicit user_id filter avoids waking the client for others' rows.
 * The 60s refetchInterval on the queries is the backstop if the socket drops.
 */
export function useNotificationsRealtime(userId: string | null | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
