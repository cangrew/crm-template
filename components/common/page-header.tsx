import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared page header shell. Serves both list headers (title + subtitle + actions)
 * and detail headers (adds a back link above the title and a badges slot beside
 * the actions). Mirrors the `.page-head` markup used across the app so the visual
 * result is identical to the per-page headers it replaces.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Back",
  badges,
  leading,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  badges?: ReactNode;
  leading?: ReactNode;
}) {
  const titleBlock = (
    <div>
      {backHref && (
        <Link href={backHref} className="back-link">
          <ArrowLeft size={14} />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className="font-display text-[26px] font-bold tracking-[-0.02em]">{title}</div>
      {subtitle != null && <div className="text-ink-500 mt-1 text-sm">{subtitle}</div>}
    </div>
  );

  return (
    <div className="mb-[22px] flex items-start gap-4">
      {leading ? (
        <div className="flex items-center gap-3.5">
          {leading}
          {titleBlock}
        </div>
      ) : (
        titleBlock
      )}
      {(badges || actions) && (
        <div className="page-actions">
          {badges}
          {actions}
        </div>
      )}
    </div>
  );
}
