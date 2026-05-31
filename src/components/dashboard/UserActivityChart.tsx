"use client";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";

type DataPoint = { date: string; count: number };

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload?: { date?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const rawDate = payload[0]?.payload?.date;
  const displayDate = rawDate ? format(parseISO(rawDate), "MMM d, yyyy") : "";
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl">
      <p className="text-[11px] text-slate-500 mb-0.5">{displayDate}</p>
      <p className="text-base font-bold text-white">{payload[0].value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500">events</p>
    </div>
  );
}

export default function UserActivityChart({ data }: { data: DataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5 h-full min-h-[220px]">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">Activity (Last 30 days)</h3>
      {formatted.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
          No activity data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#475569" }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#475569" }}
              axisLine={false} tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="count"
              stroke="#8b5cf6" strokeWidth={2}
              fill="url(#userGrad)" dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
