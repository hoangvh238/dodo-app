"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Upload, Tag, Package, X, CheckCircle2, AlertCircle,
  Download, Trash2, Clock, Link2, HardDrive, Zap,
} from "lucide-react";
import {
  publishReleaseAction,
  deleteReleaseAction,
  fetchReleasesAction,
  promoteReleaseAction,
} from "./actions";

type Platform = "ios" | "android" | "windows" | "macos" | "web";
type ReleaseChannel = "stable" | "beta" | "alpha";
type UploadMode = "url" | "file";

interface Release {
  id: string;
  version: string;
  platform: Platform;
  channel: ReleaseChannel;
  file_name: string;
  file_size: number;
  file_url: string;
  release_notes: string;
  created_at: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iOS", android: "Android", windows: "Windows", macos: "macOS", web: "Web",
};
const PLATFORM_ICONS: Record<Platform, string> = {
  ios: "🍎", android: "🤖", windows: "🪟", macos: "💻", web: "🌐",
};
const CHANNEL_COLORS: Record<ReleaseChannel, string> = {
  stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  alpha: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function guessFileName(url: string): string {
  try { return decodeURIComponent(new URL(url).pathname.split("/").pop() || url); }
  catch { return url; }
}

export default function ReleasesPage() {
  const [mode, setMode] = useState<UploadMode>("url");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState<Platform>("windows");
  const [channel, setChannel] = useState<ReleaseChannel>("stable");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [promotedId, setPromotedId] = useState<string | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const loadReleases = () => {
    startTransition(async () => {
      setLoadingReleases(true);
      const data = await fetchReleasesAction();
      setReleases(data as Release[]);
      setLoadingReleases(false);
    });
  };

  useEffect(() => { loadReleases(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = version.trim() && (mode === "url" ? linkUrl.trim() : !!file);

  const handlePublish = () => {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("version", version.trim());
    fd.append("platform", platform);
    fd.append("channel", channel);
    fd.append("notes", notes.trim());
    fd.append("mode", mode);
    if (mode === "file" && file) fd.append("file", file);
    if (mode === "url") fd.append("linkUrl", linkUrl.trim());

    setStatus("idle"); setErrorMsg("");
    startTransition(async () => {
      try {
        await publishReleaseAction(fd);
        setStatus("success");
        setFile(null); setVersion(""); setNotes(""); setLinkUrl("");
        loadReleases();
      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Publish failed.");
      }
    });
  };

  const handleDelete = (id: string, fileUrl: string) => {
    startTransition(async () => {
      await deleteReleaseAction(id, fileUrl);
      loadReleases();
    });
  };

  const handlePromote = (id: string) => {
    startTransition(async () => {
      try {
        await promoteReleaseAction(id);
        setPromotedId(id);
        setTimeout(() => setPromotedId(null), 3000);
      } catch {
        // silently ignore — version-config page will show the error
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Releases</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Upload builds server-side or link external URLs — tag version for distribution
        </p>
      </div>

      {/* Storage info */}
      <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm">
        <HardDrive size={15} className="text-slate-300 shrink-0" />
        <span className="text-slate-400">
          Files uploaded via <span className="text-slate-200 font-medium">Upload File</span> mode
          are saved to <code className="text-brand text-xs">public/releases/</code> on this server
          and served directly — no bucket, no cost.
          For external URLs use <span className="text-slate-200 font-medium">Link URL</span> mode.
        </span>
      </div>

      {/* Form */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Upload size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">New Release</h2>
          <span className="ml-auto text-xs text-slate-500">Saved to public/releases/ on server</span>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-lg w-fit"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.8)" }}>
          {(["url", "file"] as UploadMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === m ? "bg-brand text-white" : "text-slate-400 hover:text-slate-200"
              }`}>
              {m === "url" ? <Link2 size={12} /> : <Upload size={12} />}
              {m === "url" ? "Link URL" : "Upload File"}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Link2 size={11} className="inline mr-1" />Direct download URL
            </label>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://github.com/hoangvh238/dodo-releases/releases/download/v1.0.0/DoDo-Setup.exe"
              className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600" />
            <p className="text-xs text-slate-500 mt-1.5">GitHub Releases, Cloudflare R2, S3, or any public URL.</p>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
              dragging ? "border-brand bg-brand/5"
              : file ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-slate-700 hover:border-slate-600 bg-bg-base/50"
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => !file && fileRef.current?.click()}
            style={{ cursor: file ? "default" : "pointer", padding: 28 }}
          >
            <input ref={fileRef} type="file" className="hidden"
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Package size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{file.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{formatBytes(file.size)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-bg-hover mx-auto mb-3 flex items-center justify-center">
                  <Upload size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-300 text-sm font-medium">Drop your file here</p>
                <p className="text-slate-500 text-xs mt-1">.exe · .dmg · .apk · .ipa · .zip · any size</p>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Tag size={11} className="inline mr-1" />Version
            </label>
            <input type="text" value={version} onChange={e => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Platform</label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    platform === p ? "bg-brand text-white"
                    : "bg-bg-base border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}>
                  {PLATFORM_ICONS[p]} {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Channel</label>
            <div className="flex gap-1.5">
              {(["stable", "beta", "alpha"] as ReleaseChannel[]).map(c => (
                <button key={c} onClick={() => setChannel(c)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                    channel === c ? CHANNEL_COLORS[c]
                    : "bg-bg-base border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Release Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="What's new in this version..." rows={3}
            className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600 resize-none" />
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            {mode === "file" ? "Uploading via server…" : "Saving record…"}
          </div>
        )}
        {status === "success" && !isPending && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} />Release published successfully
          </div>
        )}
        {status === "error" && !isPending && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />{errorMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handlePublish} disabled={!canSubmit || isPending}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
            {mode === "url" ? <Link2 size={14} /> : <Upload size={14} />}
            {isPending ? "Publishing…" : "Publish Release"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100 text-sm">Published Releases</h2>
          <span className="text-xs text-slate-500">{releases.length} total</span>
        </div>
        {loadingReleases ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No releases yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Version", "Platform", "Channel", "File", "Size", "Date", "Active", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {releases.map(r => (
                <tr key={r.id} className="hover:bg-bg-hover/50 transition-colors group">
                  <td className="px-5 py-3.5 font-mono text-slate-100 font-medium text-xs">v{r.version}</td>
                  <td className="px-5 py-3.5 text-slate-300">{PLATFORM_ICONS[r.platform]} {PLATFORM_LABELS[r.platform]}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${CHANNEL_COLORS[r.channel]}`}>
                      {r.channel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-[160px] truncate">
                    {r.file_name || guessFileName(r.file_url)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{formatBytes(r.file_size)}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(r.created_at)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {promotedId === r.id ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 size={11} /> Promoted
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePromote(r.id)}
                        disabled={isPending}
                        title="Set as active version in manifest"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 border border-slate-700 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all disabled:opacity-40"
                      >
                        <Zap size={11} /> Set Active
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={r.file_url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors">
                        <Download size={13} />
                      </a>
                      <button onClick={() => handleDelete(r.id, r.file_url)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
