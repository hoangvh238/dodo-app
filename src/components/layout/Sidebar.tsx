"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Activity, Users, LogOut, Package, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/map", label: "Live Map", icon: Globe },
  { href: "/admin/events", label: "Events", icon: Activity },
  { href: "/admin/sessions", label: "Sessions", icon: Users },
  { href: "/admin/releases", label: "Releases", icon: Package },
  { href: "/admin/version-config", label: "Version Control", icon: ShieldAlert },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 flex flex-col bg-bg-card border-r border-slate-700 shrink-0">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-brand/20 flex items-center justify-center">
            <span className="text-brand text-xs font-bold">D</span>
          </div>
          <div>
            <p className="font-semibold text-slate-100 text-sm leading-tight">DoDo</p>
            <p className="text-xs text-slate-400">Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-brand/15 text-brand font-medium"
                  : "text-slate-400 hover:text-slate-100 hover:bg-bg-hover"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
