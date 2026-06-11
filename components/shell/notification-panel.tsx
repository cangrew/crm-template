"use client";

import clsx from "clsx";
import { CheckCheck } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { fmtRelativeTime } from "@/lib/design/format";
import type { Notification } from "@/lib/supabase/types";

type Props = {
  items: Notification[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onItemClick: (notification: Notification) => void;
  onMarkAll: () => void;
};

const SKELETON_ROWS = 4;

/**
 * Presentational notification list. State (data fetching, mark-read, routing)
 * is owned by NotificationBell so this stays easy to render and test.
 */
export function NotificationPanel({
  items,
  isLoading = false,
  isError = false,
  onRetry,
  onItemClick,
  onMarkAll,
}: Props) {
  const hasUnread = items.some((n) => n.read_at === null);

  return (
    <div className="ntf-panel" role="menu" aria-label="Notifications">
      <div className="ntf-head">
        <span className="ntf-head-title">Notifications</span>
        <button type="button" className="ntf-markall" onClick={onMarkAll} disabled={!hasUnread}>
          <CheckCheck size={14} />
          Mark all read
        </button>
      </div>

      <div className="ntf-body">
        {isLoading ? (
          <div className="ntf-skeleton" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <div key={i} className="ntf-skel-row">
                <div className="skel h-3 w-[70%]" />
                <div className="skel mt-1.5 h-2.5 w-[90%]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Couldn't load notifications"
            body="Please try again."
            onRetry={onRetry}
          />
        ) : items.length === 0 ? (
          <EmptyState title="No notifications" body="You're all caught up." />
        ) : (
          <ul className="ntf-list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={clsx("ntf-item", n.read_at === null && "unread")}
                  onClick={() => onItemClick(n)}
                  role="menuitem"
                >
                  <span
                    className={`ntf-dot ${n.priority === "high" ? "high" : "normal"}`}
                    aria-hidden="true"
                  />
                  <span className="ntf-item-main">
                    <span className="ntf-title">{n.title}</span>
                    {n.body && <span className="ntf-body-text">{n.body}</span>}
                    <span className="ntf-time">{fmtRelativeTime(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
