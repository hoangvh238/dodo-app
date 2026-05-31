"use client";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/admin":                "Overview",
  "/admin/users":          "Users",
  "/admin/sessions":       "Sessions",
  "/admin/events":         "Events",
  "/admin/map":            "Live Map",
  "/admin/releases":       "Releases",
  "/admin/version-config": "Version Control",
};

export default function Header() {
  const router    = useRouter();
  const pathname  = usePathname();
  const [loading, setLoading] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === pathname || (path !== "/admin" && pathname.startsWith(path))
  )?.[1] ?? "Dashboard";

  function handleRefresh() {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <header className="flex items-center justify-between px-6 h-12 border-b border-white/[0.06] bg-[#0d0d1a]/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-slate-500">Live</span>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </header>
  );
}
