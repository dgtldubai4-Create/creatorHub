import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Package, Coins, Leaf, GameController, GraduationCap, Gift, Lightning, Crown, Check } from "@phosphor-icons/react";
import { ArtSlot } from "../../ui/ArtSlot";
import { LevelEmblem, MissionTypeChip } from "../shared/bits";
import { LEVEL_ORDER, LEVEL_RULES } from "../../domain/selectors";
import { useStore } from "../../app/store";
import { useL, useT, useToggleLang } from "../../i18n";
import { Button, Chip } from "../../ui/primitives";
import { Float, Magnetic, Reveal, Tilt, Item, Stagger } from "../../ui/motion";
import { ProductArt } from "../../ui/ProductArt";
import { JourneyTrail, PhaseTrail } from "../../ui/JourneyTrail";
import { Logo } from "../../app/shell";
import { cn } from "../../ui/cn";
import { BrandMark, StageChip } from "../shared/bits";
import { STAGES } from "../../domain/stages";
import { Translate } from "@phosphor-icons/react";

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

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={15} weight="bold" />{t("language")}</button>
            <Button size="sm" variant="secondary" to={signedIn ? (signedIn === "creator" ? "/creator" : "/admin") : "/login"}>{signedIn ? t("continue") : t("signIn")}</Button>
          </div>
        </div>
      </header>

      {/* Hero: asymmetric split, copy left, sticker cloud right */}
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-12 md:px-6 md:pt-16 lg:pb-24">
        <div className="md:col-span-6 lg:col-span-5">
          <Reveal inView={false}>
            <h1 className="text-4xl leading-[1.02] md:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
          </Reveal>
          <Reveal inView={false} delay={0.08}>
            <p className="mt-5 max-w-[42ch] text-lg text-ink-2">{t("heroSub")}</p>
          </Reveal>
          <Reveal inView={false} delay={0.16}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic><Button size="lg" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
              <Button size="lg" variant="ghost" to="/login">{t("heroSecondary")}</Button>
            </div>
          </Reveal>
        </div>
        <div className="relative md:col-span-6 lg:col-span-7">
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[640px]">
            <div className="absolute inset-[12%] rounded-[40%_60%_55%_45%/50%_45%_55%_50%] bg-leaf-soft" />
            {heroProducts.map((p, i) => {
              const spots = [
                { left: "6%", top: "10%", w: "34%", r: -8 },
                { left: "40%", top: "0%", w: "30%", r: 5 },
                { left: "62%", top: "34%", w: "34%", r: 9 },
                { left: "10%", top: "52%", w: "30%", r: 6 },
                { left: "38%", top: "44%", w: "28%", r: -4 },
              ][i];
              return (
                <motion.div key={p.id} className="absolute" style={{ left: spots.left, top: spots.top, width: spots.w }} initial={{ opacity: 0, y: 30, rotate: spots.r - 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, rotate: spots.r, scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.15 + i * 0.08 }}>
                  <Float delay={i * 0.6} amplitude={6 + i} duration={4 + i * 0.4}>
                    <Tilt max={10} className="rounded-2xl shadow-float">
                      <ProductArt product={p} brand={brandOf(p.brandId)} size="lg" className="rounded-2xl" />
                    </Tilt>
                  </Float>
                </motion.div>
              );
            })}
            <motion.div className="absolute -bottom-2 left-[2%] card flex items-center gap-3 p-3 pe-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marigold text-marigold-ink"><Coins size={18} weight="fill" /></span>
              <div>
                <div className="text-[13px] font-semibold">+900 {t("points")}</div>
                <PhaseTrail stage="points_released" size="sm" />
              </div>
            </motion.div>
            <motion.div className="absolute -top-3 right-[4%] card flex items-center gap-2 p-2.5 pe-3.5" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, type: "spring", stiffness: 200, damping: 20 }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Package size={16} weight="fill" /></span>
              <StageChip stage="out_for_delivery" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The trail: full-width, stacked heading */}
      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl">{t("howTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-ink-2">{t("howSub")}</p>
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

      {/* Product marquee: the one marquee on the page */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl">{t("brandsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-ink-2">{t("brandsSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {s.brands.map((b) => <BrandMark key={b.id} brand={b} size="lg" />)}
          </Reveal>
        </div>
        <div className="group relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <motion.div className="flex w-max gap-4 px-2" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} style={{ direction: "ltr" }}>
            {marquee.map((p, i) => (
              <div key={`${p.id}-${i}`} className="card w-44 shrink-0 p-3">
                <ProductArt product={p} brand={brandOf(p.brandId)} className="aspect-square w-full" />
                <div className="mt-2.5 truncate text-[13px] font-medium">{L(p.names)}</div>
                <div className="text-[12px] text-ink-3">{p.type}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pillars bento: one tall cell, two stacked */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal>
          <h2 className="text-3xl md:text-4xl">{t("pillarsTitle")}</h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-4 md:grid-cols-5">
          <Item className="md:col-span-3 md:row-span-2">
            <div className="card-soft flex h-full flex-col justify-between gap-8 bg-leaf-soft p-7 text-leaf-ink">
              <GameController size={32} weight="duotone" />
              <div>
                <h3 className="text-2xl">{t("pillar_play")}</h3>
                <p className="mt-2 max-w-[50ch] text-[15px] opacity-80">{t("pillar_play_body")}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {(["starter", "monthly", "team", "review", "event", "academy", "referral"] as const).map((k) => <MissionTypeChip key={k} type={k} className="bg-surface/70" />)}
                  <Chip tone="marigold" icon={<Lightning size={13} weight="fill" />}>{t("doubleSparks")}</Chip>
                </div>
              </div>
            </div>
          </Item>
          <Item className="md:col-span-2">
            <div className="card flex h-full flex-col justify-between gap-6 p-7">
              <GraduationCap size={32} weight="duotone" className="text-leaf" />
              <div>
                <h3 className="text-2xl">{t("pillar_grow")}</h3>
                <p className="mt-2 text-[15px] text-ink-2">{t("pillar_grow_body")}</p>
              </div>
            </div>
          </Item>
          <Item className="md:col-span-2">
            <div className="card-soft flex h-full flex-col justify-between gap-6 bg-marigold-soft p-7 text-marigold-ink">
              <Gift size={32} weight="duotone" />
              <div>
                <h3 className="text-2xl">{t("pillar_reward")}</h3>
                <p className="mt-2 text-[15px] opacity-80">{t("pillar_reward_body")}</p>
              </div>
            </div>
          </Item>
        </Stagger>
      </section>

      {/* Levels: a four-step ladder */}
      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-4xl">{t("levelsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-ink-2">{t("levelsSub")}</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 md:grid-cols-4">
            {LEVEL_ORDER.map((l, i) => {
              const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
              return (
                <Item key={l}>
                  <div className={cn("relative flex h-full flex-col gap-4 rounded-[var(--radius-card)] p-6", i === 3 ? "bg-leaf text-white" : "bg-surface-2")}>
                    <LevelEmblem level={l} size={56} className={cn(i === 3 && "bg-white/15 text-white")} />
                    <div>
                      <div className="text-xl font-semibold">{t(`lv_${l}` as const)}</div>
                      <div className={cn("mt-1 text-[12.5px]", i === 3 ? "opacity-80" : "text-ink-3")}>{how}</div>
                    </div>
                    <p className={cn("mt-auto text-[14px]", i === 3 ? "opacity-90" : "text-ink-2")}>{t(`lvUnlock_${l}` as const)}</p>
                    {i < 3 && <ArrowRight size={18} weight="bold" className="absolute -end-3 top-1/2 hidden -translate-y-1/2 text-ink-3 md:block rtl:rotate-180" />}
                  </div>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Academy: six covers */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 lg:py-24">
        <Reveal>
          <h2 className="text-3xl md:text-4xl">{t("academyTitle")}</h2>
          <p className="mt-3 max-w-[60ch] text-ink-2">{t("academySubEntry")}</p>
        </Reveal>
        <Stagger className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {s.academy.tracks.map((tr) => (
            <Item key={tr.id}>
              <div className="card overflow-hidden">
                <div className="aspect-[4/3]"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} /></div>
                <div className="p-3">
                  <div className="text-[14px] font-semibold leading-snug">{L(tr.title)}</div>
                  <div className="mt-0.5 text-[12px] text-ink-3">{tr.modules.length} {t("modules")}</div>
                </div>
              </div>
            </Item>
          ))}
        </Stagger>
      </section>

      {/* Seasons and Ambassadors: split with photo */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal className="card grid overflow-hidden lg:grid-cols-2">
          <div className="min-h-64 lg:min-h-full"><ArtSlot id="season-golden-hour" /></div>
          <div className="flex flex-col gap-5 p-7 lg:p-10">
            <Chip tone="marigold" icon={<Crown size={13} weight="fill" />} className="self-start">{t("ambassadorRound")}</Chip>
            <h2 className="text-3xl md:text-4xl">{t("seasonTitle")}</h2>
            <p className="text-ink-2">{t("seasonSubEntry")}</p>
            <ul className="grid gap-2 text-[14px]">
              {[t("ap_wildcard_open"), t("ap_voting"), t("ap_selected"), t("circleCamp")].map((x) => <li key={x} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Check size={12} weight="bold" /></span>{x}</li>)}
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-20 md:px-6">
        <Reveal className="card-soft flex flex-col items-start gap-6 bg-leaf p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex items-center gap-4">
            <span className="leaf-shape flex h-14 w-14 shrink-0 items-center justify-center bg-white/15"><Leaf size={26} weight="fill" /></span>
            <div>
              <h2 className="text-2xl md:text-3xl">{t("heroTitle")}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[13px] opacity-90"><span>{t("noMinimum")}</span><span>·</span><span>{t("sixMarkets")}</span><span>·</span><span>{t("twoLanguages")}</span></div>
            </div>
          </div>
          <Magnetic><Button size="lg" variant="accent" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
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
