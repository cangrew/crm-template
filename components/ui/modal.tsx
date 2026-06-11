"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Btn } from "./btn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function Modal({ open, onClose, title, children, footer, width = 540 }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(11,18,32,0.48)] backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-up border-border bg-bg flex max-h-[calc(100vh-80px)] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-[var(--radius-xl)] border shadow-[0_24px_64px_rgba(0,0,0,0.24)]"
        style={{ width }}
      >
        <div className="border-border flex shrink-0 items-center border-b px-[22px] py-[18px]">
          <h2 className="font-display flex-1 text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-[22px]">{children}</div>
        {footer && (
          <div className="border-border bg-bg-subtle flex shrink-0 justify-end gap-2.5 rounded-b-[var(--radius-xl)] border-t px-[22px] py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  hint,
  confirmLabel = "Delete",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  hint?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant={danger ? "danger-solid" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="text-ink-700 m-0 text-[14px] leading-[1.65]">{body}</p>
      {hint && (
        <div className="mt-3.5 rounded-[var(--radius-md)] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] leading-[1.5] text-[#b91c1c]">
          {hint}
        </div>
      )}
    </Modal>
  );
}
