"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "⊞" },
  { href: "/media", label: "Media Library", icon: "◎" },
  { href: "/schedules", label: "Schedules", icon: "◷" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [screenCount, setScreenCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/screens")
      .then((r) => r.json())
      .then((data) => setScreenCount(data.length))
      .catch(() => {});
  }, [pathname]);

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg text-sidebar-fg flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">SignageControl</h1>
        <p className="text-xs text-white/50 mt-1">Digital Signage Manager</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-3">
        <p className="text-xs text-white/40">
          {screenCount !== null ? `${screenCount} Screen${screenCount !== 1 ? "s" : ""}` : "Loading..."}
        </p>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
          }}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
