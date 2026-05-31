"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, Activity, Users, LogOut,
  Package, ShieldAlert, UserCircle2, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Analytics",
    items: [
      { href: "/admin",          label: "Overview",        icon: LayoutDashboard },
      { href: "/admin/users",    label: "Users",           icon: UserCircle2 },
      { href: "/admin/sessions", label: "Sessions",        icon: Users },
      { href: "/admin/events",   label: "Events",          icon: Activity },
      { href: "/admin/map",      label: "Live Map",        icon: Globe },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/releases",       label: "Releases",        icon: Package },
      { href: "/admin/version-config", label: "Version Control", icon: ShieldAlert },
    ],
  },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-indigo-500/15 text-indigo-300 font-medium"
          : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
      )}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
    </Link>
  );
}

export default function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r border-white/[0.06] bg-[#0d0d1a]">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm leading-tight">DoDo</p>
            <p className="text-[10px] text-slate-500 tracking-wide uppercase">Analytics</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Live badge + sign out */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-slate-500">Live tracking active</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
        >
          <LogOut size={15} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
