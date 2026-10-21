import { useState } from "react";
import { Trophy, Crown, Star, CalendarBlank, Fire, Tent, Check } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, PageHeader, ProgressRing, Section, SimulatedTag } from "../../ui/primitives";
import { Counter, Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { STREAK_BONUS } from "../../domain/reducer";
import { currentSeason, daysLeftInSeason, leaderboard, level, LEVEL_ORDER, LEVEL_RULES, monthlyStreak } from "../../domain/selectors";
import { LevelChip, LevelEmblem, useCurrentCreator } from "../shared/bits";
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
  const bannerId = `season-${season.id === "sn_1" ? "summer-hair-rescue" : season.id === "sn_2" ? "golden-hour" : "winter-glow"}`;

  return (
    <div className="flex flex-col gap-10">
      <div className="card grid overflow-hidden lg:grid-cols-5">
        <div className="relative h-52 lg:col-span-2 lg:h-full"><ArtSlot id={bannerId} /></div>
        <div className="flex flex-col gap-4 p-6 lg:col-span-3 lg:p-8">
          <div className="flex flex-wrap items-center gap-2"><Chip tone="marigold" icon={<CalendarBlank size={13} />}>{t("seasonEndsIn", { n: daysLeftInSeason(s, season) })}</Chip><Chip>{date(season.start)} - {date(season.end)}</Chip></div>
          <h1 className="text-3xl md:text-4xl">{L(season.name)}</h1>
          <p className="max-w-[60ch] text-ink-2">{L(season.theme)}</p>
          <div className="mt-auto grid gap-3 pt-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-surface-2 p-4"><div className="text-[12px] text-ink-3">{t("seasonSparks")}</div><div className="text-2xl font-semibold tabular"><Counter value={lv.seasonSparks} format={num} /></div></div>
            <div className="rounded-2xl bg-surface-2 p-4"><div className="text-[12px] text-ink-3">{t("leaderboardTitle")}</div><div className="text-2xl font-semibold tabular">{myRank > 0 ? `#${myRank}` : "-"}</div></div>
            <div className="rounded-2xl bg-marigold-soft p-4 text-marigold-ink"><div className="text-[12px] opacity-70">{t("finalePrize")}</div><div className="text-[14px] font-semibold leading-snug">{L(season.finalePrize)}</div></div>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <Section title={t("level")} sub={t("levelsReset")} className="lg:col-span-2">
          <div className="card flex flex-col gap-5 p-5">
            <div className="flex items-center gap-4">
              <LevelEmblem level={lv.level} size={64} />
              <div>
                <div className="text-xl font-semibold">{t(`lv_${lv.level}` as const)}</div>
                <div className="text-[13px] text-ink-2">{lv.next && lv.next !== "ambassador" ? t("toNextLevel", { n: num(lv.toNext), level: t(`lv_${lv.next}` as const) }) : lv.next === "ambassador" ? t("ambassadorsSelected") : t("topLevel")}</div>
              </div>
              <ProgressRing value={lv.progress} size={52} stroke={6} className="ms-auto"><span className="text-[11px] font-bold tabular">{Math.round(lv.progress * 100)}%</span></ProgressRing>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl bg-surface-2 p-3"><div className="text-ink-3">{t("quality")}</div><div className="text-lg font-semibold tabular">{lv.quality}</div><div className="mt-1 text-[11.5px] text-ink-3">{t("qualityHint")}</div></div>
              <div className="rounded-xl bg-surface-2 p-3"><div className="text-ink-3">{t("streak")}</div><div className="inline-flex items-center gap-1 text-lg font-semibold tabular"><Fire size={18} weight={streak > 0 ? "fill" : "regular"} className="text-marigold" />{t("streakMonths", { n: streak })}</div><div className="mt-1 text-[11.5px] text-ink-3">{t("streakHint", { n: STREAK_BONUS })}</div></div>
            </div>
            <ol className="grid gap-2">
              {LEVEL_ORDER.map((l) => {
                const reached = LEVEL_ORDER.indexOf(l) <= LEVEL_ORDER.indexOf(lv.level);
                const how = l === "insider" ? t("lvHow_insider", { sparks: LEVEL_RULES.insider.sparks, quality: LEVEL_RULES.insider.quality }) : l === "pro" ? t("lvHow_pro", { sparks: LEVEL_RULES.pro.sparks, quality: LEVEL_RULES.pro.quality }) : t(`lvHow_${l}` as const);
                return (
                  <li key={l} className={cn("flex items-start gap-3 rounded-xl p-2.5", reached ? "bg-leaf-soft/40" : "")}>
                    <LevelEmblem level={l} size={34} />
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[14px] font-semibold">{t(`lv_${l}` as const)}{reached && <Check size={14} weight="bold" className="text-leaf" />}</div><div className="text-[12px] text-ink-3">{how}</div><div className="text-[12.5px] text-ink-2">{t(`lvUnlock_${l}` as const)}</div></div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Section>

        <Section title={t("leaderboardTitle")} className="lg:col-span-3" action={board.length > 10 && <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>{showAll ? t("close") : t("viewAll")}</Button>}>
          <Stagger className="card divide-y divide-line" gap={0.02}>
            {(showAll ? board : board.slice(0, 10)).map((row, i) => (
              <Item key={row.creator.id}>
                <div className={cn("flex items-center gap-3 px-4 py-3", row.creator.id === me.id && "bg-leaf-soft/30")}>
                  <span className={cn("w-7 text-center text-[14px] font-bold tabular", i < 3 ? "text-marigold-ink" : "text-ink-3")}>{i < 3 ? <Trophy size={18} weight="fill" className="inline text-marigold" /> : i + 1}</span>
                  <Avatar name={row.creator.name} hue={row.creator.hue} size={34} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{row.creator.name}</div><div className="text-[12px] text-ink-3">{row.creator.city} · {t(`market_${row.creator.market}` as const)}</div></div>
                  <LevelChip level={row.level} className="hidden sm:inline-flex" />
                  <span className="font-semibold tabular">{num(row.sparks)}</span>
                </div>
              </Item>
            ))}
          </Stagger>
        </Section>
      </div>

      <Section title={t("ambassadorRound")} sub={t(`ap_${amb.phase}` as const)} action={<SimulatedTag />}>
        {amb.phase === "selected" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {amb.cohort.map((id) => { const c = s.creators.find((x) => x.id === id)!; return <div key={id} className="card flex items-center gap-3 p-4"><Avatar name={c.name} hue={c.hue} size={44} /><div><div className="flex items-center gap-1 text-[15px] font-semibold"><Crown size={16} weight="fill" className="text-marigold" />{c.name}</div><div className="text-[12.5px] text-ink-3">{c.city}</div></div></div>; })}
          </div>
        ) : amb.phase === "upcoming" ? (
          <div className="card-soft p-6 text-[14.5px] text-ink-2">{t("ap_upcoming")}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card flex flex-col gap-3 p-5">
              <h3 className="text-[16px] font-semibold">{inRunning ? t("youAreIn") : amb.phase === "wildcard_open" ? t("enterWildcard") : t("vote")}</h3>
              <p className="text-[13.5px] text-ink-2">{amb.phase === "wildcard_open" ? t("wildcardHint") : t("nba_vote_body")}</p>
              {amb.phase === "wildcard_open" && !inRunning && <Button onClick={() => { dispatch({ type: "enterWildcard", creatorId: me.id }); celebrate(); }} icon={<Star size={16} weight="fill" />}>{t("enterWildcard")}</Button>}
              {inRunning && <Chip tone="leaf">{amb.shortlist.includes(me.id) ? t("shortlisted") : t("wildcard")}</Chip>}
              {season.ambassadors.cohort.includes(me.id) && <Chip tone="marigold">{t("youAreAmbassador")}</Chip>}
            </div>
            <div className="lg:col-span-2">
              <div className="mb-2 text-[13px] font-medium text-ink-2">{t("candidates")}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {candidates.map((id) => {
                  const c = s.creators.find((x) => x.id === id)!;
                  const voted = myVote === id;
                  return (
                    <div key={id} className={cn("card flex items-center gap-3 p-3", voted && "border-leaf bg-leaf-soft/30")}>
                      <Avatar name={c.name} hue={c.hue} size={38} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{c.name}</div><div className="text-[12px] text-ink-3">{amb.shortlist.includes(id) ? t("shortlisted") : t("wildcard")} · {voteCounts[id]} {t("votes")}</div></div>
                      {amb.phase === "voting" && id !== me.id && (voted ? <Chip tone="leaf" icon={<Check size={13} weight="bold" />}>{t("voted")}</Chip> : !myVote && <Button size="sm" variant="secondary" onClick={() => { dispatch({ type: "voteAmbassador", voterId: me.id, candidateId: id }); toast(t("voted"), "success"); }}>{t("vote")}</Button>)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="grid sm:grid-cols-5">
            <div className="h-40 sm:col-span-2 sm:h-full"><ArtSlot id="circle-camp" /></div>
            <div className="flex flex-col gap-2 p-6 sm:col-span-3">
              <div className="inline-flex items-center gap-2 text-leaf"><Tent size={20} weight="duotone" /><span className="text-[13px] font-semibold">{t("circleCamp")}</span></div>
              <p className="text-[14.5px] text-ink-2">{t("circleCampBody")}</p>
              <p className="text-[13px] text-ink-3">{t("alumniPerks")}</p>
            </div>
          </div>
        </div>
        <Section title={t("pastSeasons")}>
          <ul className="grid gap-2">
            {past.map((ps) => (
              <li key={ps.id} className="card p-4">
                <div className="text-[14.5px] font-semibold">{L(ps.name)}</div>
                <div className="text-[12px] text-ink-3">{date(ps.start)} - {date(ps.end)}</div>
                <div className="mt-2 flex -space-x-2 rtl:space-x-reverse">{ps.ambassadors.cohort.map((id) => { const c = s.creators.find((x) => x.id === id); return c ? <Avatar key={id} name={c.name} hue={c.hue} size={28} ring /> : null; })}</div>
              </li>
            ))}
            {upcoming.map((us) => <li key={us.id} className="card-soft p-4"><div className="text-[14.5px] font-semibold">{L(us.name)}</div><div className="text-[12px] text-ink-3">{date(us.start)} - {date(us.end)}</div></li>)}
          </ul>
        </Section>
      </div>
      <PageHeader title="" className="hidden" />
    </div>
  );
}
