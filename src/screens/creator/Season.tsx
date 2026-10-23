import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Crown, Star, Fire, Tent, Check } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, PageHeader, Section, SimulatedTag } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { Label, MembershipCard, Stamp, StampCard } from "../../ui/kit";
import { STREAK_BONUS } from "../../domain/reducer";
import { currentSeason, daysLeftInSeason, leaderboard, level, LEVEL_ORDER, LEVEL_RULES, monthlyStreak, balance } from "../../domain/selectors";
import { LevelChip, useCurrentCreator } from "../shared/bits";
import { cn } from "../../ui/cn";

export function SeasonPage() {
  const t = useT();
  const L = useL();
  const { num, date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const season = currentSeason(s);
  const lv = level(s, me.id);
  const board = leaderboard(s, season);
  const myRank = board.findIndex((x) => x.creator.id === me.id) + 1;
  const amb = season.ambassadors;
  const candidates = [...amb.shortlist, ...amb.wildcards];
  const voteCounts = candidates.reduce((acc, id) => ({ ...acc, [id]: Object.values(amb.votes).filter((v) => v === id).length }), {} as Record<string, number>);
  const myVote = amb.votes[me.id];
  const inRunning = candidates.includes(me.id);
  const streak = monthlyStreak(s, me.id);
  const past = s.seasons.filter((x) => x.id !== season.id && x.ambassadors.phase === "selected");
  const upcoming = s.seasons.filter((x) => x.start > season.end);
  const [showAll, setShowAll] = useState(false);
  const stamps = s.missions.filter((m) => m.entries[me.id]?.state === "completed" && (m.entries[me.id].submissions.at(-1)?.reviewedAt ?? "") >= season.start).length;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={L(season.name)} sub={L(season.theme)} actions={<><Chip tone="marigold">{t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}</Chip><Chip>{date(season.start)} - {date(season.end)}</Chip></>} />

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <StampCard total={8} filled={Math.min(8, stamps)} size={52} label={<><span className="font-semibold">{t("stampCard")}</span><span className="meta">{num(lv.seasonSparks)} {t("sparks")}</span></>} />
          <p className="mt-2 text-[12.5px] text-ink-3">{t("stampCardHint")}</p>
        </div>
        <div className="lg:col-span-4"><MembershipCard id={me.id} name={me.name} handle={me.handle} level={lv.level} since={date(me.joinedAt, { month: "short", year: "numeric" })} sparks={balance(s, me.id)} /></div>
        <Label className="p-5 lg:col-span-3" watermark={false}>
          <div className="meta">{t("finalePrize")}</div>
          <div className="mt-1 text-[15px] font-semibold">{L(season.finalePrize)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
            <div><div className="meta">{t("leaderboardTitle")}</div><div className="text-2xl font-semibold tabular">{myRank > 0 ? `#${myRank}` : "-"}</div></div>
            <div><div className="meta">{t("quality")}</div><div className="text-2xl font-semibold tabular">{lv.quality}</div></div>
            <div className="col-span-2 flex items-center gap-2 text-ink-2"><Fire size={16} weight={streak > 0 ? "fill" : "regular"} className="text-marigold" />{t("streakMonths", { n: streak })} · {t("streakHint", { n: STREAK_BONUS })}</div>
          </div>
        </Label>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <Section title={t("leaderboardTitle")} className="lg:col-span-3" action={board.length > 10 && <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>{showAll ? t("close") : t("viewAll")}</Button>}>
          <Stagger className="label-card divide-y divide-line" gap={0.02}>
            {(showAll ? board : board.slice(0, 10)).map((row, i) => (
              <Item key={row.creator.id}>
                <div className={cn("flex items-center gap-3 px-4 py-3", row.creator.id === me.id && "bg-leaf-soft/30")}>
                  <span className={cn("w-7 text-center text-[14px] font-semibold tabular", i < 3 ? "text-marigold-ink" : "text-ink-3")}>{i < 3 ? <Trophy size={18} weight="fill" className="inline text-marigold" /> : i + 1}</span>
                  <Avatar name={row.creator.name} hue={row.creator.hue} size={34} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{row.creator.name}</div><div className="text-[12px] text-ink-3">{row.creator.city} · {t(`market_${row.creator.market}` as const)}</div></div>
                  <LevelChip level={row.level} className="hidden sm:inline-flex" />
                  <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-surface-3 md:block"><motion.span className="block h-full rounded-full bg-grape" initial={{ width: 0 }} animate={{ width: `${(row.sparks / Math.max(1, board[0].sparks)) * 100}%` }} transition={{ duration: 0.9, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }} /></span>
                  <span className="w-14 text-end font-semibold tabular">{num(row.sparks)}</span>
                </div>
              </Item>
            ))}
          </Stagger>
        </Section>

        <Section title={t("level")} sub={t("levelsReset")} className="lg:col-span-2">
          <ol className="grid gap-2">
            {LEVEL_ORDER.map((l) => {
              const reached = LEVEL_ORDER.indexOf(l) <= LEVEL_ORDER.indexOf(lv.level);
              const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
              return (
                <li key={l}>
                  <Label className={cn("flex items-start gap-3 p-3", !reached && "opacity-70")} watermark={false}>
                    <Stamp pressed={reached} size={44} animate={false} tone={l === "ambassador" ? "marigold" : "leaf"}><span className="text-[7px]">{l.toUpperCase()}</span></Stamp>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[14px] font-semibold">{t(`lv_${l}` as const)}{reached && <Check size={14} weight="bold" className="text-leaf" />}</div><div className="text-[12px] text-ink-3">{how}</div><div className="text-[12.5px] text-ink-2">{t(`lvUnlock_${l}` as const)}</div></div>
                  </Label>
                </li>
              );
            })}
          </ol>
        </Section>
      </div>

      <Section title={t("ambassadorRound")} sub={t(`ap_${amb.phase}` as const)} action={<SimulatedTag />}>
        {amb.phase === "selected" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {amb.cohort.map((id) => { const c = s.creators.find((x) => x.id === id)!; return <Label key={id} className="flex items-center gap-3 p-4" watermark={false}><Avatar name={c.name} hue={c.hue} size={44} /><div><div className="flex items-center gap-1 text-[15px] font-semibold"><Crown size={16} weight="fill" className="text-marigold" />{c.name}</div><div className="text-[12.5px] text-ink-3">{c.city}</div></div></Label>; })}
          </div>
        ) : amb.phase === "upcoming" ? (
          <Label className="p-6 text-[14.5px] text-ink-2" watermark={false}>{t("ap_upcoming")}</Label>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <Label className="flex flex-col gap-3 p-5" watermark={false}>
              <div className="meta">{t("ballot")}</div>
              <h3 className="text-[17px] font-semibold">{inRunning ? t("youAreIn") : amb.phase === "wildcard_open" ? t("enterWildcard") : t("vote")}</h3>
              <p className="text-[13.5px] text-ink-2">{amb.phase === "wildcard_open" ? t("wildcardHint") : t("nba_vote_body")}</p>
              {amb.phase === "wildcard_open" && !inRunning && <Button onClick={() => { dispatch({ type: "enterWildcard", creatorId: me.id }); celebrate(); }} icon={<Star size={16} weight="fill" />}>{t("enterWildcard")}</Button>}
              {inRunning && <Chip tone="leaf">{amb.shortlist.includes(me.id) ? t("shortlisted") : t("wildcard")}</Chip>}
              {season.ambassadors.cohort.includes(me.id) && <Chip tone="marigold">{t("youAreAmbassador")}</Chip>}
            </Label>
            <div className="lg:col-span-2">
              <div className="label-card divide-y divide-line">
                {candidates.map((id) => {
                  const c = s.creators.find((x) => x.id === id)!;
                  const voted = myVote === id;
                  return (
                    <div key={id} className={cn("flex items-center gap-3 px-4 py-3", voted && "bg-leaf-soft/30")}>
                      <Stamp pressed={voted} size={40} tone="marigold" icon={<Check weight="bold" size={16} />} />
                      <Avatar name={c.name} hue={c.hue} size={36} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{c.name}</div><div className="text-[12px] text-ink-3">{amb.shortlist.includes(id) ? t("shortlisted") : t("wildcard")} · {voteCounts[id]} {t("votes")}</div></div>
                      {amb.phase === "voting" && id !== me.id && !myVote && <Button size="sm" variant="secondary" onClick={() => { dispatch({ type: "voteAmbassador", voterId: me.id, candidateId: id }); toast(t("voted"), "success"); }}>{t("vote")}</Button>}
                      {voted && <span className="text-[12.5px] font-medium text-leaf">{t("voted")}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Label className="flex gap-5 p-6 lg:col-span-2" watermark={false}>
          <Stamp pressed size={72} tone="ink" animate={false}><Tent size={28} weight="duotone" /></Stamp>
          <div>
            <div className="meta">{t("circleCamp")}</div>
            <p className="mt-1 text-[14.5px] text-ink-2">{t("circleCampBody")}</p>
            <p className="mt-2 text-[13px] text-ink-3">{t("alumniPerks")}</p>
          </div>
        </Label>
        <Section title={t("pastSeasons")}>
          <ul className="grid gap-2">
            {past.map((ps) => (
              <li key={ps.id}><Label className="p-4" watermark={false}><div className="text-[14.5px] font-semibold">{L(ps.name)}</div><div className="text-[12px] text-ink-3">{date(ps.start)} - {date(ps.end)}</div><div className="mt-2 flex -space-x-2 rtl:space-x-reverse">{ps.ambassadors.cohort.map((id) => { const c = s.creators.find((x) => x.id === id); return c ? <Avatar key={id} name={c.name} hue={c.hue} size={28} ring /> : null; })}</div></Label></li>
            ))}
            {upcoming.map((us) => <li key={us.id} className="card-soft p-4"><div className="text-[14.5px] font-semibold">{L(us.name)}</div><div className="text-[12px] text-ink-3">{date(us.start)} - {date(us.end)}</div></li>)}
          </ul>
        </Section>
      </div>
    </div>
  );
}
