"use client";
import { Activity, Users, Globe, Zap, TrendingUp, UserCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { OverviewStats } from "@/types/analytics";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

interface CardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  accent: string;
  glow: string;
  badge?: string;
}

function StatCard({ label, value, sub, icon: Icon, accent, glow, badge }: CardProps) {
  const count = useCountUp(value);

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-[#0d0d1a] p-5 transition-all duration-300 hover:scale-[1.02] ${accent}`}>
      {/* Glow blob */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-20 ${glow}`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
          <div className={`p-2 rounded-xl ${glow} bg-opacity-10`}>
            <Icon size={16} className="text-white/80" strokeWidth={2} />
          </div>
        </div>

        <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
          {formatNumber(count)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-slate-500">{sub}</p>
          {badge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
              <TrendingUp size={9} />
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ stats }: { stats: OverviewStats }) {
  const cards: CardProps[] = [
    {
      label:  "Total Events",
      value:  stats.totalEvents,
      sub:    `+${formatNumber(stats.todayEvents)} today`,
      icon:   Activity,
      accent: "border-blue-500/20",
      glow:   "bg-blue-500",
      badge:  stats.todayEvents > 0 ? "Active" : undefined,
    },
    {
      label:  "Unique Users",
      value:  stats.uniqueUsers ?? 0,
      sub:    `${formatNumber(stats.activeSessionsLast24h)} active (24h)`,
      icon:   UserCircle2,
      accent: "border-violet-500/20",
      glow:   "bg-violet-500",
    },
    {
      label:  "Sessions",
      value:  stats.totalSessions,
      sub:    `${formatNumber(stats.activeSessionsLast24h)} in last 24h`,
      icon:   Users,
      accent: "border-indigo-500/20",
      glow:   "bg-indigo-500",
    },
    {
      label:  "Countries",
      value:  stats.uniqueCountries,
      sub:    "unique regions reached",
      icon:   Globe,
      accent: "border-emerald-500/20",
      glow:   "bg-emerald-500",
    },
    {
      label:  "Events Today",
      value:  stats.todayEvents,
      sub:    "since midnight UTC",
      icon:   Zap,
      accent: "border-amber-500/20",
      glow:   "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
