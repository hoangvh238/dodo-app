"use client";

interface Props {
  data: Array<{ type: string; count: number }>;
}

const PALETTE = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#84cc16",
];

function shortLabel(type: string) {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TopEvents({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5 h-full">
      <h2 className="text-sm font-semibold text-slate-100 mb-5">Top Event Types</h2>
      {data.length === 0 ? (
        <p className="text-slate-600 text-sm">No data yet</p>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 8).map(({ type, count }, i) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            const color = PALETTE[i % PALETTE.length];
            return (
              <div key={type} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                      {shortLabel(type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-slate-600">{pct.toFixed(1)}%</span>
                    <span className="text-xs font-medium text-slate-300 tabular-nums w-12 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
