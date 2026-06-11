/**
 * Centralized TanStack Query key factory. Keeps cache keys consistent between
 * queries and the mutations that invalidate them. Add a key family here for
 * every new entity (see `contacts` for the canonical shape).
 */
export const queryKeys = {
  contacts: {
    all: ["contacts"] as const,
    lists: () => ["contacts", "list"] as const,
    detail: (id: string) => ["contacts", "detail", id] as const,
  },
  documents: {
    all: ["documents"] as const,
    byContact: (contactId: string) => ["documents", "byContact", contactId] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    lists: () => ["profiles", "list"] as const,
    detail: (id: string) => ["profiles", "detail", id] as const,
    current: () => ["profiles", "current"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    lists: () => ["notifications", "list"] as const,
    unreadCount: () => ["notifications", "unreadCount"] as const,
  },
  notificationPreferences: {
    all: ["notificationPreferences"] as const,
    lists: () => ["notificationPreferences", "list"] as const,
  },
} as const;
