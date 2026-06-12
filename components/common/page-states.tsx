import { ErrorState } from "@/components/ui/states";

const DEFAULT_DETAIL_ROWS = 6;

/**
 * Standard full-page error shell: the `.page` container + `.card` wrapper around
 * the shared {@link ErrorState}. Replaces the copy-pasted error blocks that every
 * route page repeats (see `clients/page.tsx`, `documents/page.tsx`, …).
 *
 * Bespoke per-page loading skeletons stay inline in their orchestrators — they
 * vary too much to share, matching the loads pilot precedent.
 */
export function PageErrorState({
  title,
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
        <ErrorState title={title} body={body} onRetry={onRetry} />
      </div>
    </div>
  );
}

/**
 * Standard detail-page loading skeleton: a title bar over a card of placeholder
 * rows. Shared by the entity detail pages (clients, …).
 */
export function PageDetailLoading({ rows = DEFAULT_DETAIL_ROWS }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <div className="skel h-[30px] w-[240px]" />
      <div className="border-border bg-bg mt-6 rounded-[var(--radius-lg)] border p-6 shadow-[var(--shadow-card)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skel mb-3 h-[18px]" />
        ))}
      </div>
    </div>
  );
}
