import { RefreshCw } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-bg-card shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-slate-400">Live</span>
      </div>
      <form action="/" method="get">
        <button
          type="submit"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </form>
    </header>
  );
}
