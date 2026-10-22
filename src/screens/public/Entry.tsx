import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Coins, Leaf, GameController, GraduationCap, Gift, Lightning, Crown, Check, Translate, Package } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useL, useT, useToggleLang } from "../../i18n";
import { Button } from "../../ui/primitives";
import { Float, Magnetic, Reveal, Tilt, Item, Stagger } from "../../ui/motion";
import { ProductArt } from "../../ui/ProductArt";
import { JourneyTrail, PhaseTrail } from "../../ui/JourneyTrail";
import { ArtSlot } from "../../ui/ArtSlot";
import { Graphic } from "../../ui/Graphic";
import { RotatingWord, Sparks } from "../../ui/Kinetic";
import { Logo } from "../../app/shell";
import { BrandMark, StageChip } from "../shared/bits";
import { LEVEL_ORDER, LEVEL_RULES } from "../../domain/selectors";
import { STAGES } from "../../domain/stages";
import { cn } from "../../ui/cn";

export function Entry() {
  const t = useT();
  const L = useL();
  const s = useStore();
  const toggle = useToggleLang();
  const brandOf = (id: string) => s.brands.find((b) => b.id === id);
  const heroProducts = ["vatika-black-seed-hair-oil", "dabur-amla-hair-oil", "dabur-herbl-charcoal-toothpaste", "real-mango-juice", "dabur-honey"].map((id) => s.products.find((p) => p.id === id)!).filter(Boolean);
  const demo = s.participations.find((p) => p.id === "pt_blackseed30_laylaoils") ?? s.participations[0];
  const signedIn = s.session.seat;
  const marquee = [...s.products, ...s.products];
  const words = t("heroWords").split("|");

  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* Hero band: forest green, kinetic headline, sticker cloud */}
      <section className="relative overflow-hidden bg-forest text-white">
        <Sparks count={16} />
        <header className="relative z-10 mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Logo className="text-white" />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-white/85 hover:bg-white/10 hover:text-white"><Translate size={15} weight="bold" />{t("language")}</button>
            <Button size="sm" variant="accent" to={signedIn ? (signedIn === "creator" ? "/creator" : "/admin") : "/login"}>{signedIn ? t("continue") : t("signIn")}</Button>
          </div>
        </header>
        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-20 pt-8 md:grid-cols-12 md:px-6 md:pt-14 lg:pb-28">
          <div className="md:col-span-6 lg:col-span-6">
            <Reveal inView={false}>
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="sticker bg-lime text-lime-ink" style={{ ["--tilt" as string]: "-4deg" }}><Leaf size={14} weight="fill" />{t("noMinimum")}</span>
                <span className="sticker bg-marigold text-marigold-ink" style={{ ["--tilt" as string]: "3deg" }}>{t("sixMarkets")}</span>
              </div>
            </Reveal>
            <Reveal inView={false} delay={0.06}>
              <h1 className="text-[2.75rem] font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                {t("heroLine1")} <RotatingWord words={words} className="text-lime" /> <span className="text-marigold">{t("heroLine2")}</span>
              </h1>
            </Reveal>
            <Reveal inView={false} delay={0.14}>
              <p className="mt-6 max-w-[40ch] text-lg text-white/80">{t("heroSub")}</p>
            </Reveal>
            <Reveal inView={false} delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic><Button size="lg" variant="accent" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
                <Button size="lg" variant="ghost" className="text-white/85 hover:bg-white/10 hover:text-white" to="/login">{t("heroSecondary")}</Button>
              </div>
            </Reveal>
          </div>
          <div className="relative md:col-span-6">
            <div className="relative mx-auto aspect-[5/4] w-full max-w-[620px]">
              <div className="blob absolute inset-[8%] bg-marigold opacity-90" />
              <div className="blob absolute inset-[22%] bg-lime opacity-80 [animation-delay:-5s]" />
              {heroProducts.map((p, i) => {
                const spots = [
                  { left: "4%", top: "8%", w: "34%", r: -9 },
                  { left: "40%", top: "-2%", w: "30%", r: 6 },
                  { left: "64%", top: "34%", w: "33%", r: 10 },
                  { left: "8%", top: "52%", w: "30%", r: 7 },
                  { left: "38%", top: "42%", w: "28%", r: -5 },
                ][i];
                return (
                  <motion.div key={p.id} className="absolute" style={{ left: spots.left, top: spots.top, width: spots.w }} initial={{ opacity: 0, y: 40, rotate: spots.r - 8, scale: 0.85 }} animate={{ opacity: 1, y: 0, rotate: spots.r, scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 16, delay: 0.2 + i * 0.09 }}>
                    <Float delay={i * 0.6} amplitude={7 + i} duration={4 + i * 0.4}>
                      <Tilt max={12} className="rounded-2xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)]">
                        <ProductArt product={p} brand={brandOf(p.brandId)} size="lg" className="rounded-2xl ring-4 ring-white/90" />
                      </Tilt>
                    </Float>
                  </motion.div>
                );
              })}
              <motion.div className="absolute -bottom-3 left-[0%] flex items-center gap-3 rounded-2xl bg-white p-3 pe-4 text-ink shadow-float" initial={{ opacity: 0, y: 20, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: -4 }} transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 18 }}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marigold text-marigold-ink"><Coins size={18} weight="fill" /></span>
                <div>
                  <div className="text-[13px] font-bold">+900 {t("sparks")}</div>
                  <PhaseTrail stage="points_released" size="sm" />
                </div>
              </motion.div>
              <motion.div className="absolute -top-2 right-[2%] flex items-center gap-2 rounded-2xl bg-white p-2.5 pe-3.5 text-ink shadow-float" initial={{ opacity: 0, y: -20, rotate: 5 }} animate={{ opacity: 1, y: 0, rotate: 5 }} transition={{ delay: 0.95, type: "spring", stiffness: 200, damping: 18 }}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Package size={16} weight="fill" /></span>
                <StageChip stage="out_for_delivery" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* The trail */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("howTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("howSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="card mt-10 p-4 md:p-6">
            <JourneyTrail participation={demo} />
            <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              {STAGES.filter((st) => !["changes_requested", "revised_cut", "auto_check"].includes(st)).map((st) => (
                <StageChip key={st} stage={st} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pillars: three colour blocks, one tall */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal>
          <h2 className="text-3xl md:text-5xl">{t("pillarsTitle")}</h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-5">
          <Item className="md:col-span-3 md:row-span-2">
            <div className="lift relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[var(--radius-card)] bg-forest p-7 text-white md:p-9">
              <div className="pattern-dots absolute inset-0 text-lime/20" />
              <GameController size={40} weight="duotone" className="relative text-lime" />
              <div className="relative">
                <h3 className="text-3xl font-extrabold md:text-4xl">{t("pillar_play")}</h3>
                <p className="mt-3 max-w-[46ch] text-[16px] text-white/80">{t("pillar_play_body")}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(["starter", "monthly", "team", "event", "referral"] as const).map((k, i) => <span key={k} className={cn("sticker", i % 2 ? "bg-lime text-lime-ink" : "bg-marigold text-marigold-ink")} style={{ ["--tilt" as string]: `${(i % 3) * 3 - 3}deg` }}>{t(`mt_${k}` as const)}</span>)}
                  <span className="sticker bg-white text-forest" style={{ ["--tilt" as string]: "4deg" }}><Lightning size={14} weight="fill" />{t("doubleSparks")}</span>
                </div>
              </div>
            </div>
          </Item>
          <Item className="md:col-span-2">
            <div className="lift relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[var(--radius-card)] bg-marigold p-7 text-marigold-ink">
              <div className="pattern-stripes absolute inset-0 text-marigold-ink/10" />
              <GraduationCap size={36} weight="duotone" className="relative" />
              <div className="relative">
                <h3 className="text-3xl font-extrabold">{t("pillar_grow")}</h3>
                <p className="mt-2 text-[15px] opacity-85">{t("pillar_grow_body")}</p>
              </div>
            </div>
          </Item>
          <Item className="md:col-span-2">
            <div className="lift relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[var(--radius-card)] bg-lime p-7 text-lime-ink">
              <div className="pattern-waves absolute inset-0 text-lime-ink/10" />
              <Gift size={36} weight="duotone" className="relative" />
              <div className="relative">
                <h3 className="text-3xl font-extrabold">{t("pillar_reward")}</h3>
                <p className="mt-2 text-[15px] opacity-85">{t("pillar_reward_body")}</p>
              </div>
            </div>
          </Item>
        </Stagger>
      </section>

      {/* Levels ladder */}
      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("levelsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("levelsSub")}</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-4">
            {LEVEL_ORDER.map((l, i) => {
              const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
              return (
                <Item key={l}>
                  <div className={cn("lift relative flex h-full flex-col gap-4 overflow-hidden rounded-[var(--radius-card)]", i === 3 ? "bg-forest text-white" : "card")}>
                    <div className="h-36 w-full overflow-hidden" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 1.5}deg) scale(1.06)` }}><Graphic id={`level-${l}`} compact /></div>
                    <div className="px-6 pb-6">
                      <div className="text-2xl font-extrabold">{t(`lv_${l}` as const)}</div>
                      <div className={cn("mt-1 text-[12.5px]", i === 3 ? "text-white/70" : "text-ink-3")}>{how}</div>
                      <p className={cn("mt-3 text-[14px]", i === 3 ? "text-white/90" : "text-ink-2")}>{t(`lvUnlock_${l}` as const)}</p>
                    </div>
                  </div>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Brands + product marquee */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("brandsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("brandsSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {s.brands.map((b) => <BrandMark key={b.id} brand={b} size="lg" />)}
          </Reveal>
        </div>
        <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <motion.div className="flex w-max gap-4 px-2" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} style={{ direction: "ltr" }}>
            {marquee.map((p, i) => (
              <div key={`${p.id}-${i}`} className="card w-44 shrink-0 p-3" style={{ transform: `rotate(${(i % 3) - 1}deg)` }}>
                <ProductArt product={p} brand={brandOf(p.brandId)} className="aspect-square w-full" />
                <div className="mt-2.5 truncate text-[13px] font-semibold">{L(p.names)}</div>
                <div className="text-[12px] text-ink-3">{p.type}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Academy covers */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal>
          <h2 className="text-3xl md:text-5xl">{t("academyTitle")}</h2>
          <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("academySubEntry")}</p>
        </Reveal>
        <Stagger className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {s.academy.tracks.map((tr, i) => (
            <Item key={tr.id}>
              <div className="lift card overflow-hidden" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 1.2}deg)` }}>
                <div className="aspect-[4/3]"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} compact /></div>
                <div className="p-3">
                  <div className="text-[14px] font-bold leading-snug">{L(tr.title)}</div>
                  <div className="mt-0.5 text-[12px] text-ink-3">{tr.modules.length} {t("modules")}</div>
                </div>
              </div>
            </Item>
          ))}
        </Stagger>
      </section>

      {/* Seasons */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal className="card grid overflow-hidden lg:grid-cols-2">
          <div className="min-h-72 lg:min-h-full"><ArtSlot id="season-golden-hour" /></div>
          <div className="flex flex-col gap-5 p-7 lg:p-10">
            <span className="sticker self-start bg-marigold text-marigold-ink" style={{ ["--tilt" as string]: "-3deg" }}><Crown size={14} weight="fill" />{t("ambassadorRound")}</span>
            <h2 className="text-3xl md:text-5xl">{t("seasonTitle")}</h2>
            <p className="text-lg text-ink-2">{t("seasonSubEntry")}</p>
            <ul className="grid gap-2 text-[15px]">
              {[t("ap_wildcard_open"), t("ap_voting"), t("ap_selected"), t("circleCamp")].map((x) => <li key={x} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-lime-ink"><Check size={13} weight="bold" /></span>{x}</li>)}
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-20 md:px-6">
        <Reveal className="relative flex flex-col items-start gap-6 overflow-hidden rounded-[var(--radius-card)] bg-marigold p-8 text-marigold-ink md:flex-row md:items-center md:justify-between md:p-12">
          <div className="pattern-dots absolute inset-0 text-marigold-ink/10" />
          <div className="relative flex items-center gap-5">
            <span className="leaf-shape flex h-16 w-16 shrink-0 items-center justify-center bg-forest text-lime"><Leaf size={30} weight="fill" /></span>
            <div>
              <h2 className="text-3xl font-extrabold md:text-4xl">{t("heroTitle")}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[13px] font-semibold opacity-80"><span>{t("noMinimum")}</span><span>·</span><span>{t("sixMarkets")}</span><span>·</span><span>{t("twoLanguages")}</span></div>
            </div>
          </div>
          <Magnetic><Button size="lg" className="relative bg-forest text-white hover:bg-forest-2" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
        </Reveal>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 text-[13px] text-ink-3 md:flex-row md:items-center md:justify-between md:px-6">
          <Logo compact />
          <p className="max-w-[70ch]">{t("footerNote")}</p>
          <Link to="/login" className="hover:text-ink">{t("signIn")}</Link>
        </div>
      </footer>
    </div>
  );
}
