/**
 * Notification domain metadata. Mirrors the Postgres `notification_type` and
 * `notification_priority` enums (see migration 0002_notifications.sql) and the
 * role routing baked into the `public.notify_roles` trigger helper. The SQL
 * trigger is the source of truth for the stored title/body text; this module
 * owns the type list, display labels, role audience, priority, and the routing
 * used by the preferences UI and the notification panel.
 *
 * Several types belong to upcoming modules (policies, statements, payouts);
 * they are defined now because enum values are append-only after the first
 * deploy.
 */
import type { AppRole } from "./enums";

export const NOTIFICATION_TYPES = [
  "client_created",
  "policy_lapsed",
  "statement_posted",
  "lines_unmatched",
  "payout_finalized",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["normal", "high"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationEntityType = "client" | "policy" | "statement" | "payout";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  client_created: "New client added",
  policy_lapsed: "Policy lapsed",
  statement_posted: "Statement posted",
  lines_unmatched: "Unmatched statement lines",
  payout_finalized: "Payout finalized",
};

/**
 * Which roles receive each notification type. Kept in sync with the role lists
 * the entity triggers pass to `public.notify_roles(...)`. Staff-only for most
 * types: fan-out is by role, so a tenant-facing type would leak other books'
 * data. payout_finalized is the exception — payouts are per-recipient. The
 * acting user who triggered the change is excluded at insert time by the SQL
 * helper.
 */
const NOTIFICATION_AUDIENCE: Record<NotificationType, readonly AppRole[]> = {
  client_created: ["admin", "manager"],
  policy_lapsed: ["admin", "manager"],
  statement_posted: ["admin", "manager"],
  lines_unmatched: ["admin", "manager"],
  payout_finalized: ["admin", "manager", "agent", "agency_owner"],
};

const NOTIFICATION_PRIORITY: Record<NotificationType, NotificationPriority> = {
  client_created: "normal",
  policy_lapsed: "high",
  statement_posted: "normal",
  lines_unmatched: "high",
  payout_finalized: "normal",
};

const NOTIFICATION_ENTITY: Record<NotificationType, NotificationEntityType> = {
  client_created: "client",
  policy_lapsed: "policy",
  statement_posted: "statement",
  lines_unmatched: "statement",
  payout_finalized: "payout",
};

const ENTITY_ROUTES: Record<NotificationEntityType, string> = {
  client: "/clients",
  policy: "/policies",
  statement: "/statements",
  payout: "/payouts",
};

export function notificationAudience(type: NotificationType): readonly AppRole[] {
  return NOTIFICATION_AUDIENCE[type];
}

export function notificationPriority(type: NotificationType): NotificationPriority {
  return NOTIFICATION_PRIORITY[type];
}

export function notificationEntityType(type: NotificationType): NotificationEntityType {
  return NOTIFICATION_ENTITY[type];
}

/** Build the in-app link to the entity a notification refers to. */
export function notificationHref(entityType: NotificationEntityType, entityId: string): string {
  return `${ENTITY_ROUTES[entityType]}/${entityId}`;
}

/** Notification types a given role can receive, for the preferences UI. */
export function typesForRole(role: AppRole): NotificationType[] {
  return NOTIFICATION_TYPES.filter((type) => NOTIFICATION_AUDIENCE[type].includes(role));
}
