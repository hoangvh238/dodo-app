"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Upload, Link2, Image as ImageIcon, Play, X, Trash2,
  Eye, EyeOff, GripVertical, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  uploadGalleryItemAction,
  deleteGalleryItemAction,
  toggleGalleryItemAction,
  reorderGalleryItemAction,
  fetchGalleryItemsAction,
} from "./actions";

type UploadMode = "url" | "file";

interface GalleryItem {
  id: string;
  title: string | null;
  file_url: string;
  file_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const VIDEO_TYPES = ["mp4", "webm", "mov"];

function MediaThumb({ item }: { item: GalleryItem }) {
  const isVideo = VIDEO_TYPES.includes(item.file_type);
  return (
    <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
      {isVideo ? (
        <video src={item.file_url} muted className="w-full h-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.file_url} alt={item.title ?? ""} className="w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        {isVideo && (
          <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={10} className="text-white ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeroGalleryPage() {
  const [mode, setMode] = useState<UploadMode>("url");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const loadItems = () => {
    startTransition(async () => {
      setLoadingItems(true);
      const data = await fetchGalleryItemsAction();
      setItems(data as GalleryItem[]);
      setLoadingItems(false);
    });
  };

  useEffect(() => { loadItems(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = mode === "url" ? linkUrl.trim() : !!file;

  const handleUpload = () => {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("mode", mode);
    fd.append("title", title.trim());
    fd.append("sort_order", String(sortOrder));
    if (mode === "file" && file) fd.append("file", file);
    if (mode === "url") fd.append("linkUrl", linkUrl.trim());

    setStatus("idle"); setErrorMsg("");
    startTransition(async () => {
      try {
        await uploadGalleryItemAction(fd);
        setStatus("success");
        setFile(null); setTitle(""); setLinkUrl(""); setSortOrder(items.length);
        loadItems();
      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  };

  const handleDelete = (id: string, fileUrl: string) => {
    startTransition(async () => {
      await deleteGalleryItemAction(id, fileUrl);
      loadItems();
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleGalleryItemAction(id, !current);
      loadItems();
    });
  };

  const handleReorder = (id: string, order: number) => {
    startTransition(async () => {
      await reorderGalleryItemAction(id, order);
      loadItems();
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Hero Gallery</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          GIF / MP4 / images shown in the hero section of the homepage · auto-advances every 6s
        </p>
      </div>

      {/* Upload form */}
      <div className="bg-bg-card border border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center">
            <Upload size={14} className="text-brand" />
          </div>
          <h2 className="font-semibold text-slate-100 text-sm">Add Media</h2>
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
              <Link2 size={11} className="inline mr-1" />Direct URL (gif, mp4, webm, png, jpg…)
            </label>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://example.com/demo.gif"
              className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600" />
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
            style={{ cursor: file ? "default" : "pointer", padding: 24 }}
          >
            <input ref={fileRef} type="file" accept="image/*,video/*,.gif,.mp4,.webm"
              className="hidden" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  {VIDEO_TYPES.includes(file.name.split(".").pop()?.toLowerCase() ?? "")
                    ? <Play size={18} className="text-emerald-400 ml-0.5" />
                    : <ImageIcon size={18} className="text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 text-sm font-medium truncate">{file.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
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
                <p className="text-slate-300 text-sm font-medium">Drop media here</p>
                <p className="text-slate-500 text-xs mt-1">GIF · MP4 · WebM · PNG · JPG · WebP</p>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title (optional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="SnapAha — instant AI answer"
              className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Sort order</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full bg-bg-base border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30" />
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            {mode === "file" ? "Uploading…" : "Saving…"}
          </div>
        )}
        {status === "success" && !isPending && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} />Media added to gallery
          </div>
        )}
        {status === "error" && !isPending && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} />{errorMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleUpload} disabled={!canSubmit || isPending}
            className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors">
            <Upload size={14} />
            {isPending ? "Saving…" : "Add to Gallery"}
          </button>
        </div>
      </div>

      {/* Gallery list */}
      <div className="bg-bg-card border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100 text-sm">Gallery Items</h2>
          <span className="text-xs text-slate-500">{items.filter(i => i.is_active).length} active · {items.length} total</span>
        </div>

        {loadingItems ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No media yet — add a GIF or MP4 above.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {items.map(item => (
              <div key={item.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  item.is_active ? "hover:bg-bg-hover/40" : "opacity-50 hover:bg-bg-hover/30"
                }`}>
                <GripVertical size={14} className="text-slate-600 shrink-0 cursor-grab" />
                <MediaThumb item={item} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">
                    {item.title || <span className="text-slate-500 italic">No title</span>}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 truncate">{item.file_url}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                    {item.file_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Sort order input */}
                  <input
                    type="number"
                    defaultValue={item.sort_order}
                    onBlur={e => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v !== item.sort_order) handleReorder(item.id, v);
                    }}
                    className="w-14 bg-bg-base border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs text-center focus:outline-none focus:border-brand"
                    title="Sort order"
                  />
                  <button
                    onClick={() => handleToggle(item.id, item.is_active)}
                    title={item.is_active ? "Hide from homepage" : "Show on homepage"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.is_active
                        ? "text-emerald-400 hover:bg-emerald-950/30"
                        : "text-slate-600 hover:text-slate-400 hover:bg-slate-700/30"
                    }`}>
                    {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.file_url)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">
        Files uploaded via <strong className="text-slate-500">Upload File</strong> are saved to{" "}
        <code className="text-brand">public/media/gallery/</code> on the server.
        External URLs (Giphy, Imgur, CDN) work too.
      </p>
    </div>
  );
}
