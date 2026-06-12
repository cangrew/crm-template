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
  carriers: {
    all: ["carriers"] as const,
    lists: () => ["carriers", "list"] as const,
    detail: (id: string) => ["carriers", "detail", id] as const,
  },
  clients: {
    all: ["clients"] as const,
    lists: () => ["clients", "list"] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
    byAgent: (agentId: string) => ["clients", "byAgent", agentId] as const,
  },
  csvMappings: {
    all: ["csvMappings"] as const,
    byCarrier: (carrierId: string) => ["csvMappings", "byCarrier", carrierId] as const,
  },
  policies: {
    all: ["policies"] as const,
    lists: () => ["policies", "list"] as const,
    detail: (id: string) => ["policies", "detail", id] as const,
    byClient: (clientId: string) => ["policies", "byClient", clientId] as const,
    byAgent: (agentId: string) => ["policies", "byAgent", agentId] as const,
  },
  rateSchedules: {
    all: ["rateSchedules"] as const,
    byCarrier: (carrierId: string) => ["rateSchedules", "byCarrier", carrierId] as const,
  },
  statements: {
    all: ["statements"] as const,
    lists: () => ["statements", "list"] as const,
    detail: (id: string) => ["statements", "detail", id] as const,
    lines: (statementId: string) => ["statements", "lines", statementId] as const,
  },
  ledger: {
    all: ["ledger"] as const,
    byAgent: (agentId: string) => ["ledger", "byAgent", agentId] as const,
    byAgency: (agencyId: string) => ["ledger", "byAgency", agencyId] as const,
    byPolicy: (policyId: string) => ["ledger", "byPolicy", policyId] as const,
    byPeriod: (periodMonth: string) => ["ledger", "byPeriod", periodMonth] as const,
  },
  payouts: {
    all: ["payouts"] as const,
    lists: () => ["payouts", "list"] as const,
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
