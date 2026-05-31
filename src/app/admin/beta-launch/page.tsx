"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Rocket, Users, Activity, Calendar, Save, RefreshCw,
  CheckCircle2, AlertCircle, Globe, Lock, Clock3, Zap,
  TrendingUp, Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "open" | "coming_soon" | "closed";

interface BetaConfig {
  id: string;
  phase: Phase;
  launch_date: string | null;
  announcement: string | null;
  beta_slots: number;
  updated_at: string;
}

interface BetaStats {
  totalUsers: number;
  activeThisWeek: number;
  joinedToday: number;
  totalSessions: number;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function useCountdownPreview(launchDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!launchDate) return;
    const update = () => {
      const diff = new Date(launchDate).getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [launchDate]);
  return time;
}

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES: { value: Phase; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  {
    value: "open",
    label: "Open Beta",
    desc: "Anyone can download and use for free",
    icon: Globe,
    color: "emerald",
  },
  {
    value: "coming_soon",
    label: "Coming Soon",
    desc: "Beta launches soon — teaser shown on homepage",
    icon: Clock3,
    color: "amber",
  },
  {
    value: "closed",
    label: "Closed",
    desc: "Beta ended — prompt users to download v1.0",
    icon: Lock,
    color: "red",
  },
];

const PHASE_STYLES: Record<Phase, string> = {
  open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  coming_soon: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  closed: "bg-red-500/10 text-red-400 border-red-500/25",
};

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "indigo" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    violet: "bg-violet-500/10 text-violet-400",
  };
  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-100 mb-0.5" style={{ letterSpacing: "-0.8px" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Countdown preview ────────────────────────────────────────────────────────

