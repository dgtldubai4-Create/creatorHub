import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Compass, Sparkle, Repeat, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake, Fire, Lightning, Crown, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Section, EmptyState, Chip } from "../../ui/primitives";
import { Blobs, Counter, Float, Item, Reveal, Squish, Stagger, Tilt } from "../../ui/motion";
import { Face } from "../../ui/Face";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { Label, MembershipCard, Stamp, StampCard, Ticket } from "../../ui/kit";
import { activeFor, balance, earnedBadges, nextBestAction, level, campaignById, currentSeason, daysLeftInSeason, monthlyStreak, missionById, leaderboard } from "../../domain/selectors";
import { BrandMark, LevelChip, Points, StageChip, useBrand, useCurrentCreator } from "../shared/bits";
import type { Badge } from "../../domain/types";
import { cn } from "../../ui/cn";

const BADGE_ICONS: Record<string, Icon> = { Sparkle, Repeat, Compass, Fire, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake };
const CANDIES = ["bg-lime", "bg-tangerine", "bg-bubblegum", "bg-sky", "bg-lemon", "bg-mint"];
function BadgeIcon({ badge, size = 20 }: { badge: Badge; size?: number }) {
  const I = BADGE_ICONS[badge.icon] ?? Sparkle;
  return <I size={size} weight="fill" />;
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
  const sparksForAction = campaign?.points ?? mission?.sparks ?? track?.sparks;
  const noteFrom = s.brandUsers.find((u) => u.name === reviewer) ?? s.brandUsers.find((u) => u.role === "campaign_manager") ?? s.brandUsers[0];

  return (
    <div className="flex flex-col gap-12">
      {/* Hello */}
      <section className="relative -mx-4 -mt-6 overflow-hidden border-b-2 border-outline px-4 pb-10 pt-8 md:-mx-6 md:-mt-8 md:px-6 md:pt-12">
        <Blobs colors={["var(--lime)", "var(--bubblegum)", "var(--sky)"]} />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-8 lg:grid-cols-12">
          <Reveal inView={false} className="flex items-center gap-5 lg:col-span-7">
            <Float amplitude={6} duration={5}><Squish><Face name={me.name} hue={me.hue} size={132} className="shrink-0 border-2 border-outline shadow-[6px_6px_0_var(--outline)]" /></Squish></Float>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><LevelChip level={lv.level} /><Chip tone="ink">{me.city}</Chip></div>
              <h1 className="mt-3 text-5xl md:text-7xl">{greeting}, {me.name.split(" ")[0]}!</h1>
              <p className="mt-3 max-w-[48ch] text-[16px] font-semibold text-ink-2">{t(`lvUnlock_${lv.level}` as const)}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { v: bal, l: t("homeSparksBalance"), bg: "bg-lime" },
                  { v: streak, l: t("homeStreakMonths"), bg: "bg-lemon" },
                  { v: rank, l: `#${rank} ${t("homeRank")}`, bg: "bg-bubblegum", raw: true },
                ].map((x) => (
                  <div key={x.l} className={cn("rounded-[18px] border-2 border-outline px-4 py-2.5 text-plum shadow-[3px_3px_0_var(--outline)]", x.bg)}>
                    <div className="text-2xl font-extrabold tabular leading-none">{x.raw ? `#${x.v}` : <Counter value={x.v} />}</div>
                    <div className="meta mt-1 !text-plum/70">{x.raw ? t("homeRank") : x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal inView={false} delay={0.1} className="lg:col-span-5">
            <Link to="/creator/season" className="lift block"><Tilt max={6}><MembershipCard id={me.id} hue={me.hue} name={me.name} handle={me.handle} level={lv.level} since={date(me.joinedAt, { month: "short", year: "numeric" })} sparks={bal} /></Tilt></Link>
          </Reveal>
        </div>
      </section>

      {/* A note from the team: the next best action as a message */}
      <Reveal inView={false} delay={0.15}>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-3 flex items-center gap-2"><Face name={noteFrom.name} hue={200} size={32} /><span className="meta">{t("homeNote", { name: noteFrom.name.split(" ")[0] })}</span></div>
            <Ticket
              to={nbaLink}
              tone="marigold"
              stub={
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2">{brand && <BrandMark brand={brand} size="sm" className="!text-plum" />}<span className="font-bold text-plum/70">{date(s.now)}</span></span>
                  <span className="flex items-center gap-3">{sparksForAction && <Points value={sparksForAction} sign className="text-plum" />}<span className="inline-flex items-center gap-1 font-extrabold text-plum">{t("letsGo")}<ArrowRight size={14} weight="bold" className="rtl:rotate-180" /></span></span>
                </div>
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-3xl font-extrabold md:text-4xl">{t(`nba_${nba.kind}` as const)}</div>
                  <p className="mt-2 max-w-[60ch] text-[16px] font-semibold text-plum/80">{t(`nba_${nba.kind}_body` as const, vars)}</p>
                </div>
                <Stamp pressed size={72} tone="ink" animate={false}><span className="text-[10px]">{t("nextUp")}</span></Stamp>
              </div>
            </Ticket>
          </div>
          <div className="lg:col-span-4">
            <div className="mb-3 meta">{t("homeSpotlight")}</div>
            <Link to="/creator/season" className={cn("block lift relative overflow-hidden p-5 text-plum", CANDIES[star.hue % CANDIES.length])}>
              <span aria-hidden className="absolute -end-10 -top-10 h-32 w-32 rounded-full bg-white/30" />
              <div className="relative flex items-center gap-4">
                <Face name={star.name} hue={star.hue} size={72} className="border-2 border-outline" />
                <div className="min-w-0"><div className="truncate text-xl font-extrabold">{star.name}</div><div className="text-[13px] font-bold opacity-70">{star.city}</div></div>
              </div>
              <p className="relative mt-3 text-[15px] font-bold">"{L(star.vibe)}"</p>
              <div className="relative mt-3 flex items-center gap-2 text-[13px] font-extrabold"><Crown size={16} weight="fill" />#{starRank} · {num(starRow?.sparks ?? 0)} {t("sparks")}</div>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Your people */}
      <Section title={t("homeSquad")} sub={t("homeSquadSub")} action={<Button size="sm" variant="ghost" to="/creator/season">{t("viewAll")}</Button>}>
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {neighbours.map((row) => {
            const isMe = row.creator.id === me.id;
            const pos = board.findIndex((x) => x.creator.id === row.creator.id) + 1;
            return (
              <Item key={row.creator.id}>
                <div className={cn("label-card lift flex flex-col items-center gap-2 p-4 text-center", isMe && "bg-lime text-plum")}>
                  <span className="meta self-start !text-inherit opacity-70">#{pos}</span>
                  <Squish><Face name={row.creator.name} hue={row.creator.hue} size={76} /></Squish>
                  <div className="truncate font-extrabold">{isMe ? t("thatsYou") : row.creator.name.split(" ")[0]}</div>
                  <div className="text-[12.5px] font-bold opacity-70">{row.creator.city}</div>
                  <div className="text-lg font-extrabold tabular">{num(row.sparks)}</div>
                  {!isMe && <div className="text-[11.5px] font-bold opacity-70">{pos < rank ? t("aheadOfYou") : t("behindYou")}</div>}
                  {isMe && lv.next && lv.toNext > 0 && <div className="text-[11.5px] font-bold opacity-70">{num(lv.toNext)} → {t(`lv_${lv.next}` as const)}</div>}
                </div>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="flex flex-col gap-10 lg:col-span-3">
          <Section title={t("yourJourneys")} action={<Button size="sm" variant="ghost" to="/creator/campaigns">{t("viewAll")}</Button>}>
            {active.length === 0 ? (
              <EmptyState icon={<Compass size={24} weight="duotone" />} title={t("noCampaigns")} body={t("noCampaignsBody")} action={<Button variant="secondary" to="/creator/invitations">{t("invitations")}</Button>} />
            ) : (
              <Stagger className="grid gap-3">
                {active.slice(0, 4).map((p, i) => {
                  const c = campaignById(s, p.campaignId)!;
                  const b = s.brands.find((x) => x.id === c.brandId)!;
                  const last = p.stageLog[p.stageLog.length - 1];
                  return (
                    <Item key={p.id}>
                      <Link to={`/creator/campaigns/${p.id}`} className="block">
                        <Label brandId={b.id} className="lift flex items-center gap-4 p-4">
                          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-outline text-plum", CANDIES[i % CANDIES.length])}><Lightning size={22} weight="fill" /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><BrandMark brand={b} size="sm" /><span className="text-[12px] font-bold text-ink-3">{relative(last.at)}</span></div>
                            <div className="mt-1 truncate text-[17px] font-extrabold">{L(c.title)}</div>
                            <div className="mt-2 flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                          </div>
                          <Points value={c.points} className="shrink-0" />
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
                    <Squish><Stamp pressed={on} size={54} animate={false} tone={on ? "ink" : "leaf"} icon={on ? <BadgeIcon badge={b} /> : undefined} /></Squish>
                    <span className={cn("text-[11px] font-bold leading-tight", on ? "" : "text-ink-3")}>{L(b.title)}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <div className="flex flex-col gap-10 lg:col-span-2">
          <Section title={t("thisSeason")} sub={`${L(season.name)} · ${t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}`} action={<Link to="/creator/season" className="text-[13px] font-extrabold text-grape hover:underline">{t("view")}</Link>}>
            <StampCard total={8} filled={Math.min(8, stamps)} size={44} label={<><span className="font-extrabold">{num(lv.seasonSparks)} {t("sparks")}</span><span className="meta">{t("stampCard")}</span></>} />
          </Section>
          <Section title={t("homeFeed")}>
            <ul className="label-card divide-y-2 divide-outline overflow-hidden">
              {feed.map(({ l, c }, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3 px-4 py-3">
                  <Face name={c.name} hue={c.hue} size={38} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold"><span className="font-extrabold">{c.name.split(" ")[0]}</span> · {L(l.reason)}</div><div className="text-[12px] font-bold text-ink-3">{c.city} · {relative(l.at)}</div></div>
                  <span className="shrink-0 rounded-full border-2 border-outline bg-lime px-2 py-0.5 text-[12px] font-extrabold tabular text-plum">+{num(l.delta)}</span>
                </motion.li>
              ))}
            </ul>
          </Section>
          <Section title={t("recentPoints")}>
            {recent.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="label-card divide-y-2 divide-outline overflow-hidden">
                {recent.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0"><div className="truncate text-[14px] font-bold">{L(l.reason)}</div><div className="text-[12px] font-bold text-ink-3">{relative(l.at)}</div></div>
                    <span className={cn("shrink-0 font-extrabold tabular", l.delta < 0 ? "text-rose" : "text-leaf")}>{l.delta > 0 ? "+" : ""}{num(l.delta)}</span>
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
