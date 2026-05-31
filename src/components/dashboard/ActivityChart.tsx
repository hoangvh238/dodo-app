"use client";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useState } from "react";

type DataPoint = { date: string; count: number };

interface Props {
  data: DataPoint[];
}

const RANGES = [
  { label: "7d",  days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload?: { date?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const rawDate = payload[0]?.payload?.date;
  const displayDate = rawDate ? format(parseISO(rawDate), "MMM d, yyyy") : "";
  return (
    <div className="bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl shadow-black/50">
      <p className="text-[11px] text-slate-500 mb-0.5">{displayDate}</p>
      <p className="text-base font-bold text-white">{payload[0].value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500">events</p>
    </div>
  );
}

export default function ActivityChart({ data }: Props) {
  const [range, setRange] = useState(30);

  const filtered = data
    .slice(-range)
    .map((d) => ({ ...d, label: format(parseISO(d.date), "MMM d") }));

  const max  = Math.max(...filtered.map((d) => d.count), 1);
  const avg  = filtered.length ? filtered.reduce((s, d) => s + d.count, 0) / filtered.length : 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Event Activity</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            peak {max.toLocaleString()} · avg {Math.round(avg).toLocaleString()} per day
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {RANGES.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => setRange(days)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                range === days
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={filtered} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
          <ReferenceLine y={avg} stroke="#6366f1" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(99,102,241,0.3)", strokeWidth: 1 }} />
          <Area
            type="monotone" dataKey="count"
            stroke="#6366f1" strokeWidth={2}
            fill="url(#grad)" dot={false}
            activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
