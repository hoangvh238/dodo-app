"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lock, Unlock, Shield, RefreshCw, Save, Clock, Eye,
  AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Users, Activity, Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionConfig {
  id: string;
  min_version: string;
  latest_version: string;
  download_url: string;
  release_notes: string;
  build_hash: string | null;
  custom_message: string | null;
  is_blocked: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Gate Preview ─────────────────────────────────────────────────────────────

function GatePreview({ config }: { config: Partial<VersionConfig> }) {
  const [show, setShow] = useState<"blocked" | "required" | null>("blocked");

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Eye size={15} className="text-brand" />
          <h2 className="font-semibold text-slate-100 text-sm">Gate Preview</h2>
          <span className="text-xs text-slate-500">— what users see</span>
        </div>
        <div className="flex gap-1.5">
          {(["blocked", "required", null] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => setShow(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                show === v
                  ? "bg-brand/15 text-brand border-brand/30"
                  : "border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              {v === null ? "Normal" : v === "blocked" ? "🔒 Blocked" : "⚠️ Update"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex items-center justify-center min-h-[260px] bg-[#0d1117]">
        {show === null && (
          <p className="text-slate-500 text-sm">App is running normally — no gate shown.</p>
        )}

        {show === "blocked" && (
          <div className="w-[340px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(94,92,230,0.18)] border border-[rgba(94,92,230,0.42)] flex items-center justify-center mx-auto mb-5">
              <Lock size={24} className="text-[#8B84FF]" />
            </div>
            <p className="text-white font-bold text-base leading-tight mb-2 whitespace-pre-wrap">
              {config.custom_message || "Access Restricted"}
            </p>
            <p className="text-slate-400 text-xs mb-5">
              {config.custom_message ? `v1.0.0` : "This version of DoDo is no longer available.\nPlease download the latest version to continue."}
            </p>
            <div className="h-px bg-slate-700 mb-4" />
            <div className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-[#5E5CE6] to-[#0A84FF] flex items-center justify-center gap-2 cursor-default">
              <Download size={14} />
              Download New Version
            </div>
            <p className="text-slate-600 text-xs mt-3">Tải phiên bản mới để tiếp tục sử dụng.</p>
          </div>
        )}

        {show === "required" && (
          <div className="w-[340px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 text-center shadow-2xl relative">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-transparent border border-slate-700 flex items-center justify-center text-slate-500 text-xs">✕</div>
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,69,58,0.14)] border border-[rgba(255,69,58,0.28)] flex items-center justify-center mx-auto mb-5">
              <Shield size={24} className="text-[#FF453A]" />
            </div>
            <p className="text-white font-bold text-base mb-2">Update Required</p>
            {config.custom_message && (
              <div className="bg-[rgba(255,69,58,0.10)] border border-[rgba(255,69,58,0.22)] rounded-xl p-3 mb-3 text-left">
                <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">{config.custom_message}</p>
              </div>
            )}
            <p className="text-slate-400 text-xs mb-4">
              Version <span className="font-bold text-white">{config.latest_version || "1.0.0"}</span> is required.
              <br />You are running <code className="bg-white/5 px-1.5 py-0.5 rounded">v0.9.0</code>
            </p>
            <div className="h-px bg-slate-700 mb-4" />
            <div className="w-full py-3 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center gap-2 cursor-default">
              <Download size={14} />
              Download Update
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Version Distribution ─────────────────────────────────────────────────────

function VersionDistribution() {
  const [data, setData] = useState<{ version: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("app_version")
      .not("app_version", "is", null)
      .then(({ data: rows }) => {
        const map: Record<string, number> = {};
        for (const r of rows ?? []) {
          const v = r.app_version ?? "unknown";
          map[v] = (map[v] ?? 0) + 1;
        }
        const sorted = Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .map(([version, count]) => ({ version, count }));
        setData(sorted);
        setLoading(false);
      });
  }, []);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2.5">
        <Users size={15} className="text-brand" />
        <h2 className="font-semibold text-slate-100 text-sm">Live Client Versions</h2>
        <span className="text-xs text-slate-500">— from sessions table</span>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">No sessions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {data.map(({ version, count }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={version} className="flex items-center gap-3">
                  <code className="text-xs font-mono text-slate-300 w-20 shrink-0">v{version}</code>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 w-6 text-right">{pct}%</span>
                    <span className="text-xs text-slate-600 w-10 text-right">{count} users</span>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-slate-600 pt-1">{total} total sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Config History ───────────────────────────────────────────────────────────

function ConfigHistory({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<VersionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("app_version_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [refreshKey]);

  const visible = expanded ? rows : rows.slice(0, 4);

  return (
    <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2.5">
        <Activity size={15} className="text-brand" />
        <h2 className="font-semibold text-slate-100 text-sm">Config History</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No config rows yet.</p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Status", "Min", "Latest", "Blocked", "Message", "Updated"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-bg-hover/50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                      r.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-700/50 text-slate-500 border-slate-600/30"
                    }`}>
                      {r.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">≥{r.min_version}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">{r.latest_version}</td>
                  <td className="px-5 py-3">
                    {r.is_blocked ? (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                        <Lock size={11} /> YES
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                    {r.custom_message || <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {timeAgo(r.updated_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 4 && (
            <div className="px-5 py-3 border-t border-slate-700">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand transition-colors"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? "Show less" : `Show ${rows.length - 4} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VersionConfigPage() {
  const [config, setConfig] = useState<VersionConfig | null>(null);
  const [form, setForm] = useState({
    min_version: "",
    latest_version: "",
    download_url: "",
    release_notes: "",
    build_hash: "",
    custom_message: "",
    is_blocked: false,
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  const fetchConfig = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_version_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setConfig(data);
      setForm({
        min_version: data.min_version,
        latest_version: data.latest_version,
        download_url: data.download_url,
        release_notes: data.release_notes ?? "",
        build_hash: data.build_hash ?? "",
        custom_message: data.custom_message ?? "",
        is_blocked: data.is_blocked ?? false,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg("");
    const supabase = createClient();

    try {
      const payload = {
        min_version: form.min_version.trim(),
        latest_version: form.latest_version.trim(),
        download_url: form.download_url.trim(),
        release_notes: form.release_notes.trim(),
        build_hash: form.build_hash.trim() || null,
        custom_message: form.custom_message.trim() || null,
        is_blocked: form.is_blocked,
        is_active: true,
      };

      let error;
      if (config?.id) {
        ({ error } = await supabase.from("app_version_config").update(payload).eq("id", config.id));
      } else {
        ({ error } = await supabase.from("app_version_config").insert(payload));
      }

      if (error) throw error;
      setSaveStatus("success");
      setHistoryKey((k) => k + 1);
      await fetchConfig();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const inputCls = "w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Version Config</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Controls update gates and hard-block for all DoDo clients · cached 60s on Vercel edge
        </p>
      </div>

      {/* ── Hard Block Banner ──────────────────────────────────────────────── */}
      <div className={`rounded-xl border p-5 transition-all ${
        form.is_blocked
          ? "bg-red-950/30 border-red-500/40"
          : "bg-bg-card border-slate-700"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            form.is_blocked ? "bg-red-500/20" : "bg-slate-700/50"
          }`}>
            {form.is_blocked
              ? <Lock size={18} className="text-red-400" />
              : <Unlock size={18} className="text-slate-400" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className={`font-semibold text-sm ${form.is_blocked ? "text-red-300" : "text-slate-100"}`}>
                Hard Block {form.is_blocked ? "— ACTIVE" : "— Off"}
              </p>
              {form.is_blocked && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  ALL CLIENTS LOCKED
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              When enabled: all hotkeys disabled, tray stripped to Download + Quit, full-screen unbypassable gate shown on every window. Use to close beta or force migration.
            </p>
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, is_blocked: !f.is_blocked }))}
            className={`relative w-12 h-6 rounded-full transition-all shrink-0 ${
              form.is_blocked ? "bg-red-500" : "bg-slate-600"
            }`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              form.is_blocked ? "left-[26px]" : "left-0.5"
            }`} />
          </button>
        </div>
      </div>

      {/* ── Config Editor ─────────────────────────────────────────────────── */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Shield size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">
            {loading ? "Loading…" : config ? "Edit Active Config" : "Create Config"}
          </h2>
          {config && (
            <span className="text-xs text-slate-500 ml-auto">
              last saved {timeAgo(config.updated_at)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Min Version <span className="text-slate-600">(blocks older builds)</span></label>
                <input {...field("min_version")} placeholder="1.0.0" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Latest Version <span className="text-slate-600">(shown in update gate)</span></label>
                <input {...field("latest_version")} placeholder="1.2.0" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Download URL</label>
              <input {...field("download_url")} placeholder="https://your-site.com/download" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Custom Message <span className="text-slate-600">(shown prominently in gate — leave blank for default text)</span>
              </label>
              <textarea
                {...field("custom_message")}
                placeholder="Beta đã kết thúc. Vui lòng tải phiên bản mới tại website để tiếp tục."
                rows={3}
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-slate-600 mt-1">
                When blocked=true, this becomes the main headline of the lock gate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Release Notes <span className="text-slate-600">(shown in update gate)</span></label>
              <textarea
                {...field("release_notes")}
                placeholder="What's new in this version..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Build Hash <span className="text-slate-600">(SHA-256 of app.asar · optional integrity check)</span>
              </label>
              <input
                {...field("build_hash")}
                placeholder="e3b0c44298fc1c149afb…"
                className={`${inputCls} font-mono text-xs`}
              />
            </div>

            {/* Status */}
            {saveStatus === "success" && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} />
                Config saved — clients will pick it up within 60 seconds.
              </div>
            )}
            {saveStatus === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {errorMsg}
              </div>
            )}

            {/* Action row */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { fetchConfig(); setHistoryKey((k) => k + 1); }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
              <div className="flex items-center gap-3">
                {form.is_blocked && (
                  <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertTriangle size={13} />
                    Hard block enabled — save to push to clients
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saveStatus === "saving"}
                  className={`flex items-center gap-2 px-5 py-2 font-medium rounded-lg text-sm transition-colors disabled:opacity-50 ${
                    form.is_blocked
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-brand hover:bg-brand-hover text-white"
                  }`}
                >
                  {saveStatus === "saving"
                    ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                    : <><Save size={14} />{form.is_blocked ? "Save & Lock All Clients" : "Save Config"}</>
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Gate Preview ──────────────────────────────────────────────────── */}
      <GatePreview config={form} />

      {/* ── Version Distribution + Config History ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VersionDistribution />
        <ConfigHistory refreshKey={historyKey} />
      </div>
    </div>
  );
}
