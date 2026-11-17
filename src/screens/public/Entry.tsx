import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Translate, Crown, GraduationCap, VideoCamera, ChartLineUp, Briefcase, Stamp as StampIcon, HeartHalf, ChatsCircle, Package, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT, useToggleLang } from "../../i18n";
import { Button, Chip } from "../../ui/primitives";
import { Blobs, Counter, CursorGlow, Item, Marquee, Reveal, RotatingWord, ScrollProgress, Stagger, Tilt, Words, useTicker } from "../../ui/motion";
import { vivid, vividGradient } from "../../ui/brandColor";
import { Face, FacePile } from "../../ui/Face";
import { ProductArt } from "../../ui/ProductArt";
import { Certificate, MembershipCard, StampCard, Ticket } from "../../ui/kit";
import { Graphic } from "../../ui/Graphic";
import { SocialWall, hasSocial } from "../../ui/Social";
import { ArtSlot, hasArt } from "../../ui/ArtSlot";
import { Logo, ThemeToggle } from "../../app/shell";
import { BrandMark, LevelChip, MissionTypeChip } from "../shared/bits";
import { LEVEL_ORDER, LEVEL_RULES, currentSeason, leaderboard } from "../../domain/selectors";
import { ENGAGEMENT_BANDS, FORMAT_MULT, LEVEL_KITS, MULTI_BRAND_MULT, REACH_BANDS, quoteSparks } from "../../domain/policy";
import { QuoteBreakdown } from "../shared/program";
import type { Creator } from "../../domain/types";
import { cn } from "../../ui/cn";

const TRACK_ICON: Record<string, Icon> = { tr_craft: VideoCamera, tr_growth: ChartLineUp, tr_business: Briefcase, tr_licensing: StampIcon, tr_wellbeing: HeartHalf, tr_mentorship: ChatsCircle };

