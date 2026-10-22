import { Link } from "react-router-dom";
import { ArrowRight, Fire, Compass, Sparkle, Lock, Repeat, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake, Lightning, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Section, EmptyState } from "../../ui/primitives";
import { Counter, Item, Reveal, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { activeFor, balance, earnedBadges, nextBestAction, level, campaignById, currentSeason, daysLeftInSeason, monthlyStreak, missionById } from "../../domain/selectors";
import { ArtSlot } from "../../ui/ArtSlot";
import { BrandMark, LevelEmblem, Points, StageChip, useBrand, useCurrentCreator } from "../shared/bits";
import type { Badge } from "../../domain/types";
import { cn } from "../../ui/cn";

const BADGE_ICONS: Record<string, Icon> = { Sparkle, Repeat, Compass, Fire, SealCheck, Broadcast, Confetti, Target, SunHorizon, Coins, GraduationCap, Star, UsersThree, Handshake };

function BadgeIcon({ badge, size = 22 }: { badge: Badge; size?: number }) {
  const I = BADGE_ICONS[badge.icon] ?? Sparkle;
  return <I size={size} weight="duotone" />;
}

export function CreatorHome() {
  const t = useT();
  const L = useL();
  const { num, relative } = useFormat();
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

  const campaign = nba.participation ? campaignById(s, nba.participation.campaignId) : undefined;
  const reviewer = nba.participation?.reviews.at(-1)?.reviewerName ?? "";
  const mission = nba.missionId ? missionById(s, nba.missionId) : undefined;
  const track = nba.trackId ? s.academy.tracks.find((x) => x.id === nba.trackId) : undefined;
  const vars = { campaign: campaign ? L(campaign.title) : "", courier: nba.participation?.shipment?.courier ?? "", reviewer, stage: nba.participation ? t(`stage_${nba.participation.stage}` as const) : "", mission: mission ? L(mission.title) : "", track: track ? L(track.title) : "" };
  const nbaLink = nba.kind === "respond" ? "/creator/invitations" : nba.kind === "mission" ? `/creator/missions/${nba.missionId}` : nba.kind === "academy" ? `/creator/academy/${nba.trackId}` : nba.kind === "vote" ? "/creator/season" : nba.participation ? `/creator/campaigns/${nba.participation.id}/${{ confirm_address: "kit", track: "kit", shoot: "kit", upload: "upload", revise: "feedback", publish: "publish", wait: "brief" }[nba.kind as string] ?? "brief"}` : "/creator/missions";
  const brand = useBrand(campaign?.brandId);

  return (
    <div className="flex flex-col gap-10">
      <Reveal inView={false}>
        <div className="relative -mx-4 overflow-hidden bg-forest px-4 pb-8 pt-7 text-white md:mx-0 md:rounded-[var(--radius-card)] md:px-8 md:pb-10 md:pt-9">
          <div className="pattern-dots absolute inset-0 text-lime/15" />
          <div className="blob absolute -end-16 -top-24 h-72 w-72 bg-marigold/90" />
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="text-[15px] font-medium text-white/70">{greeting},</p>
              <h1 className="text-5xl font-extrabold tracking-[-0.04em] text-white md:text-6xl">{me.name.split(" ")[0]}<span className="text-lime">.</span></h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/creator/season" className="sticker bg-lime text-lime-ink" style={{ ["--tilt" as string]: "-3deg" }}><LevelEmblem level={lv.level} size={22} className="bg-forest text-lime" />{t(`lv_${lv.level}` as const)}{lv.next && lv.next !== "ambassador" && <span className="opacity-70">· {t("toNextLevel", { n: num(lv.toNext), level: t(`lv_${lv.next}` as const) })}</span>}</Link>
                <span className="sticker bg-marigold text-marigold-ink" style={{ ["--tilt" as string]: "2deg" }}><Fire size={14} weight="fill" />{t("streakMonths", { n: streak })}</span>
                <Link to="/creator/rewards" className="sticker bg-white text-forest" style={{ ["--tilt" as string]: "-2deg" }}><Sparkle size={14} weight="fill" className="text-marigold" /><Counter value={bal} format={num} /> {t("sparks")}</Link>
              </div>
            </div>
            <Link to={nbaLink} className="group relative lg:col-span-5">
              <div className="lift relative rotate-[-1.5deg] rounded-2xl bg-white p-5 text-ink shadow-float transition-transform group-hover:rotate-0">
                <span className="absolute -top-3 start-5 sticker bg-marigold text-marigold-ink" style={{ ["--tilt" as string]: "-4deg" }}>{t("nextUp")}</span>
                <div className="mt-2 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    {brand && <BrandMark brand={brand} size="sm" />}
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight">{t(`nba_${nba.kind}` as const)}</h2>
                    <p className="mt-1.5 text-[14px] text-ink-2">{t(`nba_${nba.kind}_body` as const, vars)}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-lime transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"><ArrowRight size={20} weight="bold" className="rtl:rotate-180" /></span>
                </div>
                <div className="mt-4 border-t border-dashed border-line-2 pt-3 text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">{t("yourTicket")}</div>
              </div>
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal inView={false} delay={0.12}>
        <Link to="/creator/season" className="lift card flex items-center gap-4 overflow-hidden p-0">
          <div className="h-20 w-28 shrink-0"><ArtSlot id={`season-${season.id === "sn_1" ? "summer-hair-rescue" : season.id === "sn_2" ? "golden-hour" : "winter-glow"}`} /></div>
          <div className="min-w-0 flex-1 py-3">
            <div className="flex items-center gap-2 text-[12.5px] text-ink-3"><Lightning size={14} weight="fill" className="text-marigold" />{t("thisSeason")} · {t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}</div>
            <div className="truncate text-[17px] font-bold">{L(season.name)}</div>
            <div className="truncate text-[13px] text-ink-2">{t("seasonSparks")}: {num(lv.seasonSparks)} · {t("finalePrize")}: {L(season.finalePrize)}</div>
          </div>
          <ArrowRight size={18} weight="bold" className="me-5 shrink-0 text-ink-3 rtl:rotate-180" />
        </Link>
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-5">
        <Section title={t("yourJourneys")} className="lg:col-span-3" action={<Button size="sm" variant="ghost" to="/creator/campaigns">{t("viewAll")}</Button>}>
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
                    <Link to={`/creator/campaigns/${p.id}`} className="lift card flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <BrandMark brand={b} size="sm" />
                          <span className="text-[12px] text-ink-3">{relative(last.at)}</span>
                        </div>
                        <div className="mt-1 truncate text-[16px] font-semibold">{L(c.title)}</div>
                        <div className="mt-2 flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                      </div>
                      <Points value={c.points} className="shrink-0" />
                    </Link>
                  </Item>
                );
              })}
            </Stagger>
          )}
        </Section>

        <div className="flex flex-col gap-10 lg:col-span-2">
          <Section title={t("badges")} sub={`${earned.length}/${s.badges.length} ${t("earned")}`}>
            <div className="grid grid-cols-3 gap-2">
              {s.badges.map((b) => {
                const on = earnedIds.has(b.id);
                return (
                  <div key={b.id} title={`${L(b.title)}: ${L(b.description)}`} className={cn("flex flex-col items-center gap-2 rounded-2xl p-3 text-center", on ? "card" : "bg-surface-2 text-ink-3")}>
                    <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", on ? "bg-leaf-soft text-leaf" : "bg-surface text-ink-3")}>{on ? <BadgeIcon badge={b} /> : <Lock size={18} />}</span>
                    <span className="text-[12px] font-medium leading-tight">{L(b.title)}</span>
                  </div>
                );
              })}
            </div>
          </Section>
          <Section title={t("recentPoints")}>
            {recent.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="card divide-y divide-line">
                {recent.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{L(l.reason)}</div>
                      <div className="text-[12px] text-ink-3">{relative(l.at)}</div>
                    </div>
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
