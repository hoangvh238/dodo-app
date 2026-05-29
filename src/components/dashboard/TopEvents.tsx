"use client";

interface Props {
  data: Array<{ type: string; count: number }>;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"];

export default function TopEvents({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl p-5 h-full">
      <h2 className="text-sm font-semibold text-slate-100 mb-4">Top Event Types</h2>
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm">No data yet</p>
      ) : (
        <div className="space-y-2">
          {data.map(({ type, count }, i) => (
            <div key={type} className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-300 truncate">{type}</span>
                  <span className="text-xs text-slate-400 ml-2 shrink-0">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${total > 0 ? (count / total) * 100 : 0}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
