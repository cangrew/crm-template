import { Fragment, type ReactNode } from "react";

export type KvRow = { label: ReactNode; value: ReactNode };

/**
 * Definition-list of label/value rows (the `dl.kv` pattern on every detail page).
 * Falsy values are kept as-is; callers pass an em-dash placeholder where needed.
 */
export function KvList({ rows }: { rows: KvRow[] }) {
  return (
    <dl className="kv">
      {rows.map((r, i) => (
        <Fragment key={i}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
