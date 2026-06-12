"use client";

import { useState } from "react";
import type { z } from "zod";

export interface UseDetailEditOptions<TDraft, TPatch> {
  /** Map the raw string draft to the typed patch the schema validates. */
  toPatch: (draft: TDraft) => unknown;
  schema: z.ZodType<TPatch>;
  /**
   * Optional pre-schema checks on the raw draft (e.g. amount parsing that the
   * patch mapper would otherwise coerce to null). Runs before the schema; any
   * returned messages block the save.
   */
  validateDraft?: (draft: TDraft) => Partial<Record<keyof TDraft & string, string>>;
  /** Validation failed — pages typically toast "Please fix the highlighted fields." */
  onInvalid?: () => void;
  /**
   * Validation passed. Run the mutation here and call {@link finish} (alias of
   * cancel) from its success handler so the editor closes only on a real save.
   */
  onValid: (patch: TPatch) => void;
}

/**
 * The detail-page edit workflow shared by entity detail pages (see the clients
 * pages): an editing flag, a draft of raw field strings, per-field error
 * messages mapped from zod issues, and start/cancel/save transitions. Pages
 * render their own cards and pass `draft`/`errors`/`setField` down.
 */
export function useDetailEdit<TDraft extends object, TPatch>({
  toPatch,
  schema,
  validateDraft,
  onInvalid,
  onValid,
}: UseDetailEditOptions<TDraft, TPatch>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof TDraft & string, string>>>({});

  function start(initial: TDraft) {
    setDraft(initial);
    setErrors({});
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setDraft(null);
    setErrors({});
  }

  function setField<K extends keyof TDraft>(key: K, value: TDraft[K]) {
    setDraft((cur) => (cur ? { ...cur, [key]: value } : cur));
    // Editing a field invalidates its last validation message.
    setErrors((cur) => {
      if (!(key in cur)) return cur;
      const next = { ...cur };
      delete next[key as keyof TDraft & string];
      return next;
    });
  }

  function save() {
    if (!draft) return;
    const pre = validateDraft?.(draft) ?? {};
    if (Object.keys(pre).length > 0) {
      setErrors(pre);
      onInvalid?.();
      return;
    }
    const parsed = schema.safeParse(toPatch(draft));
    if (!parsed.success) {
      const next: Partial<Record<keyof TDraft & string, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as keyof TDraft & string] = issue.message;
        }
      }
      setErrors(next);
      onInvalid?.();
      return;
    }
    setErrors({});
    onValid(parsed.data);
  }

  return { editing, draft, errors, start, cancel, finish: cancel, setField, save };
}
