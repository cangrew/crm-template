"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContactStatus } from "@/lib/domain/enums";
import type { NotificationType } from "@/lib/domain/notifications";
import type {
  ContactInput,
  ContactUpdate,
  DocumentInput,
  ProfileUpdate,
} from "@/lib/domain/schemas";
import { createClient } from "@/lib/supabase/client";
import * as contactsApi from "./contacts";
import * as documentsApi from "./documents";
import * as notificationPreferencesApi from "./notification-preferences";
import * as notificationsApi from "./notifications";
import * as profilesApi from "./profiles";
import { queryKeys } from "./query-keys";

/* ------------------------------------------------------------- contacts --- */
/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity".
 * One section per entity: list/detail queries plus mutations that invalidate
 * the entity's whole key family (lists, details, and dashboards refresh
 * together — that breadth is intentional). */
export function useContacts() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.contacts.lists(),
    queryFn: () => contactsApi.listContacts(supabase),
  });
}

export function useContact(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => contactsApi.getContact(supabase, id),
    enabled: Boolean(id),
  });
}

export function useCreateContact() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => contactsApi.createContact(supabase, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
}

export function useUpdateContact() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ContactUpdate }) =>
      contactsApi.updateContact(supabase, id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
}

export function useUpdateContactStatus() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      contactsApi.updateContactStatus(supabase, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
}

export function useDeleteContact() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(supabase, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
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

export function useDocumentsByContact(contactId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.documents.byContact(contactId),
    queryFn: () => documentsApi.listDocumentsByContact(supabase, contactId),
    enabled: Boolean(contactId),
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
