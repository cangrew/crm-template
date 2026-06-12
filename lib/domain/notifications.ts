/**
 * Notification domain metadata. Mirrors the Postgres `notification_type` and
 * `notification_priority` enums (see migration 0002_notifications.sql) and the
 * role routing baked into the `public.notify_roles` trigger helper. The SQL
 * trigger is the source of truth for the stored title/body text; this module
 * owns the type list, display labels, role audience, priority, and the routing
 * used by the preferences UI and the notification panel.
 *
 * The shipped types are wired to the contacts EXAMPLE ENTITY so the pipeline
 * is demonstrably end-to-end. When you replace the example with real domains,
 * rename these types here and in the SQL enum before your first deploy.
 */
import type { AppRole } from "./enums";

export const NOTIFICATION_TYPES = ["contact_created", "contact_at_risk", "contact_closed"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["normal", "high"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export type NotificationEntityType = "contact";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  contact_created: "New contact added",
  contact_at_risk: "Contact at risk",
  contact_closed: "Contact closed",
};

/**
 * Which roles receive each notification type. Kept in sync with the role checks
 * inside `public.notify_roles(...)` in the migration. The acting user who
 * triggered the change is excluded at insert time by the SQL helper.
 */
const NOTIFICATION_AUDIENCE: Record<NotificationType, readonly AppRole[]> = {
  contact_created: ["admin", "manager", "agent", "agency_owner"],
  contact_at_risk: ["admin", "manager"],
  contact_closed: ["admin"],
};

const NOTIFICATION_PRIORITY: Record<NotificationType, NotificationPriority> = {
  contact_created: "normal",
  contact_at_risk: "high",
  contact_closed: "normal",
};

const NOTIFICATION_ENTITY: Record<NotificationType, NotificationEntityType> = {
  contact_created: "contact",
  contact_at_risk: "contact",
  contact_closed: "contact",
};

const ENTITY_ROUTES: Record<NotificationEntityType, string> = {
  contact: "/contacts",
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
