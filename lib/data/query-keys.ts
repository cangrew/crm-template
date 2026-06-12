/**
 * Centralized TanStack Query key factory. Keeps cache keys consistent between
 * queries and the mutations that invalidate them. Add a key family here for
 * every new entity (see `clients` for the canonical shape).
 */
export const queryKeys = {
  agencies: {
    all: ["agencies"] as const,
    lists: () => ["agencies", "list"] as const,
    detail: (id: string) => ["agencies", "detail", id] as const,
  },
  agents: {
    all: ["agents"] as const,
    lists: () => ["agents", "list"] as const,
    detail: (id: string) => ["agents", "detail", id] as const,
    byAgency: (agencyId: string) => ["agents", "byAgency", agencyId] as const,
  },
  clients: {
    all: ["clients"] as const,
    lists: () => ["clients", "list"] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
    byAgent: (agentId: string) => ["clients", "byAgent", agentId] as const,
  },
  documents: {
    all: ["documents"] as const,
    byClient: (clientId: string) => ["documents", "byClient", clientId] as const,
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
