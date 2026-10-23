import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Camera, Buildings, MagnifyingGlass } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useT, useToggleLang } from "../../i18n";
import { Avatar, Chip, Input } from "../../ui/primitives";
import { Item, Stagger, Tilt, spring } from "../../ui/motion";
import { Logo } from "../../app/shell";
import { ROLES, ROLE_PERMISSIONS } from "../../domain/permissions";
import type { Role, Seat } from "../../domain/types";
import { Translate } from "@phosphor-icons/react";

export function Login() {
  const t = useT();
  const s = useStore();
  const dispatch = useDispatch();
  const nav = useNavigate();
  const toggle = useToggleLang();
  const loc = useLocation() as { state?: { from?: string; seat?: Seat } };
  const [seat, setSeat] = useState<Seat | null>(loc.state?.seat ?? null);
  const [q, setQ] = useState("");
  const creators = useMemo(() => s.creators.filter((c) => `${c.name} ${c.handle} ${c.city}`.toLowerCase().includes(q.toLowerCase())), [s.creators, q]);

  const go = (target: Seat, extra: { creatorId?: string; role?: Role }) => {
    dispatch({ type: "signIn", seat: target, ...extra });
    const from = loc.state?.from;
    nav(from && from.startsWith(target === "creator" ? "/creator" : "/admin") ? from : target === "creator" ? "/creator" : "/admin");
  };

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <Link to="/"><Logo /></Link>
        <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={15} weight="bold" />{t("language")}</button>
      </header>
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-6 md:pt-14">
        <AnimatePresence mode="wait">
          {!seat ? (
            <motion.div key="seat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <h1 className="text-4xl md:text-5xl">{t("loginTitle")}</h1>
              <p className="mt-3 max-w-[50ch] text-ink-2">{t("loginSub")}</p>
              <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
                <Item>
                  <Tilt className="rounded-[var(--radius-card)]">
                    <button onClick={() => setSeat("creator")} className="label-card lift flex h-full w-full flex-col items-start gap-10 p-7 text-start">
                      <span className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-lime text-plum border-2 border-outline"><Camera size={28} weight="duotone" /></span>
                      <span>
                        <span className="block text-2xl font-semibold">{t("creatorSeat")}</span>
                        <span className="mt-2 block text-[15px] text-ink-2">{t("loginCreatorBody")}</span>
                      </span>
                    </button>
                  </Tilt>
                </Item>
                <Item>
                  <Tilt className="rounded-[var(--radius-card)]">
                    <button onClick={() => setSeat("brand")} className="label-card lift flex h-full w-full flex-col items-start gap-10 p-7 text-start">
                      <span className="flex h-14 w-14 items-center justify-center rounded-[12px] bg-marigold text-marigold-ink"><Buildings size={28} weight="duotone" /></span>
                      <span>
                        <span className="block text-2xl font-semibold">{t("brandSeat")}</span>
                        <span className="mt-2 block text-[15px] text-ink-2">{t("loginBrandBody")}</span>
                      </span>
                    </button>
                  </Tilt>
                </Item>
              </Stagger>
              <p className="mt-8 text-[13px] text-ink-3">{t("demoNote")} {t("newHere")} <Link to="/join" className="font-medium text-leaf underline-offset-4 hover:underline">{t("joinSquad")}</Link></p>
            </motion.div>
          ) : seat === "creator" ? (
            <motion.div key="creator" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <button onClick={() => setSeat(null)} className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("back")}</button>
              <h1 className="text-3xl md:text-4xl">{t("pickCreator")}</h1>
              <div className="relative mt-6 max-w-sm">
                <MagnifyingGlass size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-10" autoFocus />
              </div>
              <Stagger className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" gap={0.03}>
                {creators.map((c) => (
                  <Item key={c.id}>
                    <button onClick={() => go("creator", { creatorId: c.id })} className="label-card lift flex w-full items-center gap-3 p-3 text-start">
                      <Avatar name={c.name} hue={c.hue} size={40} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14.5px] font-medium">{c.name}</span>
                        <span className="block truncate text-[12.5px] text-ink-3">@{c.handle} · {c.city}</span>
                      </span>
                    </button>
                  </Item>
                ))}
              </Stagger>
            </motion.div>
          ) : (
            <motion.div key="brand" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring}>
              <button onClick={() => setSeat(null)} className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("back")}</button>
              <h1 className="text-3xl md:text-4xl">{t("pickRole")}</h1>
              <Stagger className="mt-6 grid gap-3 sm:grid-cols-2" gap={0.05}>
                {ROLES.map((r) => {
                  const user = s.brandUsers.find((u) => u.role === r);
                  return (
                    <Item key={r}>
                      <button onClick={() => go("brand", { role: r })} className="label-card lift flex w-full flex-col gap-3 p-5 text-start">
                        <span className="flex items-center gap-3">
                          {user && <Avatar name={user.name} hue={210 + ROLES.indexOf(r) * 25} size={36} />}
                          <span>
                            <span className="block text-[15px] font-semibold">{t(`role_${r}` as const)}</span>
                            {user && <span className="block text-[12.5px] text-ink-3">{user.name}</span>}
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-1.5">
                          {ROLE_PERMISSIONS[r].map((p) => <Chip key={p} tone="leaf" className="h-6 text-[11.5px]">{t(`perm_${p}` as const)}</Chip>)}
                        </span>
                      </button>
                    </Item>
                  );
                })}
              </Stagger>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
