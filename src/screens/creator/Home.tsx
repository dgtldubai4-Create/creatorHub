import { Link } from "react-router-dom";
import { ArrowRight, Compass, Sparkle, Repeat, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake, Fire, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Section, EmptyState } from "../../ui/primitives";
import { Item, Reveal, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { Label, MembershipCard, Stamp, StampCard, Ticket } from "../../ui/kit";
import { activeFor, balance, earnedBadges, nextBestAction, level, campaignById, currentSeason, daysLeftInSeason, monthlyStreak, missionById, leaderboard } from "../../domain/selectors";
import { BrandMark, Points, StageChip, useBrand, useCurrentCreator } from "../shared/bits";
import type { Badge } from "../../domain/types";
import { cn } from "../../ui/cn";

const BADGE_ICONS: Record<string, Icon> = { Sparkle, Repeat, Compass, Fire, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake };
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
  const rank = leaderboard(s, season).findIndex((x) => x.creator.id === me.id) + 1;

  const campaign = nba.participation ? campaignById(s, nba.participation.campaignId) : undefined;
  const reviewer = nba.participation?.reviews.at(-1)?.reviewerName ?? "";
  const mission = nba.missionId ? missionById(s, nba.missionId) : undefined;
  const track = nba.trackId ? s.academy.tracks.find((x) => x.id === nba.trackId) : undefined;
  const vars = { campaign: campaign ? L(campaign.title) : "", courier: nba.participation?.shipment?.courier ?? "", reviewer, stage: nba.participation ? t(`stage_${nba.participation.stage}` as const) : "", mission: mission ? L(mission.title) : "", track: track ? L(track.title) : "" };
  const nbaLink = nba.kind === "respond" ? "/creator/invitations" : nba.kind === "mission" ? `/creator/missions/${nba.missionId}` : nba.kind === "academy" ? `/creator/academy/${nba.trackId}` : nba.kind === "vote" ? "/creator/season" : nba.participation ? `/creator/campaigns/${nba.participation.id}/${{ confirm_address: "kit", track: "kit", shoot: "kit", upload: "upload", revise: "feedback", publish: "publish", wait: "brief" }[nba.kind as string] ?? "brief"}` : "/creator/missions";
  const brand = useBrand(campaign?.brandId ?? mission?.brandId);
  const sparksForAction = campaign?.points ?? mission?.sparks ?? track?.sparks;

  return (
    <div className="flex flex-col gap-10">
      <Reveal inView={false}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="meta">{greeting}</div>
            <h1 className="mt-2 text-5xl md:text-6xl">{me.name.split(" ")[0]}</h1>
            <p className="mt-3 max-w-[48ch] text-[15px] text-ink-2">{t(`lvUnlock_${lv.level}` as const)}</p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
              <span><span className="font-semibold tabular">{num(bal)}</span> <span className="text-ink-3">{t("sparks")}</span></span>
              <span><span className="font-semibold tabular">{streak}</span> <span className="text-ink-3">{t("streak").toLowerCase()} · {t("weeks") === "weeks" ? "months" : t("weeks")}</span></span>
              <span><span className="font-semibold tabular">{rank > 0 ? `#${rank}` : "-"}</span> <span className="text-ink-3">{t("leaderboardTitle").toLowerCase()}</span></span>
            </div>
          </div>
          <Link to="/creator/season" className="lift block lg:col-span-5"><MembershipCard id={me.id} name={me.name} handle={me.handle} level={lv.level} since={date(me.joinedAt, { month: "short", year: "numeric" })} sparks={bal} /></Link>
        </div>
      </Reveal>

      <Reveal inView={false} delay={0.08}>
        <div className="meta mb-3">{t("todaysTicket")}</div>
        <Ticket
          to={nbaLink}
          stub={
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="flex items-center gap-2">{brand && <BrandMark brand={brand} size="sm" />}<span className="text-ink-3">{date(s.now)}</span></span>
              <span className="flex items-center gap-3">{sparksForAction && <Points value={sparksForAction} sign />}<span className="inline-flex items-center gap-1 font-semibold text-leaf">{t("letsGo")}<ArrowRight size={14} weight="bold" className="rtl:rotate-180" /></span></span>
            </div>
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl font-semibold md:text-3xl">{t(`nba_${nba.kind}` as const)}</div>
              <p className="mt-2 max-w-[60ch] text-[15px] text-ink-2">{t(`nba_${nba.kind}_body` as const, vars)}</p>
            </div>
            <Stamp pressed size={64} tone="marigold" animate={false}><span className="text-[9px]">{t("nextUp")}</span></Stamp>
          </div>
        </Ticket>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="flex flex-col gap-10 lg:col-span-3">
          <Section title={t("yourJourneys")} action={<Button size="sm" variant="ghost" to="/creator/campaigns">{t("viewAll")}</Button>}>
            {active.length === 0 ? (
              <EmptyState icon={<Compass size={24} weight="duotone" />} title={t("noCampaigns")} body={t("noCampaignsBody")} action={<Button variant="secondary" to="/creator/invitations">{t("invitations")}</Button>} />
            ) : (
              <Stagger className="grid gap-3">
                {active.slice(0, 4).map((p) => {
                  const c = campaignById(s, p.campaignId)!;
                  const b = s.brands.find((x) => x.id === c.brandId)!;
                  const last = p.stageLog[p.stageLog.length - 1];
                  return (
                    <Item key={p.id}>
                      <Link to={`/creator/campaigns/${p.id}`} className="block">
                        <Label brandId={b.id} className="lift flex items-center gap-4 p-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><BrandMark brand={b} size="sm" /><span className="text-[12px] text-ink-3">{relative(last.at)}</span></div>
                            <div className="mt-1 truncate text-[17px] font-semibold">{L(c.title)}</div>
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
                    <Stamp pressed={on} size={54} animate={false} icon={on ? <BadgeIcon badge={b} /> : undefined} />
                    <span className={cn("text-[11px] leading-tight", on ? "font-medium" : "text-ink-3")}>{L(b.title)}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <div className="flex flex-col gap-10 lg:col-span-2">
          <Section title={t("thisSeason")} sub={`${L(season.name)} · ${t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}`} action={<Link to="/creator/season" className="text-[13px] font-medium text-leaf hover:underline">{t("view")}</Link>}>
            <StampCard total={8} filled={Math.min(8, stamps)} size={44} label={<><span className="font-semibold">{num(lv.seasonSparks)} {t("sparks")}</span><span className="meta">{t("stampCard")}</span></>} />
            <p className="mt-2 text-[12.5px] text-ink-3">{t("stampCardHint")}</p>
          </Section>
          <Section title={t("recentPoints")}>
            {recent.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="label-card divide-y divide-line">
                {recent.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0"><div className="truncate text-[14px] font-medium">{L(l.reason)}</div><div className="text-[12px] text-ink-3">{relative(l.at)}</div></div>
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
