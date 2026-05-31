export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCircle2, Globe, Calendar, Activity, Layers, Monitor } from "lucide-react";
import { flagEmoji, formatDate, formatRelative } from "@/lib/utils";
import UserActivityChart from "@/components/dashboard/UserActivityChart";
import type { IpUserProfile, UserSession } from "@/types/analytics";

async function getUserData(ip: string) {
  const supabase = createServiceClient();
  const [
    { data: profileRaw },
    { data: sessions },
    { data: eventTypes },
    { data: activityRaw },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.rpc("get_ip_user_profile", { p_ip: ip }),
    supabase.rpc("get_sessions_for_ip", { p_ip: ip, p_limit: 15, p_offset: 0 }),
    supabase.rpc("get_event_types_for_ip", { p_ip: ip }),
    supabase.rpc("get_user_events_over_time", { p_ip: ip }),
    supabase
      .from("events")
      .select("id,event_type,event_data,created_at,app_version,os_platform")
      .eq("ip_address", ip)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
  return { profile, sessions, eventTypes, activityRaw, recentEvents };
}

function maskIp(ip: string) {
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  const v6 = ip.split(":");
  if (v6.length > 2) return `${v6[0]}:${v6[1]}:****`;
  return ip;
}

const EVENT_COLORS = [
  "#6366f1","#8b5cf6","#06b6d4","#10b981",
  "#f59e0b","#ef4444","#ec4899","#84cc16",
];

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ ip: string }>;
}) {
  const { ip: encodedIp } = await params;
  const ip = decodeURIComponent(encodedIp);

  const { profile, sessions, eventTypes, activityRaw, recentEvents } = await getUserData(ip);

  if (!profile) notFound();

  const p = profile as IpUserProfile;
  const activity = (activityRaw ?? []).map(
    (r: { day: string; cnt: number }) => ({ date: r.day, count: Number(r.cnt) })
  );
  const etList = (eventTypes ?? []).map(
    (r: { event_type: string; cnt: number }, i: number) => ({
      type: r.event_type, count: Number(r.cnt), color: EVENT_COLORS[i % EVENT_COLORS.length]
    })
  );
  const etTotal = etList.reduce((s: number, e: { count: number }) => s + e.count, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Users
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <UserCircle2 size={28} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white font-mono">
                {maskIp(ip)}
              </h1>
              {p.country_code && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="text-lg">{flagEmoji(p.country_code)}</span>
                  {p.city && `${p.city}, `}{p.country}
                </span>
              )}
            </div>
            {p.region && (
              <p className="text-sm text-slate-500 mt-0.5">{p.region}</p>
            )}

            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Layers size={14} className="text-violet-400" />
                <span className="text-slate-300 font-semibold">{Number(p.session_count)}</span>
                <span className="text-slate-500">sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity size={14} className="text-blue-400" />
                <span className="text-slate-300 font-semibold">{Number(p.total_events).toLocaleString()}</span>
                <span className="text-slate-500">events</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe size={14} className="text-emerald-400" />
                <span className="text-slate-500">First seen</span>
                <span className="text-slate-300">{formatRelative(p.first_seen)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-amber-400" />
                <span className="text-slate-500">Last active</span>
                <span className="text-slate-300">{formatRelative(p.last_seen)}</span>
              </div>
            </div>

            {/* Platforms & versions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {(p.platforms ?? []).map((pl: string) => (
                <span key={pl} className="flex items-center gap-1 text-[11px] bg-white/5 border border-white/[0.06] px-2.5 py-1 rounded-full text-slate-400">
                  <Monitor size={10} /> {pl}
                </span>
              ))}
              {(p.versions ?? []).map((v: string) => (
                <span key={v} className="text-[11px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-300">
                  v{v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity chart + event breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <UserActivityChart data={activity} />
        </div>

        {/* Event type breakdown */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Event Breakdown</h3>
          {etList.length === 0 ? (
            <p className="text-slate-600 text-sm">No events yet</p>
          ) : (
            <div className="space-y-3">
              {etList.map((e: { type: string; count: number; color: string }) => (
                <div key={e.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.color }} />
                      <span className="text-xs text-slate-400 truncate">
                        {e.type.replace(/_/g," ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 ml-2 tabular-nums shrink-0">
                      {e.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${etTotal > 0 ? (e.count / etTotal) * 100 : 0}%`,
                        background: e.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sessions + Recent Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sessions list */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="text-sm font-semibold text-slate-100">Sessions</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {(sessions as UserSession[] ?? []).map((s) => (
              <div key={s.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-400 truncate">{s.id.slice(0, 20)}…</p>
                  <div className="flex items-center gap-3 mt-1">
                    {s.app_version && (
                      <span className="text-[10px] text-indigo-400">v{s.app_version}</span>
                    )}
                    {s.os_platform && (
                      <span className="text-[10px] text-slate-600">{s.os_platform}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-200">{s.events_count} events</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{formatRelative(s.last_seen_at)}</p>
                </div>
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <p className="px-5 py-8 text-center text-slate-600 text-sm">No sessions</p>
            )}
          </div>
        </div>

        {/* Recent events */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d1a] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h3 className="text-sm font-semibold text-slate-100">Recent Events</h3>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {(recentEvents ?? []).map((e: {
              id: string; event_type: string; event_data: Record<string, unknown>;
              created_at: string; app_version: string | null; os_platform: string | null;
            }) => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 shrink-0 max-w-[140px] truncate">
                  {e.event_type}
                </span>
                <div className="flex-1 min-w-0">
                  {Object.keys(e.event_data ?? {}).length > 0 && (
                    <p className="text-[10px] text-slate-600 font-mono truncate">
                      {JSON.stringify(e.event_data)}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 shrink-0">
                  {formatRelative(e.created_at)}
                </p>
              </div>
            ))}
            {(!recentEvents || recentEvents.length === 0) && (
              <p className="px-5 py-8 text-center text-slate-600 text-sm">No events</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
