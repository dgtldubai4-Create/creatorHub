import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CaretDown, Compass, Gift, House, Leaf, Megaphone, Package, Path, SealCheck, SignOut, Sparkle, Translate, Users, ArrowsClockwise, Coins, ListChecks, PlayCircle, MapTrifold } from "@phosphor-icons/react";
import { useDispatch, useReset, useStore } from "./store";
import { useT, useToggleLang } from "../i18n";
import { Avatar } from "../ui/primitives";
import { cn } from "../ui/cn";
import { spring, springSnappy } from "../ui/motion";
import { ROLES, can } from "../domain/permissions";
import { unreadCount } from "../domain/selectors";
import type { Permission, Role, Seat } from "../domain/types";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  const t = useT();
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="leaf-shape flex h-8 w-8 items-center justify-center bg-leaf text-white">
        <Leaf size={16} weight="fill" />
      </span>
      {!compact && <span className="text-[17px]">{t("appName")}</span>}
    </span>
  );
}

function SeatSwitch() {
  const t = useT();
  const { session } = useStore();
  const dispatch = useDispatch();
  const set = (seat: Seat) => {
    if (seat === session.seat) return;
    dispatch({ type: "switchSeat", seat });
  };
  return (
    <div className="relative inline-flex rounded-full bg-surface-2 p-1" role="tablist" aria-label={t("switchSeat")}>
      {(["creator", "brand"] as Seat[]).map((s) => (
        <button key={s} role="tab" aria-selected={session.seat === s} onClick={() => set(s)} className={cn("relative z-10 h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors", session.seat === s ? "text-ink" : "text-ink-2 hover:text-ink")}>
          {session.seat === s && <motion.span layoutId="seat-pill" className="absolute inset-0 -z-10 rounded-full bg-surface shadow-card" transition={springSnappy} />}
          {s === "creator" ? t("creatorSeat") : t("brandSeat")}
        </button>
      ))}
    </div>
  );
}

function RoleSwitch() {
  const t = useT();
  const { session } = useStore();
  const dispatch = useDispatch();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("role")}</span>
      <select value={session.role} onChange={(e) => dispatch({ type: "setRole", role: e.target.value as Role })} className="h-9 cursor-pointer appearance-none rounded-full border border-line-2 bg-surface pe-8 ps-3.5 text-[13px] font-medium hover:border-ink-3">
        {ROLES.map((r) => (
          <option key={r} value={r}>{t(`role_${r}` as const)}</option>
        ))}
      </select>
      <CaretDown size={13} weight="bold" className="pointer-events-none absolute end-3 text-ink-3" />
    </label>
  );
}

function LangToggle() {
  const t = useT();
  const toggle = useToggleLang();
  return (
    <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-full border border-line-2 bg-surface px-3 text-[13px] font-medium hover:border-ink-3" aria-label={t("language")}>
      <Translate size={15} weight="bold" />
      {t("language")}
    </button>
  );
}

function Bellicon({ audience, to }: { audience: string; to: string }) {
  const t = useT();
  const state = useStore();
  const n = unreadCount(state, audience);
  return (
    <NavLink to={to} className={({ isActive }) => cn("relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink", isActive && "bg-surface-2 text-ink")} aria-label={t("notifications")}>
      <Bell size={20} weight={n ? "fill" : "regular"} />
      {n > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring} className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-marigold px-1 text-[11px] font-bold text-marigold-ink">{n}</motion.span>}
    </NavLink>
  );
}

function UserMenu({ name, hue, profileTo }: { name: string; hue: number; profileTo?: string }) {
  const t = useT();
  const dispatch = useDispatch();
  const reset = useReset();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="press flex items-center gap-2 rounded-full p-0.5 pe-2 hover:bg-surface-2" aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={name} hue={hue} size={32} />
        <CaretDown size={12} weight="bold" className="text-ink-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={springSnappy} className="card absolute end-0 top-full z-40 mt-2 w-56 overflow-hidden p-1.5">
            <div className="px-3 py-2 text-[13px] font-medium">{name}</div>
            {profileTo && <MenuItem icon={<SealCheck size={16} />} onClick={() => { setOpen(false); nav(profileTo); }}>{t("profile")}</MenuItem>}
            <MenuItem icon={<ArrowsClockwise size={16} />} onClick={() => { if (window.confirm(t("resetConfirm"))) { reset(); setOpen(false); nav("/"); } }}>{t("resetDemo")}</MenuItem>
            <MenuItem icon={<SignOut size={16} />} onClick={() => { dispatch({ type: "signOut" }); setOpen(false); nav("/"); }}>{t("signOut")}</MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13.5px] text-ink-2 hover:bg-surface-2 hover:text-ink">
      {icon}
      {children}
    </button>
  );
}

interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean; permission?: Permission | null }

function TopNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="hide-scrollbar flex items-center gap-0.5 overflow-x-auto" aria-label="Primary">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cn("relative flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13.5px] font-medium transition-colors", isActive ? "text-ink" : "text-ink-2 hover:text-ink")}>
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-surface-2" transition={springSnappy} />}
              {it.icon}
              {it.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function BottomTabs({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Primary">
      <div className="flex justify-around">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium", isActive ? "text-leaf" : "text-ink-3")}>
            {it.icon}
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Frame({ children, nav, bottom }: { children: ReactNode; nav: ReactNode; bottom?: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-6">{nav}</div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 md:px-6 md:pb-16 md:pt-8">
        {/* Enter-only transition keyed by section. An exit animation around an Outlet would
            keep rendering the new route inside the exiting element, so there is none. */}
        <motion.div key={location.pathname.split("/").slice(0, 3).join("/")} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </main>
      {bottom}
    </div>
  );
}

export function CreatorShell() {
  const t = useT();
  const state = useStore();
  const creator = state.creators.find((c) => c.id === state.session.creatorId) ?? state.creators[0];
  const items: NavItem[] = [
    { to: "/creator", label: t("home"), icon: <House size={18} weight="duotone" />, end: true },
    { to: "/creator/invitations", label: t("invitations"), icon: <Sparkle size={18} weight="duotone" /> },
    { to: "/creator/campaigns", label: t("campaigns"), icon: <Path size={18} weight="duotone" /> },
    { to: "/creator/side-quests", label: t("sideQuests"), icon: <Compass size={18} weight="duotone" /> },
    { to: "/creator/rewards", label: t("rewards"), icon: <Gift size={18} weight="duotone" /> },
  ];
  return (
    <Frame
      nav={
        <>
          <NavLink to="/creator" className="shrink-0"><Logo compact /></NavLink>
          <div className="hidden md:block"><TopNav items={items} /></div>
          <div className="ms-auto flex items-center gap-2">
            <div className="hidden sm:block"><SeatSwitch /></div>
            <LangToggle />
            <Bellicon audience={`creator:${creator.id}`} to="/creator/notifications" />
            <UserMenu name={creator.name} hue={creator.hue} profileTo="/creator/profile" />
          </div>
        </>
      }
      bottom={<BottomTabs items={items} />}
    >
      <Outlet />
    </Frame>
  );
}

export function AdminShell() {
  const t = useT();
  const state = useStore();
  const user = state.brandUsers.find((u) => u.id === state.session.brandUserId) ?? state.brandUsers[0];
  const role = state.session.role;
  const all: NavItem[] = [
    { to: "/admin", label: t("overview"), icon: <MapTrifold size={18} weight="duotone" />, end: true, permission: null },
    { to: "/admin/campaigns", label: t("campaigns"), icon: <Megaphone size={18} weight="duotone" />, permission: "campaigns" },
    { to: "/admin/creators", label: t("creators"), icon: <Users size={18} weight="duotone" />, permission: "invite" },
    { to: "/admin/review", label: t("review"), icon: <PlayCircle size={18} weight="duotone" />, permission: "review" },
    { to: "/admin/logistics", label: t("logistics"), icon: <Package size={18} weight="duotone" />, permission: "logistics" },
    { to: "/admin/loyalty", label: t("loyalty"), icon: <Coins size={18} weight="duotone" />, permission: "loyalty" },
    { to: "/admin/products", label: t("products"), icon: <ListChecks size={18} weight="duotone" />, permission: "products" },
  ];
  const items = all.filter((it) => !it.permission || can(role, it.permission));
  return (
    <Frame
      nav={
        <>
          <NavLink to="/admin" className="shrink-0"><Logo compact /></NavLink>
          <div className="hidden lg:block"><TopNav items={items} /></div>
          <div className="ms-auto flex items-center gap-2">
            <div className="hidden sm:block"><SeatSwitch /></div>
            <RoleSwitch />
            <div className="hidden md:block"><LangToggle /></div>
            <Bellicon audience="brand" to="/admin/notifications" />
            <UserMenu name={user.name} hue={210} />
          </div>
        </>
      }
      bottom={<BottomTabs items={items.slice(0, 5)} />}
    >
      <div className="mb-4 lg:hidden"><TopNav items={items} /></div>
      <Outlet />
    </Frame>
  );
}
