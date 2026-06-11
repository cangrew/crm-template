"use client";

import type { ReactNode } from "react";
import { Btn } from "@/components/ui/btn";
import { Modal } from "@/components/ui/modal";

/**
 * A {@link Modal} preset for forms: a grid body for the fields plus a standard
 * Cancel / Submit footer wired to a pending state. The submit button is disabled
 * (and shows `pendingLabel`) while `isPending` is true.
 *
 * `columns` controls the body grid: 1 column (default, 12px gap) or a 2-column
 * form grid matching the new-load modal layout.
 */
export function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  isPending = false,
  submitDisabled = false,
  width,
  columns = 1,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  submitDisabled?: boolean;
  width?: number;
  columns?: 1 | 2;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={width}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={onSubmit} disabled={isPending || submitDisabled}>
            {isPending ? pendingLabel : submitLabel}
          </Btn>
        </>
      }
    >
      <div className={columns === 2 ? "grid grid-cols-2 gap-x-5 gap-y-4" : "grid gap-3"}>
        {children}
      </div>
    </Modal>
  );
}
