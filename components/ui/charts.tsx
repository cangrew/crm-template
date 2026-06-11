import { fmtUSD } from "@/lib/design/format";

export type Slice = {
  label: string;
  value: number;
  color: string;
};

/** Centered donut chart with a label/sub in the middle. */
export function Donut({
  data,
  centerLabel,
  centerSub,
  size = 180,
  thickness = 24,
}: {
  data: Slice[];
  centerLabel: string | number;
  centerSub?: string;
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  const slices = data.reduce<{ slice: Slice; offset: number; length: number }[]>((acc, slice) => {
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.length : 0;
    const length = (slice.value / total) * circumference;
    return [...acc, { slice, offset, length }];
  }, []);

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth={thickness}
        />
        {slices.map(({ slice, offset, length }) => (
          <circle
            key={slice.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight={700}
          fontSize={28}
          fill="var(--ink-900)"
        >
          {centerLabel}
        </text>
        {centerSub && (
          <text
            x={size / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            fontSize={11}
            fill="var(--ink-500)"
          >
            {centerSub}
          </text>
        )}
      </svg>
      <div className="grid flex-1 gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.color }} />
            <span className="text-ink-700 flex-1">{d.label}</span>
            <b className="mono">{d.value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export type Bar = {
  label: string;
  value: number;
  color?: string;
};

/** Vertical bar chart. */
export function BarChart({
  data,
  height = 200,
  formatValue = (v) => v.toLocaleString("en-US"),
}: {
  data: Bar[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2.5 py-3" style={{ height }}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="text-ink-500 font-mono text-[11px]">{formatValue(d.value)}</div>
            <div
              title={`${d.label}: ${formatValue(d.value)}`}
              className="min-h-[2px] w-full rounded-t-[var(--radius-sm)] [transition:height_.25s_ease]"
              style={{ height: `${pct}%`, background: d.color ?? "var(--accent)" }}
            />
            <div className="text-ink-500 text-center text-[11px]">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bar chart. */
export function HBarChart({ data, asCurrency = false }: { data: Bar[]; asCurrency?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="grid gap-3">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label}>
            <div className="mb-[5px] flex justify-between text-[13px]">
              <span className="text-ink-700 font-medium">{d.label}</span>
              <span className="font-mono font-semibold">
                {asCurrency ? fmtUSD(d.value) : d.value.toLocaleString("en-US")}
              </span>
            </div>
            <div className="workload-bar">
              <span
                style={{
                  width: `${pct}%`,
                  background: d.color ?? "var(--accent)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
