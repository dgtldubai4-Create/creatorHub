"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Home,
  Leaf,
  LogOut,
  Rocket,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/constants";

const LINKS: Array<{ href: string; label: string; icon: typeof Home; roles: Role[] }> = [
  { href: "/", label: "Dashboard", icon: Home, roles: ["CREATOR", "MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/launches", label: "Open Launches", icon: Rocket, roles: ["CREATOR", "MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/submit", label: "Submit Asset", icon: Send, roles: ["CREATOR"] },
  { href: "/me", label: "My Status", icon: UserRound, roles: ["CREATOR"] },
  { href: "/queue", label: "Approval Queue", icon: ClipboardCheck, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/creators", label: "Creator Directory", icon: Users, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
];

const ROLE_BADGES: Record<Role, string> = {
  CREATOR: "Creator",
  MARKETER: "Marketer",
  BRAND_LEAD: "Brand Lead",
  ADMIN: "Admin",
};

export function Nav({
  role,
  name,
  region,
  pendingCount,
}: {
  role: Role;
  name: string;
  region: string | null;
  pendingCount?: number;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 hero-surface shadow-lg shadow-dabur-950/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-lg shadow-dabur-500/40 transition-transform group-hover:scale-110 group-hover:rotate-6">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold tracking-wide text-white">Dabur</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-dabur-200">
              Creator Hub
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-white" : "text-dabur-200/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/15 ring-1 ring-white/20"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden md:inline">{link.label}</span>
                {link.href === "/queue" && !!pendingCount && (
                  <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold text-amber-950">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight lg:block">
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-[11px] text-dabur-200">
              {ROLE_BADGES[role]}
              {region ? ` · ${region}` : ""}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-sm font-bold text-amber-950 ring-2 ring-white/25">
            {initials(name)}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-dabur-200 transition-colors hover:bg-white/10 hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
