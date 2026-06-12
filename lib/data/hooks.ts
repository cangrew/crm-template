"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AgencyStatus,
  AgentStatus,
  CarrierStatus,
  ClientStatus,
  PayoutStatus,
  PolicyStatus,
} from "@/lib/domain/enums";
import type { NotificationType } from "@/lib/domain/notifications";
import type {
  AgencyInput,
  AgencyUpdate,
  AgentInput,
  AgentUpdate,
  CarrierInput,
  CarrierUpdate,
  ClientInput,
  ClientUpdate,
  CsvMappingInput,
  CsvMappingUpdate,
  DocumentInput,
  PayoutStatementInput,
  PolicyInput,
  PolicyUpdate,
  ProfileUpdate,
  RateScheduleInput,
  RateScheduleUpdate,
  StatementInput,
  StatementLineInput,
} from "@/lib/domain/schemas";
import { createClient } from "@/lib/supabase/client";
import * as agenciesApi from "./agencies";
import * as agentsApi from "./agents";
import * as ledgerApi from "./ledger";
import * as payoutsApi from "./payouts";
import * as statementsApi from "./statements";
import * as carriersApi from "./carriers";
import * as clientsApi from "./clients";
import * as csvMappingsApi from "./csv-mappings";
import * as documentsApi from "./documents";
import * as notificationPreferencesApi from "./notification-preferences";
import * as notificationsApi from "./notifications";
import * as policiesApi from "./policies";
import * as profilesApi from "./profiles";
import * as rateSchedulesApi from "./rate-schedules";
import { queryKeys } from "./query-keys";

/* ------------------------------------------------------------- agencies --- */
export function useAgencies() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.agencies.lists(),
    queryFn: () => agenciesApi.listAgencies(supabase),
  });
}

export function useAgency(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.agencies.detail(id),
    queryFn: () => agenciesApi.getAgency(supabase, id),
    enabled: Boolean(id),
  });
}

export function useCreateAgency() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgencyInput) => agenciesApi.createAgency(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agencies.all }),
  });
}

export function useUpdateAgency() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AgencyUpdate }) =>
      agenciesApi.updateAgency(supabase, id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.agencies.all });
      // Cut changes alter how agents' future commissions split.
      qc.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
  });
}

export function useUpdateAgencyStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgencyStatus }) =>
      agenciesApi.updateAgencyStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agencies.all }),
  });
}

export function useDeleteAgency() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agenciesApi.deleteAgency(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agencies.all }),
  });
}

/* --------------------------------------------------------------- agents --- */
export function useAgents() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.agents.lists(),
    queryFn: () => agentsApi.listAgents(supabase),
  });
}

export function useAgent(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.agents.detail(id),
    queryFn: () => agentsApi.getAgent(supabase, id),
    enabled: Boolean(id),
  });
}

export function useAgentsByAgency(agencyId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.agents.byAgency(agencyId),
    queryFn: () => agentsApi.listAgentsByAgency(supabase, agencyId),
    enabled: Boolean(agencyId),
  });
}

export function useCreateAgent() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentInput) => agentsApi.createAgent(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

export function useUpdateAgent() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AgentUpdate }) =>
      agentsApi.updateAgent(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

export function useUpdateAgentStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      agentsApi.updateAgentStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

export function useDeleteAgent() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => agentsApi.deleteAgent(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

/* -------------------------------------------------------------- clients --- */
/* One section per entity: list/detail queries plus mutations that invalidate
 * the entity's whole key family (lists, details, and dashboards refresh
 * together — that breadth is intentional). */
export function useClients() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.clients.lists(),
    queryFn: () => clientsApi.listClients(supabase),
  });
}

export function useClient(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => clientsApi.getClient(supabase, id),
    enabled: Boolean(id),
  });
}

export function useClientsByAgent(agentId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.clients.byAgent(agentId),
    queryFn: () => clientsApi.listClientsByAgent(supabase, agentId),
    enabled: Boolean(agentId),
  });
}

export function useCreateClient() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) => clientsApi.createClient(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useUpdateClient() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ClientUpdate }) =>
      clientsApi.updateClient(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useUpdateClientStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClientStatus }) =>
      clientsApi.updateClientStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

export function useDeleteClient() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.clients.all }),
  });
}

/* -------------------------------------------------------------- carriers --- */
export function useCarriers() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.carriers.lists(),
    queryFn: () => carriersApi.listCarriers(supabase),
  });
}

export function useCarrier(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.carriers.detail(id),
    queryFn: () => carriersApi.getCarrier(supabase, id),
    enabled: Boolean(id),
  });
}

export function useCreateCarrier() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CarrierInput) => carriersApi.createCarrier(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.carriers.all }),
  });
}

export function useUpdateCarrier() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CarrierUpdate }) =>
      carriersApi.updateCarrier(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.carriers.all }),
  });
}

