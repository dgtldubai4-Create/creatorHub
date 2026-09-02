"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BarChart3,
  ClipboardCheck,
  GraduationCap,
  Home,
  Leaf,
  LogOut,
  PanelsTopLeft,
  Rocket,
  Trophy,
  UserRound,
  Users,
  Wallet,
  Gift,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/lib/constants";
import { NotificationBell, type NotificationItem } from "@/components/notification-bell";
import { MilesChip } from "@/components/game/miles-chip";
import type { ProgramTier } from "@/lib/program";

const LINKS: Array<{ href: string; label: string; icon: typeof Home; roles: Role[] }> = [
  // Creator side
  { href: "/", label: "Home", icon: Home, roles: ["CREATOR", "MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/launches", label: "Campaigns", icon: Rocket, roles: ["CREATOR"] },
  { href: "/academy", label: "Academy", icon: GraduationCap, roles: ["CREATOR"] },
  { href: "/rewards", label: "Shop", icon: Gift, roles: ["CREATOR"] },
  { href: "/earnings", label: "Earnings", icon: Wallet, roles: ["CREATOR"] },
  { href: "/leaderboard", label: "Stars", icon: Trophy, roles: ["CREATOR"] },
  { href: "/me", label: "My Work", icon: UserRound, roles: ["CREATOR"] },
  // Brand side (admin panel)
  { href: "/admin", label: "Admin", icon: PanelsTopLeft, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/admin/campaigns", label: "Campaigns", icon: Rocket, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/queue", label: "Control Room", icon: ClipboardCheck, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/creators", label: "Creators", icon: Users, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/admin/shop", label: "Shop", icon: Gift, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
  { href: "/insights", label: "Insights", icon: BarChart3, roles: ["MARKETER", "BRAND_LEAD", "ADMIN"] },
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
  notifications,
  tier,
  points,
}: {
  role: Role;
  name: string;
  region: string | null;
  pendingCount?: number;
  notifications: NotificationItem[];
  tier?: Pick<ProgramTier, "label" | "emoji"> | null;
  points?: number;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.roles.includes(role));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 shadow-[0_6px_20px_-14px_rgba(36,31,20,0.3)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-md shadow-dabur-500/30 transition-transform duration-200 ease-out-strong group-hover:scale-110 group-hover:rotate-6">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-game text-sm font-bold tracking-wide text-dabur-800">DaburStars</span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Creator Hub
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto" aria-label="Main">
          {links.map((link) => {
            // "/" and "/admin" are exact matches so nested routes light up
            // their own tab instead of two pills at once.
            const active =
              link.href === "/" || link.href === "/admin"
                ? pathname === link.href
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 font-game text-sm font-bold transition-colors",
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-dabur-800",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-dabur-600"
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden lg:inline">{link.label}</span>
                {link.href === "/queue" && !!pendingCount && (
                  <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-tang px-1 font-game text-[11px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {typeof points === "number" && tier && (
            <Link href="/leaderboard" title={`${tier.label} class`} className="press hidden md:block">
              <MilesChip miles={points} suffix={tier.emoji} />
            </Link>
          )}
          <NotificationBell items={notifications} />
          <div className="hidden text-right leading-tight xl:block">
            <p className="text-sm font-semibold text-dabur-900">{name}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {ROLE_BADGES[role]}
              {region ? ` · ${region}` : ""}
              {tier ? ` · ${tier.label}` : ""}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mango to-tang font-game text-sm font-bold text-white ring-2 ring-tang-soft">
            {initials(name)}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="press rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-dabur-800"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
