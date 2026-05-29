import { flagEmoji } from "@/lib/utils";

interface Props {
  data: Array<{ country: string; country_code: string; count: number }>;
}

export default function RegionBreakdown({ data }: Props) {
  const max = data[0]?.count ?? 1;

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-slate-100 mb-4">Top Countries</h2>
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm">No location data yet</p>
      ) : (
        <div className="space-y-2.5">
          {data.map(({ country, country_code, count }) => (
            <div key={country_code} className="flex items-center gap-3">
              <span className="text-lg w-7 shrink-0">{flagEmoji(country_code)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 truncate">{country}</span>
                  <span className="text-xs font-medium text-slate-200 ml-2 shrink-0">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${(count / max) * 100}%` }}
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
