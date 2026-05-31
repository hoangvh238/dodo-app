import { flagEmoji } from "@/lib/utils";

interface Props {
  data: Array<{ country: string; country_code: string; count: number }>;
}

export default function RegionBreakdown({ data }: Props) {
  const max = data[0]?.count ?? 1;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5">
      <h2 className="text-sm font-semibold text-slate-100 mb-5">Top Countries</h2>
      {data.length === 0 ? (
        <p className="text-slate-600 text-sm">No location data yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(({ country, country_code, count }, i) => (
            <div key={country_code ?? country} className="flex items-center gap-3 group">
              <span className="text-base w-7 shrink-0 text-center">{flagEmoji(country_code)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                    {country}
                  </span>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    {i === 0 && (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                        #1
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-200 tabular-nums">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${(count / max) * 100}%`, opacity: 0.6 + 0.4 * (1 - i / data.length) }}
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