export function useUpdateCarrierStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CarrierStatus }) =>
      carriersApi.updateCarrierStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.carriers.all }),
  });
}

export function useDeleteCarrier() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carriersApi.deleteCarrier(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.carriers.all }),
  });
}

/* -------------------------------------------------------- rate schedules --- */
/* Rate-schedule and csv-mapping mutations also invalidate the carriers family:
 * carrier detail pages compose both, so they refresh as one. */
export function useRateSchedulesByCarrier(carrierId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.rateSchedules.byCarrier(carrierId),
    queryFn: () => rateSchedulesApi.listRateSchedulesByCarrier(supabase, carrierId),
    enabled: Boolean(carrierId),
  });
}

export function useCreateRateSchedule() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RateScheduleInput) => rateSchedulesApi.createRateSchedule(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rateSchedules.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

export function useUpdateRateSchedule() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RateScheduleUpdate }) =>
      rateSchedulesApi.updateRateSchedule(supabase, id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rateSchedules.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

export function useDeleteRateSchedule() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rateSchedulesApi.deleteRateSchedule(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rateSchedules.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

/* ----------------------------------------------------------- csv mappings -- */
export function useCsvMappingsByCarrier(carrierId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.csvMappings.byCarrier(carrierId),
    queryFn: () => csvMappingsApi.listCsvMappingsByCarrier(supabase, carrierId),
    enabled: Boolean(carrierId),
  });
}

export function useCreateCsvMapping() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CsvMappingInput) => csvMappingsApi.createCsvMapping(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.csvMappings.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

export function useUpdateCsvMapping() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CsvMappingUpdate }) =>
      csvMappingsApi.updateCsvMapping(supabase, id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.csvMappings.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

export function useDeleteCsvMapping() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => csvMappingsApi.deleteCsvMapping(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.csvMappings.all });
      qc.invalidateQueries({ queryKey: queryKeys.carriers.all });
    },
  });
}

/* -------------------------------------------------------------- policies --- */
export function usePolicies() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.policies.lists(),
    queryFn: () => policiesApi.listPolicies(supabase),
  });
}

export function usePolicy(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.policies.detail(id),
    queryFn: () => policiesApi.getPolicy(supabase, id),
    enabled: Boolean(id),
  });
}

export function usePoliciesByClient(clientId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.policies.byClient(clientId),
    queryFn: () => policiesApi.listPoliciesByClient(supabase, clientId),
    enabled: Boolean(clientId),
  });
}

export function usePoliciesByAgent(agentId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.policies.byAgent(agentId),
    queryFn: () => policiesApi.listPoliciesByAgent(supabase, agentId),
    enabled: Boolean(agentId),
  });
}

export function useCreatePolicy() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PolicyInput) => policiesApi.createPolicy(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.policies.all }),
  });
}

export function useUpdatePolicy() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PolicyUpdate }) =>
      policiesApi.updatePolicy(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.policies.all }),
  });
}

export function useUpdatePolicyStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PolicyStatus }) =>
      policiesApi.updatePolicyStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.policies.all }),
  });
}

export function useDeletePolicy() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policiesApi.deletePolicy(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.policies.all }),
  });
}

/* ------------------------------------------------------------- documents -- */
export function useDocuments() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: () => documentsApi.listDocuments(supabase),
  });
}

export function useDocumentsByClient(clientId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.documents.byClient(clientId),
    queryFn: () => documentsApi.listDocumentsByClient(supabase, clientId),
    enabled: Boolean(clientId),
  });
}

export function useCreateDocument() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocumentInput) => documentsApi.createDocument(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  });
}

export function useDeleteDocument() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents.all }),
  });
}

/**
 * Uploads a file to the private documents bucket via a short-lived signed
 * upload URL minted from the data layer, keeping the object write off the
 * public path.
 */
export function useSignedUpload() {
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ path, file }: { path: string; file: File }) => {
      const { token } = await documentsApi.createSignedUploadUrl(supabase, path);
      const { error } = await supabase.storage
        .from(documentsApi.DOCUMENTS_BUCKET)
        .uploadToSignedUrl(path, token, file);
      if (error) throw error;
      return { path };
    },
  });
}

/**
 * Resolves a short-lived signed download URL for a stored document. The URL is
 * minted server-side (after an authz re-check) by the documents download route.
 */
export function useSignedDownload() {
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const res = await fetch(`/api/documents/${id}/download`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Could not generate a download link.");
      }
      const { url } = (await res.json()) as { url: string };
      return url;
    },
  });
}

/* -------------------------------------------------------------- profiles -- */
export function useProfiles() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.profiles.lists(),
    queryFn: () => profilesApi.listProfiles(supabase),
  });
}

export function useProfile(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.profiles.detail(id),
    queryFn: () => profilesApi.getProfile(supabase, id),
    enabled: Boolean(id),
  });
}

