import type { DocumentInput, DocumentKind } from "@/lib/domain/schemas";
import type { DocumentRow, TablesInsert, TypedSupabaseClient } from "@/lib/supabase/types";

/** Single private Storage bucket for all uploaded documents. */
export const DOCUMENTS_BUCKET = "documents";

/**
 * Build a unique, sanitized object path for a document within the bucket:
 * `<prefix>/<kind>-<timestamp>-<safe-name>`, where the prefix is the owning
 * contact's id or "general" for standalone documents. The timestamp keeps
 * repeat uploads of the same file name from colliding.
 */
export function documentStoragePath(
  prefix: string,
  kind: DocumentKind,
  fileName: string,
  now: number = Date.now(),
): string {
  const safeName =
    fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "file";
  return `${prefix}/${kind}-${now}-${safeName}`;
}

export async function listDocuments(supabase: TypedSupabaseClient): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listDocumentsByContact(
  supabase: TypedSupabaseClient,
  contactId: string,
): Promise<DocumentRow[]> {
  const { data, error } = await supabase.from("documents").select("*").eq("contact_id", contactId);
  if (error) throw error;
  return data ?? [];
}

export async function getDocument(supabase: TypedSupabaseClient, id: string): Promise<DocumentRow> {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createDocument(
  supabase: TypedSupabaseClient,
  input: DocumentInput,
): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from("documents")
    .insert(input as TablesInsert<"documents">)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

/** Mint a short-lived URL to upload an object into the private bucket. */
export async function createSignedUploadUrl(supabase: TypedSupabaseClient, path: string) {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return data;
}

/** Mint a short-lived URL to download a private object. */
export async function createSignedDownloadUrl(
  supabase: TypedSupabaseClient,
  path: string,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
