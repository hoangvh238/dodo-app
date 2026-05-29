import { Activity, Users, Globe, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { OverviewStats } from "@/types/analytics";

interface Props {
  stats: OverviewStats;
}

export default function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: "Total Events",
      value: formatNumber(stats.totalEvents),
      sub: `+${formatNumber(stats.todayEvents)} today`,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Sessions",
      value: formatNumber(stats.totalSessions),
      sub: `${formatNumber(stats.activeSessionsLast24h)} active (24h)`,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Countries",
      value: stats.uniqueCountries.toString(),
      sub: "unique regions reached",
      icon: Globe,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Events Today",
      value: formatNumber(stats.todayEvents),
      sub: "since midnight UTC",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div key={label} className="bg-bg-card border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
            <div className={`${bg} p-2.5 rounded-lg`}>
              <Icon size={18} className={color} strokeWidth={2} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