export function useCurrentProfile() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.profiles.current(),
    queryFn: () => profilesApi.getCurrentProfile(supabase),
  });
}

export function useUpdateProfile() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProfileUpdate }) =>
      profilesApi.updateProfile(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles.all }),
  });
}

/* -------------------------------------------------------- notifications */
// Realtime pushes drive instant updates; the interval is a backstop in case the
// socket drops (see useNotificationsRealtime).
const NOTIFICATION_POLL_MS = 60_000;

export function useNotifications() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.notifications.lists(),
    queryFn: () => notificationsApi.listNotifications(supabase),
    refetchInterval: NOTIFICATION_POLL_MS,
  });
}

export function useUnreadCount() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(supabase),
    refetchInterval: NOTIFICATION_POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(supabase),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useNotificationPreferences() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.notificationPreferences.lists(),
    queryFn: () => notificationPreferencesApi.listPreferences(supabase),
  });
}

export function useSetNotificationPreference() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      type,
      muted,
    }: {
      userId: string;
      type: NotificationType;
      muted: boolean;
    }) => notificationPreferencesApi.setPreference(supabase, userId, type, muted),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificationPreferences.all }),
  });
}

/* ----------------------------------------------------------- statements --- */
export function useStatements() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.statements.lists(),
    queryFn: () => statementsApi.listStatements(supabase),
  });
}

export function useStatement(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.statements.detail(id),
    queryFn: () => statementsApi.getStatement(supabase, id),
    enabled: Boolean(id),
  });
}

export function useStatementLines(statementId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.statements.lines(statementId),
    queryFn: () => statementsApi.listStatementLines(supabase, statementId),
    enabled: Boolean(statementId),
  });
}

export function useCreateStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StatementInput) => statementsApi.createStatement(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.statements.all }),
  });
}

export function useDeleteStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => statementsApi.deleteStatement(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.statements.all }),
  });
}

export function useBulkInsertLines() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lines: StatementLineInput[]) => statementsApi.bulkInsertLines(supabase, lines),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.statements.all }),
  });
}

export function useSetLineMatch() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lineId,
      patch,
    }: {
      lineId: string;
      patch: Parameters<typeof statementsApi.setLineMatch>[2];
    }) => statementsApi.setLineMatch(supabase, lineId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.statements.all }),
  });
}

/* Posting (and voiding) rewrites money downstream: statements, the ledger,
 * and payout rollups all refresh together. */
export function usePostStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      statementId,
      entries,
    }: {
      statementId: string;
      entries: statementsApi.LedgerEntryWire[];
    }) => statementsApi.postStatement(supabase, statementId, entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.statements.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
    },
  });
}

export function useVoidStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statementId: string) => statementsApi.voidStatement(supabase, statementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.statements.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
    },
  });
}

/** Uploads the raw-CSV audit copy to the staff-only statements bucket. */
export function useStatementUpload() {
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ path, file }: { path: string; file: File }) => {
      const { token } = await statementsApi.createStatementUploadUrl(supabase, path);
      const { error } = await supabase.storage
        .from(statementsApi.STATEMENTS_BUCKET)
        .uploadToSignedUrl(path, token, file);
      if (error) throw error;
      return { path };
    },
  });
}

/* --------------------------------------------------------------- ledger --- */
export function useLedgerByAgent(agentId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.ledger.byAgent(agentId),
    queryFn: () => ledgerApi.listLedgerByAgent(supabase, agentId),
    enabled: Boolean(agentId),
  });
}

export function useLedgerByAgency(agencyId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.ledger.byAgency(agencyId),
    queryFn: () => ledgerApi.listLedgerByAgency(supabase, agencyId),
    enabled: Boolean(agencyId),
  });
}

export function useLedgerByPolicy(policyId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.ledger.byPolicy(policyId),
    queryFn: () => ledgerApi.listLedgerByPolicy(supabase, policyId),
    enabled: Boolean(policyId),
  });
}

export function useLedgerByPeriod(periodMonth: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.ledger.byPeriod(periodMonth),
    queryFn: () => ledgerApi.listLedgerByPeriod(supabase, periodMonth),
    enabled: Boolean(periodMonth),
  });
}

/* -------------------------------------------------------------- payouts --- */
export function usePayoutStatements() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.payouts.lists(),
    queryFn: () => payoutsApi.listPayoutStatements(supabase),
  });
}

export function useCreatePayoutStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutStatementInput) => payoutsApi.createPayoutStatement(supabase, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useUpdatePayoutStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PayoutStatus }) =>
      payoutsApi.updatePayoutStatus(supabase, id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}

export function useDeletePayoutStatement() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payoutsApi.deletePayoutStatement(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payouts.all });
      qc.invalidateQueries({ queryKey: queryKeys.ledger.all });
    },
  });
}
