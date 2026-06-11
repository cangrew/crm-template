"use client";
import type { Tone } from "@/lib/design/tones";
import { Badge } from "@/components/ui/badge";

import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { useSignedDownload } from "@/lib/data/hooks";
import type { DocumentRow } from "@/lib/supabase/types";

export const KIND_LABELS: Record<string, string> = {
  contract: "Contract",
  invoice: "Invoice",
  other: "Other",
};

const KIND_TONES: Record<string, Tone> = {
  contract: "t-blue",
  invoice: "t-teal",
  other: "t-slate",
};

export function DocumentCard({ doc }: { doc: DocumentRow }) {
  const name = doc.storage_path.split("/").pop() ?? doc.kind;
  const download = useSignedDownload();
  const toast = useToast();

  async function onDownload() {
    try {
      const url = await download.mutateAsync(doc.id);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not open the document.", "error");
    }
  }

  return (
    <div className="border-border bg-bg flex min-h-[160px] flex-col gap-3 rounded-[var(--radius-lg)] border p-[18px] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2.5">
        <span className="grid h-[42px] w-[42px] place-items-center rounded-[var(--radius-md)] bg-[#fef2f2] text-[var(--error)]">
          <FileText size={20} />
        </span>
        <Badge tone={KIND_TONES[doc.kind] ?? "t-slate"}>
          <span className="bdot" />
          {KIND_LABELS[doc.kind] ?? doc.kind}
        </Badge>
      </div>
      <div>
        <div className="text-ink-900 truncate text-[13.5px] font-semibold" title={name}>
          {name}
        </div>
        <div className="text-ink-500 mt-1 text-[12px]">
          Uploaded {doc.created_at ? doc.created_at.slice(0, 10) : "unknown"}
        </div>
      </div>
      <div className="mt-auto flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm flex-1"
          onClick={onDownload}
          disabled={download.isPending}
        >
          <Download size={14} />
          {download.isPending ? "Opening…" : "Download"}
        </button>
        {doc.contact_id && (
          <Link href={`/contacts/${doc.contact_id}`} className="btn btn-outline btn-sm flex-1">
            Open contact
          </Link>
        )}
      </div>
    </div>
  );
}
