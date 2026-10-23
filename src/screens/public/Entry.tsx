import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Translate, Crown, Lightning, Sparkle, Quotes, Trophy, GraduationCap, Confetti, PaperPlaneTilt, ChatCircleDots, VideoCamera, ChartLineUp, Briefcase, Stamp as StampIcon, HeartHalf, ChatsCircle, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT, useToggleLang } from "../../i18n";
import { Button, Chip } from "../../ui/primitives";
import { Blobs, Counter, CursorGlow, Float, Item, Magnetic, Marquee, Parallax, Reveal, RotatingWord, Squish, Stagger, Tilt } from "../../ui/motion";
import { Face, FacePile } from "../../ui/Face";
import { ProductArt } from "../../ui/ProductArt";
import { Certificate, MembershipCard, Stamp, StampCard, Ticket } from "../../ui/kit";
import { Graphic } from "../../ui/Graphic";
import { Logo } from "../../app/shell";
import { BrandMark, LevelChip, MissionTypeChip } from "../shared/bits";
import { LEVEL_ORDER, LEVEL_RULES, currentSeason, leaderboard } from "../../domain/selectors";
import type { Creator } from "../../domain/types";
import { cn } from "../../ui/cn";

const CANDIES = ["bg-lime", "bg-tangerine", "bg-bubblegum", "bg-sky", "bg-lemon", "bg-grape", "bg-mint"];
const TRACK_ICON: Record<string, Icon> = { tr_craft: VideoCamera, tr_growth: ChartLineUp, tr_business: Briefcase, tr_licensing: StampIcon, tr_wellbeing: HeartHalf, tr_mentorship: ChatsCircle };

