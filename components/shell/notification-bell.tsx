"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/lib/data/hooks";
import { useNotificationsRealtime } from "@/lib/data/use-notifications-realtime";
import { type NotificationEntityType, notificationHref } from "@/lib/domain/notifications";
import type { Notification } from "@/lib/supabase/types";
import { NotificationPanel } from "./notification-panel";

const MAX_BADGE = 9;

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useNotificationsRealtime(userId);
  const unreadQ = useUnreadCount();
  const listQ = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleItemClick = useCallback(
    (n: Notification) => {
      if (n.read_at === null) markRead.mutate(n.id);
      router.push(notificationHref(n.entity_type as NotificationEntityType, n.entity_id));
      setOpen(false);
    },
    [markRead, router],
  );

  const unread = unreadQ.data ?? 0;
  const badgeLabel = unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="icon-btn"
        title="Notifications"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell size={19} />
        {unread > 0 && <span className="ntf-badge">{badgeLabel}</span>}
      </button>

      {open && (
        <NotificationPanel
          items={listQ.data ?? []}
          isLoading={listQ.isLoading}
          isError={listQ.isError}
          onRetry={() => listQ.refetch()}
          onItemClick={handleItemClick}
          onMarkAll={() => markAll.mutate()}
        />
      )}
    </div>
  );
}
