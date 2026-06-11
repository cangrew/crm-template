"use client";

import { Eye, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export function Dropzone({
  label = "Drop files to upload",
  hint = "Drag and drop or click to browse. PDF, JPG, PNG up to 10MB.",
  onSelect,
  onFile,
  accept,
}: {
  label?: string;
  hint?: string;
  onSelect?: () => void;
  /** Receives the first picked/dropped file. When set, the zone opens a real
   * file dialog on click and reports dropped files. */
  onFile?: (file: File) => void;
  accept?: string;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className="dropzone"
      style={over ? { borderColor: "var(--brand-500)", background: "var(--brand-50)" } : undefined}
      onClick={() => {
        onSelect?.();
        if (onFile) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onSelect?.();
        const file = e.dataTransfer.files?.[0];
        if (file && onFile) onFile(file);
      }}
    >
      {onFile && (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      )}
      <div className="dz-icon">
        <Upload size={20} />
      </div>
      <div className="dz-t">{label}</div>
      <div className="dz-s">{hint}</div>
    </div>
  );
}

export function FileCard({
  name,
  meta,
  fmt = "pdf",
  onView,
  onRemove,
  actions,
}: {
  name: string;
  meta?: string;
  fmt?: "pdf" | "img";
  onView?: () => void;
  onRemove?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="filecard">
      <span className={"fc-icon " + (fmt === "pdf" ? "fc-pdf" : "fc-img")}>
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="fc-name">{name}</div>
        {meta && <div className="fc-meta">{meta}</div>}
      </div>
      {actions}
      {onView && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onView}>
          <Eye size={15} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onRemove}
          aria-label="Remove"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