/** The cloud of faces in the hero: nine creators bobbing around one big one. */
const CLOUD: { x: number; y: number; size: number; delay: number }[] = [
  { x: 50, y: 48, size: 168, delay: 0 },
  { x: 14, y: 18, size: 84, delay: 0.4 },
  { x: 84, y: 16, size: 96, delay: 1.1 },
  { x: 8, y: 62, size: 72, delay: 0.7 },
  { x: 90, y: 60, size: 80, delay: 1.6 },
  { x: 28, y: 88, size: 92, delay: 0.2 },
  { x: 72, y: 90, size: 76, delay: 1.3 },
  { x: 48, y: 6, size: 64, delay: 0.9 },
  { x: 30, y: 40, size: 56, delay: 2 },
  { x: 76, y: 44, size: 60, delay: 0.5 },
];

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
  const cloud = useMemo(() => {
    const ids = ["cr_laylaoils", "cr_omarlaughs", "cr_saraalsheikh", "cr_reemq", "cr_yousefeats", "cr_aishacurls", "cr_maryamks", "cr_hamadbh", "cr_zahramuscat", "cr_noorhaddad"];
    return ids.map((id) => s.creators.find((c) => c.id === id)).filter((c): c is Creator => !!c);
  }, [s.creators]);
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
  const ticker = useMemo(() => [...s.ledger].filter((l) => l.delta > 0).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 14).map((l) => ({ l, c: s.creators.find((c) => c.id === l.creatorId) })).filter((x) => x.c), [s.ledger, s.creators]);
  const missions = ["ms_goldenhour", "ms_masknight", "ms_honeyhack", "ms_unbox"].map((id) => s.missions.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const words = t("heroWords").split("|");
  const sample = { member: "cr_zahramuscat", insider: "cr_saraalsheikh", pro: "cr_laylaoils", ambassador: "cr_omarlaughs" } as const;
  const sparksIssued = s.ledger.filter((l) => l.delta > 0).reduce((n, l) => n + l.delta, 0);
  const liveMissions = s.missions.filter((m) => m.status === "live").length;
  const topFive = board.slice(0, 5);
  const packs = ["vatika-black-seed-hair-oil", "dabur-amla-hair-oil", "dabur-herbl-charcoal-toothpaste", "real-mango-juice", "dabur-honey", "hajmola-regular", "fem-creme-bleach", "dermoviva-body-lotion"].map((id) => s.products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const track = s.academy.tracks[0];

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-canvas">
      <CursorGlow />
      <header className="sticky top-0 z-40 border-b-2 border-outline bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="press inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-outline bg-surface px-3 text-[13px] font-bold shadow-[3px_3px_0_var(--outline)] hover:bg-lemon"><Translate size={15} weight="bold" />{t("language")}</button>
            <Button size="sm" variant="secondary" to={signedIn ? (signedIn === "creator" ? "/creator" : "/admin") : "/login"}>{signedIn ? t("continue") : t("signIn")}</Button>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative">
        <Blobs />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-8 px-4 pb-10 pt-10 md:grid-cols-12 md:px-6 md:pt-16 lg:pb-16">
          <div className="relative z-10 md:col-span-6">
            <Reveal inView={false}>
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="lime" icon={<Sparkle size={14} weight="fill" />}>{t("noMinimum")}</Chip>
                <Chip tone="sky">{t("sixMarkets")}</Chip>
                <Chip tone="bubblegum">{t("twoLanguages")}</Chip>
              </div>
              <h1 className="mt-6 text-[2.9rem] leading-[0.98] sm:text-6xl lg:text-[5.2rem]">
                {t("heroLine1")}{" "}
                <RotatingWord words={words} className="rounded-[18px] border-2 border-outline bg-lemon px-3 text-plum shadow-[5px_5px_0_var(--outline)]" />
                <br />
                {t("heroLine2")}
              </h1>
            </Reveal>
            <Reveal inView={false} delay={0.08}>
              <p className="mt-6 max-w-[46ch] text-lg text-ink-2 md:text-xl">{t("lpTagline")}</p>
            </Reveal>
            <Reveal inView={false} delay={0.16}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic><Button size="lg" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
                <Button size="lg" variant="secondary" to="/login">{t("heroSecondary")}</Button>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <FacePile people={s.creators.slice(0, 6)} size={36} max={6} />
                <span className="text-[14px] font-bold"><Counter value={s.creators.length} /> {t("lpStatCreators")} · <Counter value={sparksIssued} /> {t("lpStatSparks")}</span>
              </div>
            </Reveal>
          </div>
          <div className="relative md:col-span-6">
            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              {cloud.map((c, i) => {
                const p = CLOUD[i];
                return (
                  <motion.div key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: i === 0 ? 5 : 2 }} initial={{ scale: 0, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 + i * 0.07 }}>
                    <Float delay={p.delay} amplitude={i === 0 ? 6 : 12} duration={4 + (i % 4)}>
                      <Squish rotate={i % 2 ? 4 : -4}>
                        <Link to="/join" className="group/f block">
                          <div style={{ width: `${(p.size / 560) * 100}vw`, maxWidth: p.size }} className="aspect-square"><Face name={c.name} hue={c.hue} size="100%" className="shadow-[5px_5px_0_var(--outline)]" /></div>
                          <span className={cn("absolute left-1/2 top-full -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-full border-2 border-outline px-2 py-0.5 text-[11px] font-extrabold text-plum shadow-[2px_2px_0_var(--outline)]", CANDIES[i % CANDIES.length], i === 0 ? "text-[13px] px-3" : "")}>{c.name.split(" ")[0]} · {c.city}</span>
                        </Link>
                      </Squish>
                    </Float>
                  </motion.div>
                );
              })}
              <motion.span aria-hidden className="absolute -end-2 top-[28%] z-10 rounded-full border-2 border-outline bg-lime px-3 py-1 text-[13px] font-extrabold text-plum shadow-[3px_3px_0_var(--outline)]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 1 }}>+220 {t("sparks")}</motion.span>
              <motion.span aria-hidden className="absolute start-0 bottom-[22%] z-10 rounded-full border-2 border-outline bg-bubblegum px-3 py-1 text-[13px] font-extrabold text-plum shadow-[3px_3px_0_var(--outline)]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 1.3 }}><Crown size={14} weight="fill" className="-mt-0.5 inline" /> {t("lv_ambassador")}</motion.span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Live ticker ---------- */}
      <div className="relative z-10 border-y-2 border-outline bg-ink text-canvas">
        <Marquee duration={60} className="py-3">
          {ticker.map(({ l, c }) => (
            <span key={l.id} className="mx-5 inline-flex items-center gap-2.5 text-[14px] font-bold">
              <Face name={c!.name} hue={c!.hue} size={28} className="rounded-full" />
              <span>{t("tickerEarned", { name: c!.name.split(" ")[0], city: c!.city, n: num(l.delta), reason: L(l.reason).replace(/^Mission: |^مهمة: /, "") })}</span>
              <Lightning size={14} weight="fill" className="text-lemon" />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ---------- Meet the Squad ---------- */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <Blobs colors={["var(--lemon)", "var(--sky)"]} className="opacity-60" />
        <div className="relative mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="meta">{t("lpMeet")}</div>
              <h2 className="mt-2 text-4xl md:text-6xl">{t("lpMeet")}</h2>
              <p className="mt-3 text-lg text-ink-2">{t("lpMeetSub")}</p>
            </div>
            <div className="flex flex-wrap gap-2" onMouseEnter={() => setAuto(false)} onMouseLeave={() => setAuto(true)}>
              {spotlight.map((c, i) => (
                <Squish key={c.id} rotate={i % 2 ? 5 : -5}>
                  <button onClick={() => { setPick(i); setAuto(false); }} aria-label={c.name} className={cn("block rounded-full transition-all", i === pick ? "ring-4 ring-ink ring-offset-2 ring-offset-canvas" : "opacity-80 hover:opacity-100")}>
                    <Face name={c.name} hue={c.hue} size={52} className="rounded-full" />
                  </button>
                </Squish>
              ))}
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div key={star.id} initial={{ opacity: 0, y: 30, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -20, rotate: 1.5 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
                  <Tilt max={4}>
                    <div className={cn("block relative overflow-hidden p-6 md:p-8", CANDIES[(pick + 1) % CANDIES.length])}>
                      <span aria-hidden className="absolute -end-16 -top-16 h-56 w-56 rounded-full bg-white/30" />
                      <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
                        <Face name={star.name} hue={star.hue} size={160} className="shrink-0 rounded-full shadow-[6px_6px_0_var(--outline)]" />
                        <div className="min-w-0 flex-1 text-plum">
                          <div className="flex flex-wrap items-center gap-2"><LevelChip level={levelFor(star.id)} /><Chip tone="ink">{star.city} · {star.market}</Chip><Chip tone="neutral">{t(`niche_${star.niche}` as const)}</Chip></div>
                          <div className="mt-3 text-3xl font-extrabold md:text-4xl">{star.name}</div>
                          <div className="text-[14px] font-bold opacity-70">@{star.handle} · {num(star.followers)} {t("followers").toLowerCase()}</div>
                          <div className="mt-5 flex items-start gap-2"><Quotes size={28} weight="fill" className="shrink-0 opacity-60" /><p className="text-xl font-bold leading-snug md:text-2xl">{L(star.vibe)}</p></div>
                          <p className="mt-2 text-[15px] opacity-80">{L(star.bio)}</p>
                          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div><div className="meta !text-plum/60">{t("lpSeasonSparks")}</div><div className="text-3xl font-extrabold tabular"><Counter value={sparksFor(star.id)} /></div></div>
                            {lastMade(star) && <div><div className="meta !text-plum/60">{t("lpLastMade")}</div><div className="flex items-center gap-2 text-[15px] font-bold">{lastMade(star)!.brand && <BrandMark brand={lastMade(star)!.brand!} size="sm" className="!text-plum" />}{lastMade(star)!.title}</div></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </motion.div>
              </AnimatePresence>
            </div>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {[s.creators.find((c) => c.id === "cr_noorhaddad")!, s.creators.find((c) => c.id === "cr_khalidfit")!, s.creators.find((c) => c.id === "cr_alyadoha")!].map((c, i) => (
                <Item key={c.id}>
                  <div className="label-card lift flex items-center gap-4 p-4">
                    <Face name={c.name} hue={c.hue} size={64} className="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate font-extrabold">{c.name}</span><LevelChip level={levelFor(c.id)} /></div>
                      <div className="truncate text-[13px] text-ink-2">{c.city} · {t(`niche_${c.niche}` as const)}</div>
                      <p className="mt-1 line-clamp-2 text-[14px] font-semibold">"{L(c.vibe)}"</p>
                    </div>
                    <span className={cn("hidden shrink-0 rounded-full border-2 border-outline px-2.5 py-1 text-[12px] font-extrabold text-plum sm:inline", CANDIES[(i + 3) % CANDIES.length])}>+{num(sparksFor(c.id))}</span>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="relative border-y-2 border-outline bg-surface py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal><h2 className="text-4xl md:text-6xl">{t("lpHow")}</h2></Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: 1, title: t("lpHow1"), body: t("lpHow1Body"), icon: PaperPlaneTilt, bg: "bg-tangerine", faces: ["cr_reemq", "cr_hessamoves"] },
              { n: 2, title: t("lpHow2"), body: t("lpHow2Body"), icon: Lightning, bg: "bg-sky", faces: ["cr_laylaoils", "cr_omarlaughs"] },
              { n: 3, title: t("lpHow3"), body: t("lpHow3Body"), icon: Trophy, bg: "bg-bubblegum", faces: ["cr_saraalsheikh", "cr_yousefeats"] },
            ].map((step, i) => (
              <Item key={step.n}>
                <Parallax speed={0.08 * (i + 1)}>
                  <div className={cn("block relative min-h-[320px] overflow-hidden p-7 text-plum lift", step.bg)}>
                    <span className="absolute -end-10 -top-10 text-[14rem] font-black leading-none text-white/35">{step.n}</span>
                    <step.icon size={56} weight="duotone" className="wobble" />
                    <h3 className="mt-6 text-3xl font-extrabold">{step.title}</h3>
                    <p className="mt-3 text-[16px] font-semibold opacity-85">{step.body}</p>
                    <div className="mt-8 flex items-center gap-2">
                      <FacePile people={step.faces.map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean)} size={40} />
                      <span className="text-[13px] font-bold opacity-80">{step.faces.map((id) => s.creators.find((c) => c.id === id)?.name.split(" ")[0]).join(" & ")}</span>
                    </div>
                  </div>
                </Parallax>
              </Item>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { v: s.creators.length, l: t("lpStatCreators") },
              { v: sparksIssued, l: t("lpStatSparks") },
              { v: liveMissions, l: t("lpStatMissions") },
              { v: 6, l: t("lpStatMarkets") },
            ].map((st, i) => (
              <div key={st.l} className={cn("label-card p-5", i === 1 && "bg-lemon", i === 3 && "bg-lime")}>
                <div className="text-4xl font-extrabold tabular md:text-5xl"><Counter value={st.v} /></div>
                <div className="meta mt-1">{st.l}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- Missions on the board ---------- */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <Blobs colors={["var(--bubblegum)", "var(--lime)"]} className="opacity-50" />
        <div className="relative mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-4xl md:text-6xl">{t("lpMissionsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("lpMissionsSub")}</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {missions.map((m) => {
              const joined = Object.keys(m.entries).slice(0, 4).map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean);
              return (
                <Item key={m.id}>
                  <Ticket to="#/join" stub={<div className="flex items-center justify-between gap-2 text-[13px]"><FacePile people={joined} size={28} max={4} /><span className="rounded-full border-2 border-outline bg-lime px-2.5 py-0.5 font-extrabold text-plum">+{m.sparks} {t("sparks")}</span></div>}>
                    <div className="-mx-5 -mt-5 mb-4 h-32 overflow-hidden rounded-t-[18px] border-b-2 border-outline"><Graphic id={`mission-${m.type}`} compact /></div>
                    <div className="flex flex-wrap items-center gap-2"><MissionTypeChip type={m.type} />{m.brandId && brandOf(m.brandId) && <BrandMark brand={brandOf(m.brandId)!} size="sm" />}</div>
                    <div className="mt-3 text-xl font-extrabold leading-tight">{L(m.title)}</div>
                    <p className="mt-2 line-clamp-2 text-[14px] text-ink-2">{L(m.prompt)}</p>
                    <div className="meta mt-3">{date(m.window.start)} - {date(m.window.end)}</div>
                  </Ticket>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ---------- Levels ---------- */}
      <section className="relative border-y-2 border-outline bg-grape py-16 text-white lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-4xl md:text-6xl">{t("levelsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-white/80">{t("lpLevelsSub")}</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LEVEL_ORDER.map((l, i) => {
              const c = s.creators.find((x) => x.id === sample[l])!;
              const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
              return (
                <Item key={l} className={cn(i === 1 && "lg:mt-8", i === 2 && "lg:mt-16", i === 3 && "lg:mt-24")}>
                  <Tilt max={6}>
                    <MembershipCard id={c.id} hue={c.hue} name={c.name} handle={c.handle} level={l} since={date(c.joinedAt, { month: "short", year: "numeric" })} sparks={sparksFor(c.id)} />
                  </Tilt>
                  <div className="mt-4">
                    <div className="text-2xl font-extrabold">{t(`lv_${l}` as const)}</div>
                    <div className="text-[12.5px] font-bold text-white/70">{how}</div>
                    <p className="mt-2 text-[14px] text-white/85">{t(`lvUnlock_${l}` as const)}</p>
                  </div>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ---------- Season leaderboard ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="flex items-center gap-3"><Stamp pressed size={52} tone="marigold"><Crown size={20} weight="fill" /></Stamp><span className="meta">{t("ambassadorRound")} · {t("ap_voting")}</span></div>
            <h2 className="mt-4 text-4xl md:text-6xl">{t("seasonTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("seasonSubEntry")}</p>
            <div className="label-card mt-8 overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-outline bg-lemon px-5 py-3 text-plum"><span className="font-extrabold">{L(season.name)}</span><span className="meta !text-plum/70">{t("lpSeasonNow")}</span></div>
              <ul className="divide-y-2 divide-outline">
                {topFive.map((row, i) => (
                  <li key={row.creator.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-6 text-lg font-extrabold tabular text-ink-3">{i + 1}</span>
                    <Face name={row.creator.name} hue={row.creator.hue} size={44} className="rounded-full" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate font-extrabold">{row.creator.name}</span><LevelChip level={row.level} /></div>
                      <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-outline bg-surface-2"><motion.div className={cn("h-full", CANDIES[i % CANDIES.length])} initial={{ width: 0 }} whileInView={{ width: `${Math.max(8, (row.sparks / (topFive[0]?.sparks || 1)) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }} /></div>
                    </div>
                    <span className="text-lg font-extrabold tabular"><Counter value={row.sparks} /></span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-6 lg:col-span-5">
            <StampCard total={8} filled={5} size={56} label={<><span className="font-extrabold">{L(season.name)}</span><span className="meta">{t("stampCard")}</span></>} />
            <div className="block relative overflow-hidden bg-tangerine p-6 text-plum">
              <Confetti size={44} weight="duotone" className="wobble" />
              <div className="mt-3 text-2xl font-extrabold">{t("circleCamp")}</div>
              <p className="mt-2 text-[15px] font-semibold opacity-85">{t("circleCampBody")}</p>
              <div className="mt-5 flex items-center gap-2"><FacePile people={(season.ambassadors.cohort.length ? season.ambassadors.cohort : season.ambassadors.shortlist).map((id) => s.creators.find((c) => c.id === id)!).filter(Boolean)} size={40} max={6} /><span className="text-[13px] font-bold">{t("lv_ambassador")}</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Academy ---------- */}
      <section className="relative border-y-2 border-outline bg-surface py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 md:px-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <GraduationCap size={56} weight="duotone" className="wobble text-grape" />
            <h2 className="mt-4 text-4xl md:text-6xl">{t("lpAcademyTitle")}</h2>
            <p className="mt-3 text-lg text-ink-2">{t("lpAcademySub")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {s.academy.tracks.map((tr, i) => { const I = TRACK_ICON[tr.id] ?? GraduationCap; return <Squish key={tr.id} rotate={i % 2 ? 3 : -3}><span className={cn("inline-flex items-center gap-2 rounded-full border-2 border-outline px-3.5 py-2 text-[14px] font-extrabold text-plum shadow-[3px_3px_0_var(--outline)]", CANDIES[i % CANDIES.length])}><I size={18} weight="fill" />{L(tr.title)}</span></Squish>; })}
            </div>
            <div className="mt-6 flex items-center gap-3"><FacePile people={Array.from(new Set(s.mentorSessions.flatMap((m) => m.mentor.split(" and ")))).map((name) => ({ name, hue: 0 })).slice(0, 5)} size={40} /><span className="text-[14px] font-bold text-ink-2">{t("mentoringSub")}</span></div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <Tilt max={5}><Certificate title={L(track.title)} name="Layla Al Mansoori" date={date("2026-09-26")} meta={`${track.modules.length} ${t("modules")}`} sealed /></Tilt>
              <div className="label-card flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3"><Face name="Karim Nasser" hue={0} size={48} className="rounded-full" /><div><div className="font-extrabold">Karim Nasser</div><div className="text-[12.5px] text-ink-2">{t("role_content_reviewer")}</div></div></div>
                <div className="rounded-[18px] rounded-ss-none border-2 border-outline bg-lime-soft p-4 text-[15px] font-semibold"><ChatCircleDots size={18} weight="fill" className="mb-1 text-grape" /><p>{L(s.academy.tracks[0].modules[0].title)}: {L(s.academy.tracks[0].modules[0].summary)}</p></div>
                <div className="rounded-[18px] rounded-se-none border-2 border-outline bg-bubblegum-soft p-4 text-[15px] font-semibold self-end"><p>{L(s.creators[0].vibe)}</p></div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Brands ---------- */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <Reveal>
            <h2 className="text-4xl md:text-6xl">{t("brandsTitle")}</h2>
            <p className="mt-3 max-w-[60ch] text-lg text-ink-2">{t("brandsSub")}</p>
          </Reveal>
        </div>
        <Marquee duration={30} className="mt-10">
          {s.brands.map((b, i) => <span key={b.id} className={cn("mx-2 inline-flex items-center rounded-full border-2 border-outline px-5 py-3 text-xl font-extrabold text-plum shadow-[3px_3px_0_var(--outline)]", CANDIES[i % CANDIES.length])}><BrandMark brand={b} size="lg" className="!text-plum" /></span>)}
        </Marquee>
        <Marquee duration={50} reverse className="mt-6">
          {packs.map((p) => (
            <div key={p.id} className="mx-3 w-44 shrink-0">
              <ProductArt product={p} brand={brandOf(p.brandId)} className="aspect-[4/5] w-full rounded-[18px] border-2 border-outline" size="lg" />
            </div>
          ))}
        </Marquee>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6 lg:pb-24">
        <Reveal className="block relative overflow-hidden bg-lime p-8 text-plum md:p-14">
          <Blobs colors={["var(--lemon)", "var(--mint)"]} className="opacity-70" />
          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-4xl md:text-6xl">{t("lpCtaTitle")}</h2>
              <p className="mt-3 max-w-[50ch] text-lg font-semibold opacity-85">{t("lpCtaSub", { n: s.creators.length })}</p>
              <div className="mt-6 flex -space-x-3" dir="ltr">
                {s.creators.slice(6, 18).map((c, i) => <Float key={c.id} delay={i * 0.2} amplitude={5} duration={3 + (i % 3)}><Face name={c.name} hue={c.hue} size={48} className="rounded-full ring-[3px] ring-lime" /></Float>)}
              </div>
            </div>
            <Magnetic><Button size="lg" variant="accent" to="/join" iconEnd={<ArrowRight size={18} weight="bold" className="rtl:rotate-180" />}>{t("heroCta")}</Button></Magnetic>
          </div>
        </Reveal>
      </section>

      <footer className="border-t-2 border-outline py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 text-[13px] font-semibold text-ink-3 md:flex-row md:items-center md:justify-between md:px-6">
          <Logo compact />
          <p className="max-w-[70ch]">{t("footerNote")}</p>
          <Link to="/login" className="hover:text-ink">{t("signIn")}</Link>
        </div>
      </footer>
    </div>
  );
}
