import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Leaf, Translate, Crown, Check } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT, useToggleLang } from "../../i18n";
import { Button } from "../../ui/primitives";
import { Magnetic, Reveal, Item, Stagger } from "../../ui/motion";
import { ProductArt } from "../../ui/ProductArt";
import { JourneyTrail } from "../../ui/JourneyTrail";
import { Certificate, KitBox, MembershipCard, Stamp, StampCard, Ticket } from "../../ui/kit";
import { Logo } from "../../app/shell";
import { BrandMark, MissionTypeChip, StageChip } from "../shared/bits";
import { LEVEL_ORDER, LEVEL_RULES, currentSeason, leaderboard } from "../../domain/selectors";
import { STAGES } from "../../domain/stages";
import { cn } from "../../ui/cn";

export function Entry() {
  const t = useT();
  const L = useL();
  const { date, num } = useFormat();
  const s = useStore();
  const toggle = useToggleLang();
  const brandOf = (id: string) => s.brands.find((b) => b.id === id);
  const heroProducts = ["vatika-black-seed-hair-oil", "dabur-amla-hair-oil", "dabur-herbl-charcoal-toothpaste", "real-mango-juice", "dabur-honey"].map((id) => s.products.find((p) => p.id === id)!).filter(Boolean);
  const demo = s.participations.find((p) => p.id === "pt_blackseed30_laylaoils") ?? s.participations[0];
  const signedIn = s.session.seat;
  const marquee = [...s.products, ...s.products];
  const season = currentSeason(s);
  const board = leaderboard(s, season);
  const sample = { member: "cr_zahramuscat", insider: "cr_saraalsheikh", pro: "cr_laylaoils", ambassador: "cr_omarlaughs" } as const;
  const mission = s.missions.find((m) => m.id === "ms_goldenhour")!;
  const track = s.academy.tracks[0];

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={15} weight="bold" />{t("language")}</button>
            <Button size="sm" variant="secondary" to={signedIn ? (signedIn === "creator" ? "/creator" : "/admin") : "/login"}>{signedIn ? t("continue") : t("signIn")}</Button>
          </div>
        </div>
      </header>

      {/* Hero: the kit opens */}
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-12 md:px-6 md:pt-16 lg:pb-24">
        <div className="md:col-span-6 lg:col-span-5">
          <Reveal inView={false}>
            <div className="meta">{t("sixMarkets")} · {t("twoLanguages")}</div>
            <h1 className="mt-4 text-5xl md:text-6xl lg:text-[4.5rem]">{t("heroKit")}</h1>
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
        <div className="md:col-span-6 lg:col-span-7">
          <KitBox>
            {heroProducts.map((p) => <ProductArt key={p.id} product={p} brand={brandOf(p.brandId)} size="lg" className="rounded-[10px] shadow-float ring-1 ring-black/5" />)}
          </KitBox>
        </div>
      </section>

      {/* What comes out of the box: three real objects */}
      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("whatsInside")}</h2>
          </Reveal>
          <Stagger className="mt-10 grid items-start gap-8 md:grid-cols-12">
            <Item className="md:col-span-5">
              <Ticket stub={<div className="flex items-center justify-between text-[13px]"><span className="meta">{date(mission.window.start)} - {date(mission.window.end)}</span><span className="font-semibold tabular">+{mission.sparks} {t("sparks")}</span></div>}>
                <div className="flex items-center gap-2"><MissionTypeChip type={mission.type} />{mission.brandId && brandOf(mission.brandId) && <BrandMark brand={brandOf(mission.brandId)!} size="sm" />}</div>
                <div className="mt-3 text-2xl font-semibold">{L(mission.title)}</div>
                <p className="mt-2 text-[14px] text-ink-2">{L(mission.prompt)}</p>
              </Ticket>
              <div className="mt-4"><div className="font-semibold">{t("objTicket")}</div><p className="text-[14px] text-ink-2">{t("objTicketBody")}</p></div>
            </Item>
            <Item className="md:col-span-4">
              <MembershipCard id="cr_laylaoils" name="Layla Al Mansoori" handle="laylaoils" level="pro" since="Aug 2026" sparks={2430} />
              <div className="mt-4"><div className="font-semibold">{t("objCard")}</div><p className="text-[14px] text-ink-2">{t("objCardBody")}</p></div>
            </Item>
            <Item className="md:col-span-3">
              <Certificate title={L(track.title)} name="Layla Al Mansoori" date={date("2026-09-26")} meta={`${track.modules.length} ${t("modules")}`} sealed />
              <div className="mt-4"><div className="font-semibold">{t("objCert")}</div><p className="text-[14px] text-ink-2">{t("objCertBody")}</p></div>
            </Item>
          </Stagger>
        </div>
      </section>

      {/* Trail */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("howTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("howSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="label-card mt-10 p-4 md:p-6">
            <JourneyTrail participation={demo} />
            <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              {STAGES.filter((st) => !["changes_requested", "revised_cut", "auto_check"].includes(st)).map((st) => <StageChip key={st} stage={st} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Levels: four cards */}
      <section className="border-y border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("levelsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("levelsSub")}</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LEVEL_ORDER.map((l) => {
              const c = s.creators.find((x) => x.id === sample[l])!;
              const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
              return (
                <Item key={l}>
                  <MembershipCard id={c.id} name={c.name} handle={c.handle} level={l} since={date(c.joinedAt, { month: "short", year: "numeric" })} sparks={board.find((b) => b.creator.id === c.id)?.sparks ?? 0} />
                  <div className="mt-4">
                    <div className="text-lg font-semibold">{t(`lv_${l}` as const)}</div>
                    <div className="text-[12.5px] text-ink-3">{how}</div>
                    <p className="mt-2 text-[14px] text-ink-2">{t(`lvUnlock_${l}` as const)}</p>
                  </div>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* Season: stamp card and the Ambassador round */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <StampCard total={8} filled={5} size={56} label={<><span className="font-semibold">{L(season.name)}</span><span className="meta">{t("stampCard")}</span></>} />
            <p className="mt-3 text-[13px] text-ink-3">{t("stampCardHint")}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-center gap-3"><Stamp pressed size={56} tone="marigold"><Crown size={22} weight="fill" /></Stamp><span className="meta">{t("ambassadorRound")}</span></div>
            <h2 className="mt-4 text-3xl md:text-5xl">{t("seasonTitle")}</h2>
            <p className="mt-3 text-lg text-ink-2">{t("seasonSubEntry")}</p>
            <ul className="mt-5 grid gap-2 text-[15px]">
              {[t("ap_wildcard_open"), t("ap_voting"), t("ap_selected"), t("circleCamp")].map((x) => <li key={x} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Check size={13} weight="bold" /></span>{x}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Brands shelf */}
      <section className="border-t border-line bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-3xl md:text-5xl">{t("brandsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("brandsSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {s.brands.map((b) => <BrandMark key={b.id} brand={b} size="lg" />)}
          </Reveal>
        </div>
        <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <motion.div className="flex w-max items-end gap-5 px-2 pb-3" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} style={{ direction: "ltr" }}>
            {marquee.map((p, i) => (
              <div key={`${p.id}-${i}`} className="w-40 shrink-0">
                <ProductArt product={p} brand={brandOf(p.brandId)} className="aspect-[4/5] w-full" size="lg" />
                <div className="mt-2 truncate text-[12.5px] font-medium">{L(p.names)}</div>
              </div>
            ))}
          </motion.div>
          <div className="mx-auto h-px max-w-[1400px] bg-line-2" />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 lg:py-20">
        <Reveal className="label-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-forest text-marigold"><Leaf size={26} weight="fill" /></span>
            <div>
              <h2 className="text-3xl md:text-4xl">{t("heroTitle")}</h2>
              <div className="meta mt-2">{t("noMinimum")} · {t("sixMarkets")} · {num(s.creators.length)} {t("creators").toLowerCase()}</div>
            </div>
          </div>
          <Magnetic><Button size="lg" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
        </Reveal>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 text-[13px] text-ink-3 md:flex-row md:items-center md:justify-between md:px-6">
          <Logo compact />
          <p className="max-w-[70ch]">{t("footerNote")}</p>
          <Link to="/login" className={cn("hover:text-ink")}>{t("signIn")}</Link>
        </div>
      </footer>
    </div>
  );
}
