import { NextResponse, type NextRequest } from "next/server";
import { ALL_ROLES, AUTH_ERROR, requireApiRole } from "@/lib/auth/authorize";
import { createSignedDownloadUrl, getDocument } from "@/lib/data/documents";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Mints a short-lived signed URL for a stored document after re-checking that
 * the caller is an active, provisioned user (every role may read documents).
 * Downloads are always brokered here so a private-bucket object is never
 * exposed without an authorization check.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const auth = await requireApiRole(supabase, ALL_ROLES);
  if (!auth.ok) {
    return NextResponse.json(AUTH_ERROR[auth.status], { status: auth.status });
  }

  let doc;
  try {
    doc = await getDocument(supabase, id);
  } catch {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const url = await createSignedDownloadUrl(supabase, doc.storage_path);
  return NextResponse.json({ url });
}
