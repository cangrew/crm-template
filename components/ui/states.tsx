import { Inbox, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Btn } from "./btn";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="e-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="errstate">
      <div className="e-icon">
        <TriangleAlert size={26} />
      </div>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {onRetry && (
        <Btn variant="outline" icon={<RefreshCw />} onClick={onRetry}>
          Try again
        </Btn>
      )}
    </div>
  );
}

export function TableSkeleton({ cols, rows = 7 }: { cols: number[]; rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {cols.map((w, i) => (
            <td key={i}>
              <div className="skel h-[13px]" style={{ width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