function CountdownPreview({ launchDate }: { launchDate: string }) {
  const t = useCountdownPreview(launchDate);
  const isValid = launchDate && new Date(launchDate) > new Date();

  if (!isValid) {
    return (
      <p className="text-xs text-slate-500 italic">Set a future date to preview the countdown.</p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {[{ v: t.days, l: "Days" }, { v: t.hours, l: "Hrs" }, { v: t.minutes, l: "Min" }, { v: t.seconds, l: "Sec" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-slate-100 font-mono text-xl"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
            {String(v).padStart(2, "0")}
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">{l}</span>
        </div>
      ))}
      <p className="text-xs text-slate-500 ml-2">← live preview</p>
    </div>
  );
}

// ─── Recent beta users ────────────────────────────────────────────────────────

function RecentBetaUsers() {
  const [rows, setRows] = useState<{ ip: string; country: string; city: string; first_seen: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    sb.from("sessions")
      .select("ip_address, country, city, started_at")
      .not("ip_address", "is", null)
      .order("started_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        const seen = new Set<string>();
        const unique = (data ?? []).filter(r => {
          if (!r.ip_address || seen.has(r.ip_address)) return false;
          seen.add(r.ip_address);
          return true;
        });
        setRows(unique.map(r => ({
          ip: r.ip_address,
          country: r.country ?? "—",
          city: r.city ?? "—",
          first_seen: r.started_at,
        })));
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2.5">
        <Activity size={15} className="text-brand" />
        <h2 className="font-semibold text-slate-100 text-sm">Recent Beta Users</h2>
        <span className="text-xs text-slate-500 ml-auto">latest unique IPs</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No sessions yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {["IP", "Location", "Joined"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rows.map(r => (
              <tr key={r.ip} className="hover:bg-bg-hover/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-300">{r.ip}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{r.city !== "—" ? `${r.city}, ` : ""}{r.country}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  <span className="flex items-center gap-1"><Clock3 size={11} />{timeAgo(r.first_seen)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BetaLaunchPage() {
  const [config, setConfig] = useState<BetaConfig | null>(null);
  const [form, setForm] = useState({
    phase: "open" as Phase,
    launch_date: "",
    announcement: "",
    beta_slots: 10000,
  });
  const [stats, setStats] = useState<BetaStats>({ totalUsers: 0, activeThisWeek: 0, joinedToday: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchConfig = useCallback(async () => {
    const sb = createClient();
    const [configResult, statsResult] = await Promise.all([
      sb.from("beta_config").select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(1).single(),
      sb.from("sessions").select("ip_address, started_at").not("ip_address", "is", null),
    ]);

    if (configResult.data) {
      const d = configResult.data;
      setConfig(d);
      setForm({
        phase: d.phase,
        launch_date: d.launch_date ? new Date(d.launch_date).toISOString().slice(0, 16) : "",
        announcement: d.announcement ?? "",
        beta_slots: d.beta_slots ?? 10000,
      });
    }

    if (statsResult.data) {
      const rows = statsResult.data;
      const ips = new Set(rows.map(r => r.ip_address));
      const now = Date.now();
      const weekAgo = now - 7 * 86400000;
      const dayAgo = now - 86400000;
      const activeThisWeek = new Set(
        rows.filter(r => new Date(r.started_at).getTime() > weekAgo).map(r => r.ip_address)
      ).size;
      const joinedToday = new Set(
        rows.filter(r => new Date(r.started_at).getTime() > dayAgo).map(r => r.ip_address)
      ).size;
      setStats({ totalUsers: ips.size, activeThisWeek, joinedToday, totalSessions: rows.length });
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg("");
    const sb = createClient();
    try {
      const payload = {
        phase: form.phase,
        launch_date: form.launch_date ? new Date(form.launch_date).toISOString() : null,
        announcement: form.announcement.trim() || null,
        beta_slots: form.beta_slots,
        is_active: true,
      };
      let error;
      if (config?.id) {
        ({ error } = await sb.from("beta_config").update(payload).eq("id", config.id));
      } else {
        ({ error } = await sb.from("beta_config").insert(payload));
      }
      if (error) throw error;
      setSaveStatus("success");
      await fetchConfig();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  };

  const inputCls = "w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Beta Launch</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Control beta access phase, countdown, and homepage announcement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total beta users" value={stats.totalUsers} color="indigo" />
        <StatCard icon={TrendingUp} label="Active this week" value={stats.activeThisWeek} color="emerald" />
        <StatCard icon={Zap} label="Joined today" value={stats.joinedToday} color="amber" />
        <StatCard icon={Activity} label="Total sessions" value={stats.totalSessions} color="violet" />
      </div>

      {/* Phase control */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Rocket size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">Beta Phase</h2>
          {!loading && config && (
            <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${PHASE_STYLES[config.phase]}`}>
              {config.phase.replace("_", " ")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PHASES.map(p => {
            const Icon = p.icon;
            const active = form.phase === p.value;
            const colorClasses: Record<string, string> = {
              emerald: active ? "border-emerald-500/50 bg-emerald-500/8 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-600",
              amber: active ? "border-amber-500/50 bg-amber-500/8 text-amber-300" : "border-slate-700 text-slate-400 hover:border-slate-600",
              red: active ? "border-red-500/50 bg-red-500/8 text-red-300" : "border-slate-700 text-slate-400 hover:border-slate-600",
            };
            return (
              <button key={p.value} onClick={() => setForm(f => ({ ...f, phase: p.value }))}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${colorClasses[p.color]}`}>
                <Icon size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{p.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{p.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Countdown config */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Calendar size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">Launch Countdown</h2>
          <span className="text-xs text-slate-500 ml-2">— shown on homepage if set</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Target v1.0 launch date/time (your local timezone)
          </label>
          <input
            type="datetime-local"
            value={form.launch_date}
            onChange={e => setForm(f => ({ ...f, launch_date: e.target.value }))}
            className={`${inputCls} [color-scheme:dark]`}
          />
          <p className="text-xs text-slate-600 mt-1.5">
            Leave blank to hide countdown and show &ldquo;Beta is live&rdquo; instead.
          </p>
        </div>

        {form.launch_date && (
          <div>
            <p className="text-xs font-medium text-slate-400 mb-3">Live preview</p>
            <CountdownPreview launchDate={new Date(form.launch_date).toISOString()} />
          </div>
        )}
      </div>

      {/* Announcement */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Download size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">Homepage Announcement</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Message shown in the beta section on the landing page
          </label>
          <textarea
            value={form.announcement}
            onChange={e => setForm(f => ({ ...f, announcement: e.target.value }))}
            placeholder="Early access is live. Download free and help shape DoDo v1.0."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Max beta slots</label>
            <input
              type="number"
              value={form.beta_slots}
              onChange={e => setForm(f => ({ ...f, beta_slots: parseInt(e.target.value) || 10000 }))}
              className={inputCls}
            />
            <p className="text-xs text-slate-600 mt-1">Shown as &ldquo;X spots remaining&rdquo; on homepage.</p>
          </div>
        </div>

        {/* Status */}
        {saveStatus === "success" && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} />Config saved — homepage updates within 60 seconds.
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} />{errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={fetchConfig}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <RefreshCw size={13} />Refresh
          </button>
          {config && (
            <span className="text-xs text-slate-600">Last saved {timeAgo(config.updated_at)}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
            {saveStatus === "saving"
              ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
              : <><Save size={14} />Save Config</>
            }
          </button>
        </div>
      </div>

      {/* Recent beta users */}
      <RecentBetaUsers />
    </div>
  );
}
