import { useState } from "react";
import { Crown, FastForward, Check } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, PageHeader, Section } from "../../ui/primitives";
import { useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { currentSeason, leaderboard, level } from "../../domain/selectors";
import { LevelChip } from "../shared/bits";
import { cn } from "../../ui/cn";

export function AdminSeasons() {
  const t = useT();
  const L = useL();
  const { date, num } = useFormat();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const current = currentSeason(s);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("seasons")} sub={t("levelsReset")} />
      <div className="grid gap-4 lg:grid-cols-3">
        {s.seasons.map((sn) => {
          const amb = sn.ambassadors;
          const isCurrent = sn.id === current.id;
          const board = leaderboard(s, sn);
          const candidates = [...amb.shortlist, ...amb.wildcards];
          const votes = candidates.reduce((acc, id) => ({ ...acc, [id]: Object.values(amb.votes).filter((v) => v === id).length }), {} as Record<string, number>);
          const bannerId = `season-${sn.id === "sn_1" ? "summer-hair-rescue" : sn.id === "sn_2" ? "golden-hour" : "winter-glow"}`;
          return (
            <div key={sn.id} className={cn("card flex flex-col overflow-hidden", isCurrent && "border-leaf ring-4 ring-leaf/10")}>
              <div className="relative h-32"><ArtSlot id={bannerId} /><div className="absolute start-3 top-3 flex gap-1.5">{isCurrent && <Chip tone="leaf">{t("thisSeason")}</Chip>}<Chip tone={amb.phase === "selected" ? "ink" : amb.phase === "upcoming" ? "neutral" : "marigold"}>{t(`ap_${amb.phase}` as const)}</Chip></div></div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="text-xl">{L(sn.name)}</h2>
                <div className="text-[12.5px] text-ink-3">{date(sn.start)} - {date(sn.end)} · {board.length} {t("creators").toLowerCase()} · {num(board.reduce((n, x) => n + x.sparks, 0))} {t("sparks")}</div>
                <p className="text-[13.5px] text-ink-2">{L(sn.theme)}</p>
                <div className="text-[12.5px]"><span className="text-ink-3">{t("finalePrize")}: </span>{L(sn.finalePrize)}</div>
                {amb.phase === "selected" && <div className="flex flex-wrap gap-1.5">{amb.cohort.map((id) => { const c = s.creators.find((x) => x.id === id)!; return <Chip key={id} tone="leaf" icon={<Crown size={12} weight="fill" />}>{c.name}</Chip>; })}</div>}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  {(amb.phase === "upcoming" || amb.phase === "wildcard_open") && <Button size="sm" variant="secondary" onClick={() => { dispatch({ type: "advanceSeason", seasonId: sn.id }); toast(t("advancePhase"), "success"); }} icon={<FastForward size={14} weight="fill" />}>{t("advancePhase")}: {t(`ap_${amb.phase === "upcoming" ? "wildcard_open" : "voting"}` as const)}</Button>}
                </div>
              </div>
              {amb.phase === "voting" && (
                <div className="border-t border-line p-5">
                  <div className="mb-1 text-[14px] font-semibold">{t("selectCohort")}</div>
                  <p className="mb-3 text-[12.5px] text-ink-3">{t("selectCohortHint")}</p>
                  <ul className="grid gap-1.5">
                    {candidates.sort((a, b) => votes[b] - votes[a]).map((id) => {
                      const c = s.creators.find((x) => x.id === id)!;
                      const sel = picked.has(id);
                      return (
                        <li key={id}>
                          <label className={cn("flex cursor-pointer items-center gap-2 rounded-xl border p-2", sel ? "border-leaf bg-leaf-soft/30" : "border-line")}>
                            <input type="checkbox" className="h-4 w-4 accent-[var(--leaf)]" checked={sel} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />
                            <Avatar name={c.name} hue={c.hue} size={28} />
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{c.name}</span>
                            <LevelChip level={level(s, id).level} className="hidden xl:inline-flex" />
                            <span className="text-[12px] text-ink-3">{amb.shortlist.includes(id) ? t("shortlisted") : t("wildcard")} · {votes[id]} {t("votes")}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <Button className="mt-3" full disabled={picked.size < 1 || picked.size > 8} onClick={() => { dispatch({ type: "selectAmbassadors", seasonId: sn.id, cohort: [...picked] }); celebrate(); setPicked(new Set()); }} icon={<Check size={15} weight="bold" />}>{t("confirmCohort", { n: picked.size })}</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Section title={t("leaderboardTitle")} sub={L(current.name)}>
        <ul className="card divide-y divide-line">
          {leaderboard(s, current).slice(0, 15).map((row, i) => (
            <li key={row.creator.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]"><span className="w-6 text-ink-3 tabular">{i + 1}</span><Avatar name={row.creator.name} hue={row.creator.hue} size={30} /><span className="min-w-0 flex-1 truncate">{row.creator.name}</span><LevelChip level={row.level} /><span className="font-semibold tabular">{num(row.sparks)}</span></li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
