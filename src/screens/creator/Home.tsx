import { Link } from "react-router-dom";
import { ArrowRight, Fire, Compass, Sparkle, Lock, Leaf, Repeat, SealCheck, Broadcast, Confetti, Target, SunHorizon, type Icon } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, ProgressRing, Section, EmptyState } from "../../ui/primitives";
import { Counter, Item, Reveal, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { activeFor, balance, earnedBadges, nextBestAction, standing, campaignById, creatorById } from "../../domain/selectors";
import { BrandMark, Points, StageChip, useBrand, useCurrentCreator } from "../shared/bits";
import type { Badge } from "../../domain/types";
import { cn } from "../../ui/cn";

const BADGE_ICONS: Record<string, Icon> = { Sparkle, Repeat, Compass, Fire, SealCheck, Broadcast, Confetti, Target, SunHorizon };

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
  const st = standing(s, me.id);
  const bal = balance(s, me.id);
  const active = activeFor(s, me.id);
  const earned = earnedBadges(s, me.id);
  const earnedIds = new Set(earned.map((b) => b.id));
  const recent = s.ledger.filter((l) => l.creatorId === me.id).slice(-5).reverse();

  const campaign = nba.participation ? campaignById(s, nba.participation.campaignId) : undefined;
  const reviewer = nba.participation?.reviews.at(-1)?.reviewerName ?? "";
  const vars = { campaign: campaign ? L(campaign.title) : "", courier: nba.participation?.shipment?.courier ?? "", reviewer, stage: nba.participation ? t(`stage_${nba.participation.stage}` as const) : "" };
  const nbaLink = nba.kind === "respond" ? "/creator/invitations" : nba.kind === "quest" ? `/creator/side-quests/${nba.questId}` : nba.participation ? `/creator/campaigns/${nba.participation.id}/${{ confirm_address: "kit", track: "kit", shoot: "kit", upload: "upload", revise: "feedback", publish: "publish", wait: "brief" }[nba.kind as string] ?? "brief"}` : "/creator/side-quests";
  const brand = useBrand(campaign?.brandId);

  return (
    <div className="flex flex-col gap-10">
      <Reveal inView={false}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[15px] text-ink-2">{greeting},</p>
            <h1 className="text-4xl md:text-5xl">{me.name.split(" ")[0]}.</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="card flex items-center gap-3 px-4 py-3">
              <ProgressRing value={st.progress} size={46} stroke={5}><Leaf size={16} weight="fill" className="text-leaf" /></ProgressRing>
              <div>
                <div className="text-[13px] font-semibold">{t(`st_${st.tier}` as const)}</div>
                <div className="text-[12px] text-ink-3">{st.next ? `${num(st.toNext)} ${t("toNext", { tier: t(`st_${st.next}` as const) })}` : t("topStanding")}</div>
              </div>
            </div>
            <div className="card flex items-center gap-3 px-4 py-3">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", me.streakWeeks > 0 ? "bg-marigold-soft text-marigold-ink" : "bg-surface-2 text-ink-3")}><Fire size={22} weight={me.streakWeeks > 0 ? "fill" : "regular"} /></span>
              <div>
                <div className="text-[13px] font-semibold"><Counter value={me.streakWeeks} /> {t("weeks")}</div>
                <div className="text-[12px] text-ink-3">{t("streak")}</div>
              </div>
            </div>
            <Link to="/creator/rewards" className="card press flex items-center gap-3 px-4 py-3 hover:border-ink-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Sparkle size={22} weight="fill" /></span>
              <div>
                <div className="text-[13px] font-semibold"><Counter value={bal} /> {t("pts")}</div>
                <div className="text-[12px] text-ink-3">{t("balance")}</div>
              </div>
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal inView={false} delay={0.08}>
        <Link to={nbaLink} className="card-soft press group relative block overflow-hidden bg-marigold-soft p-6 text-marigold-ink md:p-8">
          <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-marigold/30 transition-transform duration-700 group-hover:scale-125" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[60ch]">
              <div className="mb-3 flex items-center gap-2">
                <Chip tone="ink" className="bg-marigold-ink text-marigold-soft">{t("nextUp")}</Chip>
                {brand && <BrandMark brand={brand} size="sm" className="!text-marigold-ink" />}
              </div>
              <h2 className="text-2xl md:text-3xl">{t(`nba_${nba.kind}` as const)}</h2>
              <p className="mt-2 text-[15px] opacity-80">{t(`nba_${nba.kind}_body` as const, vars)}</p>
            </div>
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marigold-ink text-marigold-soft transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"><ArrowRight size={20} weight="bold" className="rtl:rotate-180" /></span>
          </div>
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
                    <Link to={`/creator/campaigns/${p.id}`} className="card press flex items-center gap-4 p-4 hover:border-ink-3">
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
      {creatorById(s, me.id) ? null : null}
    </div>
  );
}
