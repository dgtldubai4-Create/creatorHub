import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Compass, Sparkle, Repeat, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake, Fire, Lightning, Crown, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Section, EmptyState, Chip } from "../../ui/primitives";
import { Counter, Item, Reveal, Stagger, Tilt, Words } from "../../ui/motion";
import { Face } from "../../ui/Face";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { Label, MembershipCard, Stamp, StampCard, Ticket } from "../../ui/kit";
import { activeFor, balance, campaignQuote, earnedBadges, kitsFor, missionQuote, nextBestAction, level, campaignById, currentSeason, daysLeftInSeason, monthlyStreak, missionById, leaderboard } from "../../domain/selectors";
import { BrandMark, LevelChip, Points, StageChip, useBrand, useCurrentCreator } from "../shared/bits";
import { ExpiryNote, LevelChecklist, LevelKitCard } from "../shared/program";
import { KIT_LEVELS } from "../../domain/policy";
import type { Badge } from "../../domain/types";
import { cn } from "../../ui/cn";
import { vivid, vividGradient } from "../../ui/brandColor";
import { SocialWall, hasSocial } from "../../ui/Social";

const BADGE_ICONS: Record<string, Icon> = { Sparkle, Repeat, Compass, Fire, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake };
function BadgeIcon({ badge, size = 20 }: { badge: Badge; size?: number }) {
  const I = BADGE_ICONS[badge.icon] ?? Sparkle;
  return <I size={size} />;
}