export function Entry() {
  const t = useT();
  const L = useL();
  const { date, num } = useFormat();
  const s = useStore();
  const toggle = useToggleLang();
  const brandOf = (id: string | null | undefined) => s.brands.find((b) => b.id === id);
  const signedIn = s.session.seat;
  const season = currentSeason(s);
  const board = useMemo(() => leaderboard(s, season), [s, season]);
  const sparksFor = (id: string) => board.find((b) => b.creator.id === id)?.sparks ?? 0;
  const levelFor = (id: string) => board.find((b) => b.creator.id === id)?.level ?? "member";
  const spotlightIds = ["cr_laylaoils", "cr_omarlaughs", "cr_saraalsheikh", "cr_reemq", "cr_aishacurls", "cr_yousefeats", "cr_maryamks", "cr_zahramuscat"];
  const spotlight = spotlightIds.map((id) => s.creators.find((c) => c.id === id)).filter((c): c is Creator => !!c);
  const [pick, setPick] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setPick((p) => (p + 1) % spotlight.length), 5000);
    return () => window.clearInterval(id);
  }, [auto, spotlight.length]);
  const star = spotlight[pick];
  const lastMade = (c: Creator) => {
    const done = s.missions.filter((m) => m.entries[c.id]?.state === "completed").sort((a, b) => (b.entries[c.id].submissions.at(-1)?.at ?? "").localeCompare(a.entries[c.id].submissions.at(-1)?.at ?? ""))[0];
    if (done) return { title: L(done.title), brand: brandOf(done.brandId) };
    const p = s.participations.filter((x) => x.creatorId === c.id).sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))[0];
    const cp = p && s.campaigns.find((x) => x.id === p.campaignId);
    return cp ? { title: L(cp.title), brand: brandOf(cp.brandId) } : null;
  };
  const ticker = useMemo(() => [...s.ledger].filter((l) => l.delta > 0).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12).map((l) => ({ l, c: s.creators.find((c) => c.id === l.creatorId) })).filter((x) => x.c), [s.ledger, s.creators]);
  const missions = ["ms_goldenhour", "ms_masknight", "ms_honeyhack", "ms_unbox"].map((id) => s.missions.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const words = t("heroWords").split("|");
  const sample = { member: "cr_zahramuscat", insider: "cr_saraalsheikh", pro: "cr_laylaoils", ambassador: "cr_omarlaughs" } as const;
  const sparksIssued = s.ledger.filter((l) => l.delta > 0).reduce((n, l) => n + l.delta, 0);
  const liveMissions = s.missions.filter((m) => m.status === "live").length;
  const topFive = board.slice(0, 5);
  const packs = ["vatika-black-seed-hair-oil", "dabur-amla-hair-oil", "dabur-herbl-charcoal-toothpaste", "real-mango-juice", "dabur-honey", "hajmola-regular", "fem-creme-bleach", "dermoviva-body-lotion"].map((id) => s.products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const track = s.academy.tracks[0];
  const mathsMission = s.missions.find((m) => m.id === "ms_goldenhour")!;
  const mathsCreator = s.creators.find((c) => c.id === "cr_laylaoils")!;
  const maths = { creator: mathsCreator, quote: quoteSparks({ base: mathsMission.sparks, format: "video", followers: mathsCreator.connected.instagram?.followers ?? mathsCreator.followers, engagementRate: mathsCreator.connected.instagram?.engagementRate ?? 0, brandCount: 2 }) };

  const hero = s.creators.find((c) => c.id === "cr_laylaoils")!;
  const steps = [
    { title: t("lpHow1"), body: t("lpHow1Body"), faces: ["cr_reemq", "cr_hessamoves"] },
    { title: t("lpHow2"), body: t("lpHow2Body"), faces: ["cr_laylaoils", "cr_omarlaughs"] },
    { title: t("lpHow3"), body: t("lpHow3Body"), faces: ["cr_saraalsheikh", "cr_yousefeats"] },
  ];
  const reason = (l: (typeof ticker)[number]["l"]) => L(l.reason).replace(/^Mission: |^مهمة: /, "");
  const arrow = <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />;
  const live = useTicker(ticker, hasArt("hero-golden-hour") ? 3 : 4);

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-canvas">
      <ScrollProgress />
      <CursorGlow />
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="press inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={16} />{t("language")}</button>
            <ThemeToggle />
            <Button size="sm" variant="secondary" className="ms-2" to={signedIn ? (signedIn === "creator" ? "/creator" : "/admin") : "/login"}>{signedIn ? t("continue") : t("signIn")}</Button>
          </div>
        </div>
      </header>

      {/* ---------- Hero: the promise on one side, the real card and ledger on the other ---------- */}
      <section className="relative">
        <Blobs />
        <div className="relative mx-auto grid grid-cols-1 min-h-[calc(100dvh-4rem)] max-w-[1400px] items-center gap-12 px-4 py-12 md:px-6 lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 lg:col-span-6">
            <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[5rem] rtl:leading-[1.3]">
              <Words text={t("heroLine1")} />{" "}
              <motion.span className="inline-block" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.25 }}><RotatingWord words={words} className="rounded-[0.18em] bg-accent px-[0.14em] text-accent-ink" /></motion.span>
              <br />
              <Words text={t("heroLine2")} delay={0.3} />
            </h1>
            <Reveal inView={false} delay={0.08}>
              <p className="mt-6 max-w-[44ch] text-lg text-ink-2 md:text-xl">{t("lpTagline")}</p>
            </Reveal>
            <Reveal inView={false} delay={0.16}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button size="lg" to="/join" className="group" iconEnd={arrow}>{t("heroCta")}</Button>
                <Button size="lg" variant="ghost" to="/login">{t("heroSecondary")}</Button>
              </div>
            </Reveal>
          </div>
          <div className="relative lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[560px] lg:ms-auto lg:me-0">
              {hasArt("hero-golden-hour") && (
                <motion.div className="relative -mb-36 ms-12 overflow-hidden rounded-[28px] shadow-float sm:ms-28" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="h-[340px] w-full md:h-[380px]"><ArtSlot id="hero-golden-hour" /></div>
                </motion.div>
              )}
              <motion.div className="relative z-10 me-8 sm:me-20" initial={{ opacity: 0, y: 28, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.1 }}>
                <Tilt max={7} className="float-y">
                  <MembershipCard id={hero.id} hue={hero.hue} name={hero.name} handle={hero.handle} level={levelFor(hero.id)} since={date(hero.joinedAt, { month: "short", year: "numeric" })} sparks={sparksFor(hero.id)} className="!max-w-none" />
                </Tilt>
              </motion.div>
              <motion.div className="card relative z-10 mt-4 ms-8 overflow-hidden sm:ms-20" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.28 }}>
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5"><span className="meta flex items-center gap-2"><span className="ping inline-block h-2 w-2 rounded-full bg-hot text-hot" />{t("lpSeasonNow")}</span><span className="hidden text-[12px] text-ink-3 sm:inline">{L(season.name)}</span></div>
                <ul className="relative overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    {live.map(({ l, c }) => (
                      <motion.li layout key={l.id} className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5 last:border-b-0" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -28 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
                        <Face name={c!.name} hue={c!.hue} size={32} />
                        <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-medium">{c!.name}</div><div className="truncate text-[12.5px] text-ink-3">{reason(l)}</div></div>
                        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[13px] font-medium tabular text-accent-text" dir="ltr">+{num(l.delta)}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Live ticker: the page's one marquee ---------- */}
      <div className="relative z-10 border-y border-line bg-surface">
        <Marquee duration={70} className="py-3.5">
          {ticker.map(({ l, c }) => (
            <span key={l.id} className="mx-6 inline-flex items-center gap-2.5 text-[13.5px] text-ink-2">
              <Face name={c!.name} hue={c!.hue} size={24} />
              <span>{t("tickerEarned", { name: c!.name.split(" ")[0], city: c!.city, n: num(l.delta), reason: reason(l) })}</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* ---------- Meet the Squad ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6 lg:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h2 className="text-4xl md:text-5xl">{t("lpMeet")}</h2>
            <p className="mt-4 max-w-[36ch] text-lg text-ink-2">{t("lpMeetSub")}</p>
            <ul className="mt-8 border-t border-line" onMouseEnter={() => setAuto(false)} onMouseLeave={() => setAuto(true)}>
              {spotlight.map((c, i) => (
                <li key={c.id} className="border-b border-line">
                  <button onClick={() => { setPick(i); setAuto(false); }} aria-pressed={i === pick} className={cn("group flex w-full items-center gap-3 py-2.5 text-start transition-colors", i === pick ? "text-ink" : "text-ink-3 hover:text-ink")}>
                    <Face name={c.name} hue={c.hue} size={32} className={cn("transition-opacity", i !== pick && "opacity-60 group-hover:opacity-100")} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c.name}</span>
                    <span className="text-[13px] text-ink-3">{c.city}</span>
                    {i === pick && <motion.span layoutId="meet-pick" className="h-2 w-2 rounded-full bg-brand" />}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div key={star.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <div className="slab relative overflow-hidden p-6 md:p-10">
                  <div className="flex flex-col gap-8 md:flex-row md:items-start">
                    <Face name={star.name} hue={star.hue} size={132} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><LevelChip level={levelFor(star.id)} /><Chip>{star.city}, {star.market}</Chip><Chip>{t(`niche_${star.niche}` as const)}</Chip></div>
                      <div className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">{star.name}</div>
                      <div className="mt-1 text-[14px] text-ink-3">@{star.handle}, {num(star.followers)} {t("followers").toLowerCase()}</div>
                      <p className="mt-6 text-2xl font-medium leading-snug tracking-tight text-balance md:text-[1.75rem]">{L(star.vibe)}</p>
                      <p className="mt-3 max-w-[60ch] text-[15px] text-ink-2">{L(star.bio)}</p>
                      <div className="mt-8 flex flex-wrap items-end gap-x-12 gap-y-4 border-t border-line pt-6">
                        <div><div className="text-[13px] text-ink-3">{t("lpSeasonSparks")}</div><div className="mt-1 text-4xl font-medium tabular tracking-tight"><Counter value={sparksFor(star.id)} /></div></div>
                        {lastMade(star) && <div className="min-w-0"><div className="text-[13px] text-ink-3">{t("lpLastMade")}</div><div className="mt-2 flex items-center gap-2 text-[15px] font-medium">{lastMade(star)!.brand && <BrandMark brand={lastMade(star)!.brand!} size="sm" />}<span className="truncate">{lastMade(star)!.title}</span></div></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ---------- From Dabur's own feed: renders only when posts have been imported ---------- */}
      {hasSocial() && (
        <section className="mx-auto max-w-[1400px] px-4 pb-20 md:px-6 lg:pb-28">
          <Reveal>
            <h2 className="text-4xl md:text-5xl">{t("socialTitle")}</h2>
            <p className="mt-4 max-w-[60ch] text-lg text-ink-2">{t("socialSub")}</p>
          </Reveal>
          <SocialWall className="mt-10" />
        </section>
      )}

      {/* ---------- How it works ---------- */}
      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="mx-auto grid grid-cols-1 max-w-[1400px] gap-10 px-4 md:px-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-4"><h2 className="text-4xl md:text-5xl lg:sticky lg:top-28">{t("lpHow")}</h2></Reveal>
          <div className="lg:col-span-8">
            <Stagger className="border-t border-line">
              {steps.map((step, i) => (
                <Item key={step.title}>
                  <div className="grid grid-cols-1 gap-4 border-b border-line py-8 md:grid-cols-[5rem_1fr_auto] md:items-start md:gap-8">
                    <span className="brand-fill flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-medium tabular" dir="ltr">{i + 1}</span>
                    <div><h3 className="text-2xl md:text-3xl">{step.title}</h3><p className="mt-3 max-w-[52ch] text-[16px] text-ink-2">{step.body}</p></div>
                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                      <FacePile people={step.faces.map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean)} size={36} />
                      <span className="text-[13px] text-ink-3">{step.faces.map((id) => s.creators.find((c) => c.id === id)?.name.split(" ")[0]).join(", ")}</span>
                    </div>
                  </div>
                </Item>
              ))}
            </Stagger>
            <Reveal delay={0.1} className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
              {[
                { v: s.creators.length, l: t("lpStatCreators") },
                { v: sparksIssued, l: t("lpStatSparks") },
                { v: liveMissions, l: t("lpStatMissions") },
                { v: 6, l: t("lpStatMarkets") },
              ].map((st) => (
                <div key={st.l}>
                  <div className="text-4xl font-medium tabular tracking-tight text-brand-text md:text-5xl"><Counter value={st.v} /></div>
                  <div className="mt-2 text-[14px] text-ink-3">{st.l}</div>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Missions on the board ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6 lg:py-28">
        <Reveal>
          <h2 className="text-4xl md:text-5xl">{t("lpMissionsTitle")}</h2>
          <p className="mt-4 max-w-[60ch] text-lg text-ink-2">{t("lpMissionsSub")}</p>
        </Reveal>
        <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {missions.map((m) => {
            const joined = Object.keys(m.entries).slice(0, 4).map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean);
            return (
              <Item key={m.id}>
                <Ticket to="#/join" className="group h-full" stub={<div className="flex items-center justify-between gap-2 text-[13px]"><FacePile people={joined} size={26} max={4} /><span className="font-medium tabular text-accent-text" dir="ltr">+{m.sparks} {t("sparks")}</span></div>}>
                  <div className="-mx-5 -mt-5 mb-5 h-28 overflow-hidden rounded-t-[19px]"><Graphic id={`mission-${m.type}`} brandId={m.brandId} compact /></div>
                  <div className="flex items-center justify-between gap-2"><MissionTypeChip type={m.type} />{m.brandId && brandOf(m.brandId) && <BrandMark brand={brandOf(m.brandId)!} size="sm" />}</div>
                  <div className="mt-4 text-xl font-medium leading-tight tracking-tight">{L(m.title)}</div>
                  <p className="mt-2 line-clamp-3 text-[14px] text-ink-2">{L(m.prompt)}</p>
                  <div className="mt-4 text-[12.5px] text-ink-3">{date(m.window.start)} to {date(m.window.end)}</div>
                </Ticket>
              </Item>
            );
          })}
        </Stagger>
      </section>

      {/* ---------- The Sparks table, in public ---------- */}
      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="mx-auto grid grid-cols-1 max-w-[1400px] items-start gap-10 px-4 md:px-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="text-4xl md:text-5xl">{t("lpMathsTitle")}</h2>
            <p className="mt-4 text-lg text-ink-2">{t("lpMathsSub")}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="overflow-hidden rounded-card border border-line">
              <div className="grid grid-cols-2">
                {[
                  { label: t("sp_format"), top: FORMAT_MULT.video, note: t("fmt_video") },
                  { label: t("sp_reach"), top: REACH_BANDS.at(-1)!.mult, note: t("reachBand", { n: num(REACH_BANDS.at(-1)!.min) }) },
                  { label: t("sp_engagement"), top: ENGAGEMENT_BANDS.at(-1)!.mult, note: t("engBand", { n: ENGAGEMENT_BANDS.at(-1)!.min }) },
                  { label: t("sp_brands"), top: MULTI_BRAND_MULT, note: t("brandsMulti") },
                ].map((f, i) => (
                  <div key={f.label} className={cn("border-line p-5 md:p-6", i % 2 === 0 && "border-e", i < 2 && "border-b")}>
                    <div className="text-[13px] text-ink-3">{f.label}</div>
                    <div className="mt-2 text-4xl font-medium tabular tracking-tight md:text-5xl" dir={i === 0 ? "ltr" : undefined}>{i === 0 ? `×${f.top}` : t("lpUpTo", { n: f.top })}</div>
                    <div className="mt-2 text-[13.5px] text-ink-2">{f.note}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line bg-surface-2/60 p-5 md:p-6"><div className="mb-3 text-[13px] text-ink-3">{L(mathsMission.title)}, {maths.creator.name.split(" ")[0]}</div><QuoteBreakdown quote={maths.quote} /></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Levels ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6 lg:py-28">
        <Reveal>
          <h2 className="text-4xl md:text-5xl">{t("levelsTitle")}</h2>
          <p className="mt-4 max-w-[60ch] text-lg text-ink-2">{t("lpLevelsSub")}</p>
        </Reveal>
        <Stagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_ORDER.map((l, i) => {
            const c = s.creators.find((x) => x.id === sample[l])!;
            const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
            return (
              <Item key={l} className={cn(i === 1 && "lg:mt-8", i === 2 && "lg:mt-16", i === 3 && "lg:mt-24")}>
                <Tilt max={5}>
                  <MembershipCard id={c.id} hue={c.hue} name={c.name} handle={c.handle} level={l} since={date(c.joinedAt, { month: "short", year: "numeric" })} sparks={sparksFor(c.id)} />
                </Tilt>
                <div className="mt-5">
                  <h3 className="text-2xl">{t(`lv_${l}` as const)}</h3>
                  <div className="mt-1 text-[13px] text-ink-3">{how}</div>
                  <p className="mt-3 text-[14.5px] text-ink-2">{t(`lvUnlock_${l}` as const)}</p>
                  {l !== "member" && <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"><Package size={15} />{t("lpKitLine", { n: LEVEL_KITS[l].items.reduce((n, it) => n + it.qty, 0) })}</p>}
                </div>
              </Item>
            );
          })}
        </Stagger>
      </section>

      {/* ---------- Season leaderboard ---------- */}
      <section className="border-y border-line bg-surface py-20 lg:py-28">
        <div className="mx-auto grid grid-cols-1 max-w-[1400px] items-start gap-10 px-4 md:px-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="meta flex items-center gap-2"><Crown size={14} weight="fill" className="text-accent-text" />{t("ambassadorRound")}: {t("ap_voting")}</div>
            <h2 className="mt-4 text-4xl md:text-5xl">{t("seasonTitle")}</h2>
            <p className="mt-4 max-w-[60ch] text-lg text-ink-2">{t("seasonSubEntry")}</p>
            <ul className="mt-10 border-t border-line">
              {topFive.map((row, i) => (
                <li key={row.creator.id} className="flex items-center gap-4 border-b border-line py-4">
                  <span className="w-6 text-[15px] font-medium tabular text-ink-3">{i + 1}</span>
                  <Face name={row.creator.name} hue={row.creator.hue} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate font-medium">{row.creator.name}</span><LevelChip level={row.level} /></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><motion.div className={cn("h-full rounded-full", i === 0 ? "bg-accent" : "bg-brand")} initial={{ width: 0 }} whileInView={{ width: `${Math.max(8, (row.sparks / (topFive[0]?.sparks || 1)) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }} /></div>
                  </div>
                  <span className="text-lg font-medium tabular tracking-tight"><Counter value={row.sparks} /></span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-5 lg:col-span-5">
            <StampCard total={8} filled={5} size={52} label={<><span className="font-medium">{L(season.name)}</span><span className="text-ink-3">{t("stampCard")}</span></>} />
            <div className="brand-fill shine overflow-hidden rounded-card">{hasArt("circle-camp") && <div className="h-44 w-full"><ArtSlot id="circle-camp" /></div>}<div className="p-6 md:p-8">
              <div className="text-2xl font-medium tracking-tight">{t("circleCamp")}</div>
              <p className="mt-3 text-[15px] opacity-75">{t("circleCampBody")}</p>
              <div className="mt-6 flex items-center gap-3"><FacePile people={(season.ambassadors.cohort.length ? season.ambassadors.cohort : season.ambassadors.shortlist).map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean)} size={36} max={6} className="[&_.ring-surface]:ring-brand" /><span className="text-[13px] opacity-75">{t("lv_ambassador")}</span></div>
            </div></div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Academy ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6 lg:py-28">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2 className="text-4xl md:text-5xl">{t("lpAcademyTitle")}</h2>
            <p className="mt-4 text-lg text-ink-2">{t("lpAcademySub")}</p>
            <ul className="mt-8 border-t border-line">
              {s.academy.tracks.map((tr) => { const I = TRACK_ICON[tr.id] ?? GraduationCap; return <li key={tr.id} className="flex items-center gap-3 border-b border-line py-3 text-[15px]"><I size={18} className="text-ink-3" /><span className="flex-1 font-medium">{L(tr.title)}</span><span className="text-[13px] tabular text-ink-3">{tr.modules.length} {t("modules")}</span></li>; })}
            </ul>
            <div className="mt-6 flex items-center gap-3"><FacePile people={Array.from(new Set(s.mentorSessions.flatMap((m) => m.mentor.split(" and ")))).map((name) => ({ name, hue: 0 })).slice(0, 5)} size={36} /><span className="text-[14px] text-ink-2">{t("mentoringSub")}</span></div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Certificate title={L(track.title)} name="Layla Al Mansoori" date={date("2026-09-26")} meta={`${track.modules.length} ${t("modules")}`} sealed />
              <div className="label-card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3"><Face name="Karim Nasser" hue={0} size={44} /><div><div className="font-medium">Karim Nasser</div><div className="text-[12.5px] text-ink-3">{t("role_content_reviewer")}</div></div></div>
                <div className="rounded-[18px] rounded-ss-[6px] bg-surface-2 p-4 text-[15px]"><p>{L(s.academy.tracks[0].modules[0].title)}: {L(s.academy.tracks[0].modules[0].summary)}</p></div>
                <div className="brand-fill self-end rounded-[18px] rounded-se-[6px] p-4 text-[15px]"><p>{L(s.creators[0].vibe)}</p></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Brands ---------- */}
      <section className="border-t border-line bg-surface py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-4xl md:text-5xl">{t("brandsTitle")}</h2>
            <p className="mt-4 max-w-[60ch] text-lg text-ink-2">{t("brandsSub")}</p>
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {s.brands.map((b) => (
              <Item key={b.id}>
                <div className="pan shine lift flex h-24 items-end rounded-[18px] p-4 text-[16px] font-medium tracking-tight" style={{ backgroundImage: `linear-gradient(135deg, ${vivid(b.id).from} 0%, ${vivid(b.id).to} 60%, ${vivid(b.id).from} 120%)`, color: vivid(b.id).on }}>{L(b.localisedName)}</div>
              </Item>
            ))}
          </Stagger>
        </div>
        <Marquee duration={55} reverse className="mt-8">
          {[...packs, ...packs].map((p, i) => (
            <div key={`${p.id}-${i}`} className="mx-2.5 w-40 shrink-0"><ProductArt product={p} brand={brandOf(p.brandId)} className="aspect-[4/5] w-full rounded-[18px]" size="lg" /></div>
          ))}
        </Marquee>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-6 lg:py-28">
        <Reveal className="relative overflow-hidden rounded-[1.75rem]"><div className="pan p-8 text-white md:p-14" style={{ backgroundImage: vividGradient("squad", 120).replace("100%)", "55%, #14b85f 120%)") }}>
          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="max-w-[14ch] text-4xl md:text-6xl">{t("lpCtaTitle")}</h2>
              <p className="mt-4 max-w-[46ch] text-lg opacity-80">{t("lpCtaSub", { n: s.creators.length })}</p>
            </div>
            <Button size="lg" variant="accent" to="/join" className="group" iconEnd={<ArrowUpRight size={18} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" />}>{t("heroCta")}</Button>
          </div>
        </div>
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
