import type { ReactNode } from "react";

/**
 * The detail-page two-column layout: a primary left column and a right rail
 * whose children stack with an 18px gap.
 */
export function TwoColumnLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="mt-6 grid grid-cols-[2.1fr_1fr] items-start gap-[18px] [&>*]:min-w-0">
      {left}
      <div className="flex flex-col gap-[18px]">{right}</div>
    </div>
  );
}