export function CreatorHome() {
  const t = useT();
  const L = useL();
  const { num, relative, date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("goodMorning") : hour < 18 ? t("goodAfternoon") : t("goodEvening");
  const nba = nextBestAction(s, me.id);
  const lv = level(s, me.id);
  const season = currentSeason(s);
  const streak = monthlyStreak(s, me.id);
  const bal = balance(s, me.id);
  const active = activeFor(s, me.id);
  const earned = earnedBadges(s, me.id);
  const earnedIds = new Set(earned.map((b) => b.id));
  const recent = s.ledger.filter((l) => l.creatorId === me.id).slice(-5).reverse();
  const stamps = s.missions.filter((m) => m.entries[me.id]?.state === "completed" && (m.entries[me.id].submissions.at(-1)?.reviewedAt ?? "") >= season.start).length;
  const board = leaderboard(s, season);
  const rankIdx = board.findIndex((x) => x.creator.id === me.id);
  const rank = rankIdx + 1;
  const nStart = Math.max(0, Math.min(rankIdx - 2, board.length - 5));
  const neighbours = board.slice(nStart, nStart + 5);
  const feed = [...s.ledger].filter((l) => l.creatorId !== me.id && l.delta > 0).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((l) => ({ l, c: s.creators.find((c) => c.id === l.creatorId)! })).filter((x) => x.c);
  const starRow = board.find((b) => b.creator.id !== me.id) ?? board[0];
  const star = starRow?.creator ?? s.creators[0];
  const starRank = board.findIndex((b) => b.creator.id === star.id) + 1;

  const campaign = nba.participation ? campaignById(s, nba.participation.campaignId) : undefined;
  const reviewer = nba.participation?.reviews.at(-1)?.reviewerName ?? "";
  const mission = nba.missionId ? missionById(s, nba.missionId) : undefined;
  const track = nba.trackId ? s.academy.tracks.find((x) => x.id === nba.trackId) : undefined;
  const vars = { campaign: campaign ? L(campaign.title) : "", courier: nba.participation?.shipment?.courier ?? "", reviewer, stage: nba.participation ? t(`stage_${nba.participation.stage}` as const) : "", mission: mission ? L(mission.title) : "", track: track ? L(track.title) : "" };
  const nbaLink = nba.kind === "respond" ? "/creator/invitations" : nba.kind === "mission" ? `/creator/missions/${nba.missionId}` : nba.kind === "academy" ? `/creator/academy/${nba.trackId}` : nba.kind === "vote" ? "/creator/season" : nba.participation ? `/creator/campaigns/${nba.participation.id}/${{ confirm_address: "kit", track: "kit", shoot: "kit", upload: "upload", revise: "feedback", publish: "publish", wait: "brief" }[nba.kind as string] ?? "brief"}` : "/creator/missions";
  const brand = useBrand(campaign?.brandId ?? mission?.brandId);
  const sparksForAction = campaign ? campaignQuote(campaign, me).total : mission ? missionQuote(s, mission, me).total : track?.sparks;
  // The kit that needs the creator: unclaimed first, then one on the road, then a delivered box not yet unboxed.
  const kits = kitsFor(s, me.id);
  const unboxed = (lvl: (typeof KIT_LEVELS)[number]) => s.missions.some((m) => m.kitLevel === lvl && m.entries[me.id]?.state === "completed");
  const kit = kits.find((k) => !k.shipment) ?? kits.find((k) => k.shipment && k.shipment.status !== "delivered") ?? kits.find((k) => !unboxed(k.level));
  const nextKit = !kit && lv.next ? KIT_LEVELS.find((l) => l === lv.next && !kits.some((k) => k.level === l)) : undefined;
  const noteFrom = s.brandUsers.find((u) => u.name === reviewer) ?? s.brandUsers.find((u) => u.role === "campaign_manager") ?? s.brandUsers[0];

  return (
    <div className="flex flex-col gap-12">
      {/* Hello */}
      <section className="brand-fill pan relative overflow-hidden rounded-[1.75rem] p-6 md:p-10" style={{ backgroundImage: "linear-gradient(120deg, #14b85f 0%, #00753a 45%, #004d24 80%, #0f9a52 130%)", color: "#ffffff" }}>
        <span aria-hidden className="blob" style={{ background: "#ffa81f", width: "38%", paddingBottom: "38%", right: "-6%", top: "-40%", opacity: 0.45 }} />
        <span aria-hidden className="blob" style={{ background: "#3fe08a", width: "34%", paddingBottom: "34%", left: "-8%", bottom: "-60%", opacity: 0.4, animationDelay: "-6s" }} />
        <div className="relative mx-auto grid grid-cols-1 max-w-[1400px] items-center gap-8 lg:grid-cols-12">
          <Reveal inView={false} className="flex items-center gap-5 lg:col-span-7">
            <Face name={me.name} hue={me.hue} size={96} className="hidden shrink-0 ring-4 ring-white/25 sm:inline-flex" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><LevelChip level={lv.level} /><Chip className="!bg-white/15 !text-white">{me.city}</Chip></div>
              <h1 className="mt-4 text-4xl md:text-6xl"><Words text={`${greeting},`} /> <bdi><Words text={`${me.name.split(" ")[0]}.`} delay={0.2} /></bdi></h1>
              <p className="mt-3 max-w-[48ch] text-[16px] text-white/80">{t(`lvUnlock_${lv.level}` as const)}</p>
              <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  { v: bal, l: t("homeSparksBalance"), accent: true },
                  { v: streak, l: t("homeStreakMonths") },
                  { v: rank, l: t("homeRank"), raw: true },
                ].map((x) => (
                  <div key={x.l}>
                    <div className={cn("text-3xl font-medium tabular leading-none tracking-tight", x.accent && "text-[#ffc94f]")}>{x.raw ? `#${x.v}` : <Counter value={x.v} />}</div>
                    <div className="mt-2 text-[13px] text-white/70">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal inView={false} delay={0.1} className="lg:col-span-5">
            <Link to="/creator/season" className="float-y block"><Tilt max={7}><MembershipCard id={me.id} hue={me.hue} name={me.name} handle={me.handle} level={lv.level} since={date(me.joinedAt, { month: "short", year: "numeric" })} sparks={bal} /></Tilt></Link>
          </Reveal>
        </div>
      </section>

      {/* A note from the team: the next best action as a message */}
      <Reveal inView={false} delay={0.15}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2.5"><Face name={noteFrom.name} hue={200} size={28} /><span className="text-[13.5px] text-ink-2">{t("homeNote", { name: noteFrom.name.split(" ")[0] })}</span></div>
            <Ticket
              to={nbaLink}
              tone="paper"
              stub={
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2">{brand && <BrandMark brand={brand} size="sm" />}<span className="text-ink-3">{date(s.now)}</span></span>
                  <span className="flex items-center gap-3">{sparksForAction && <Points value={sparksForAction} sign className="text-accent-text" />}<span className="inline-flex items-center gap-1 font-medium">{t("letsGo")}<ArrowRight size={14} className="rtl:rotate-180" /></span></span>
                </div>
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-3xl font-medium tracking-tight md:text-4xl">{t(`nba_${nba.kind}` as const)}</div>
                  <p className="mt-3 max-w-[60ch] text-[16px] text-ink-2">{t(`nba_${nba.kind}_body` as const, vars)}</p>
                </div>
                <Chip tone="lime">{t("nextUp")}</Chip>
              </div>
            </Ticket>
          </div>
          <div className="lg:col-span-4">
            <div className="mb-3 flex h-7 items-center text-[13.5px] text-ink-2">{t("homeSpotlight")}</div>
            <Link to="/creator/season" className="label-card lift relative block overflow-hidden p-5">
              <div className="relative flex items-center gap-4">
                <Face name={star.name} hue={star.hue} size={56} />
                <div className="min-w-0"><div className="truncate text-lg font-medium">{star.name}</div><div className="text-[13px] text-ink-3">{star.city}</div></div>
              </div>
              <p className="relative mt-4 text-[15px] text-ink-2">{L(star.vibe)}</p>
              <div className="relative mt-4 flex items-center gap-2 text-[13px] font-medium"><Crown size={15} weight="fill" className="text-accent-text" />#{starRank}, {num(starRow?.sparks ?? 0)} {t("sparks")}</div>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Next level and the box that comes with it */}
      <Reveal inView={false} delay={0.2}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7"><LevelChecklist creatorId={me.id} /></div>
          <div className="flex flex-col gap-3 lg:col-span-5">
            {kit ? <LevelKitCard level={kit.level} kit={kit} creatorId={me.id} hero={!kit.shipment} /> : nextKit ? <><div className="meta">{t("kitNext")}</div><LevelKitCard level={nextKit} creatorId={me.id} /></> : null}
            <ExpiryNote creatorId={me.id} />
            <Link to="/creator/sparks" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink hover:underline">{t("viewSparksTable")}<ArrowRight size={14} className="rtl:rotate-180" /></Link>
          </div>
        </div>
      </Reveal>

      {/* From Dabur's own feed: renders only when posts have been imported */}
      {hasSocial() && <Section title={t("socialTitle")} sub={t("socialSub")}><SocialWall max={5} /></Section>}

      {/* Your people */}
      <Section title={t("homeSquad")} sub={t("homeSquadSub")} action={<Button size="sm" variant="ghost" to="/creator/season">{t("viewAll")}</Button>}>
        <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {neighbours.map((row) => {
            const isMe = row.creator.id === me.id;
            const pos = board.findIndex((x) => x.creator.id === row.creator.id) + 1;
            return (
              <Item key={row.creator.id}>
                <div className={cn("label-card lift flex flex-col items-center gap-2 p-4 text-center", isMe && "!border-brand !bg-brand-soft")}>
                  <span className="meta self-start !text-inherit opacity-70">#{pos}</span>
                  <Face name={row.creator.name} hue={row.creator.hue} size={56} />
                  <div className="truncate font-semibold">{isMe ? t("thatsYou") : row.creator.name.split(" ")[0]}</div>
                  <div className="text-[12.5px] font-medium opacity-70">{row.creator.city}</div>
                  <div className="text-lg font-semibold tabular">{num(row.sparks)}</div>
                  {!isMe && <div className="text-[11.5px] font-medium opacity-70">{pos < rank ? t("aheadOfYou") : t("behindYou")}</div>}
                  {isMe && lv.next && lv.toNext > 0 && <div className="text-[11.5px] font-medium opacity-70">{num(lv.toNext)} → {t(`lv_${lv.next}` as const)}</div>}
                </div>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-3">
          <Section title={t("yourJourneys")} action={<Button size="sm" variant="ghost" to="/creator/campaigns">{t("viewAll")}</Button>}>
            {active.length === 0 ? (
              <EmptyState icon={<Compass size={24} />} title={t("noCampaigns")} body={t("noCampaignsBody")} action={<Button variant="secondary" to="/creator/invitations">{t("invitations")}</Button>} />
            ) : (
              <Stagger className="grid grid-cols-1 gap-3">
                {active.slice(0, 4).map((p) => {
                  const c = campaignById(s, p.campaignId)!;
                  const b = s.brands.find((x) => x.id === c.brandId)!;
                  const last = p.stageLog[p.stageLog.length - 1];
                  return (
                    <Item key={p.id}>
                      <Link to={`/creator/campaigns/${p.id}`} className="block">
                        <Label brandId={b.id} className="lift flex items-center gap-4 p-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]" style={{ backgroundImage: vividGradient(b.id), color: vivid(b.id).on }}><Lightning size={20} weight="fill" /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><BrandMark brand={b} size="sm" /><span className="text-[12px] font-medium text-ink-3">{relative(last.at)}</span></div>
                            <div className="mt-1 truncate text-[17px] font-semibold">{L(c.title)}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                          </div>
                          <Points value={p.award?.total ?? campaignQuote(c, me).total} className="hidden shrink-0 sm:inline-flex" />
                        </Label>
                      </Link>
                    </Item>
                  );
                })}
              </Stagger>
            )}
          </Section>
          <Section title={t("sheetOfStamps")} sub={`${earned.length}/${s.badges.length} ${t("earned")}`}>
            <div className="label-card grid grid-cols-4 gap-x-2 gap-y-4 p-4 sm:grid-cols-7">
              {s.badges.map((b) => {
                const on = earnedIds.has(b.id);
                return (
                  <div key={b.id} title={`${L(b.title)}: ${L(b.description)}`} className="flex flex-col items-center gap-1.5 text-center">
                    <Stamp pressed={on} size={50} animate={false} tone="leaf" icon={on ? <BadgeIcon badge={b} /> : undefined} />
                    <span className={cn("text-[11px] font-medium leading-tight", on ? "" : "text-ink-3")}>{L(b.title)}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-2">
          <Section title={t("thisSeason")} sub={`${L(season.name)} · ${t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}`} action={<Link to="/creator/season" className="text-[13px] font-medium text-ink-2 hover:text-ink">{t("view")}</Link>}>
            <StampCard total={8} filled={Math.min(8, stamps)} size={44} label={<><span className="font-semibold">{num(lv.seasonSparks)} {t("sparks")}</span><span className="meta">{t("stampCard")}</span></>} />
          </Section>
          <Section title={t("homeFeed")}>
            <ul className="label-card divide-y divide-line overflow-hidden">
              {feed.map(({ l, c }, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3 px-4 py-3">
                  <Face name={c.name} hue={c.hue} size={34} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium"><span className="font-semibold">{c.name.split(" ")[0]}</span> · {L(l.reason)}</div><div className="text-[12px] font-medium text-ink-3">{c.city} · {relative(l.at)}</div></div>
                  <span className="shrink-0 text-[13px] font-medium tabular text-accent-text" dir="ltr">+{num(l.delta)}</span>
                </motion.li>
              ))}
            </ul>
          </Section>
          <Section title={t("recentPoints")}>
            {recent.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="label-card divide-y divide-line overflow-hidden">
                {recent.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0"><div className="truncate text-[14px] font-medium">{L(l.reason)}</div><div className="text-[12px] font-medium text-ink-3">{relative(l.at)}</div></div>
                    <span className={cn("shrink-0 font-semibold tabular", l.delta < 0 ? "text-rose" : "text-leaf")}>{l.delta > 0 ? "+" : ""}{num(l.delta)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
