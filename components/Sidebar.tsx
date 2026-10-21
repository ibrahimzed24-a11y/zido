"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, MessagesSquare, Settings, Sparkles } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/agents", label: "My Agents", icon: Bot },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ name, plan }: { name: string; plan: string }) {
  const path = usePathname() ?? "";
  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-black/40 p-6">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-zido-400" /> Zido
      </Link>
      <nav className="mt-10 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                active ? "bg-zido-600/20 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10 rounded-xl border border-white/10 p-3 text-xs text-neutral-400">
        <p className="text-neutral-200">{name}</p>
        <p>{plan} plan</p>
      </div>
    </aside>
  );
}
