import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Lightning, MapPin, UsersThree, PaperPlaneTilt, Lock, CalendarBlank, LinkSimple } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, ChipButton, EmptyState, Field, Input, PageHeader, Section, Sheet, SimulatedTag, Textarea } from "../../ui/primitives";
import { Item, Stagger, Tilt, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { isDoubleSparks, level, meetsLevel, missionSparks, missionsFor, squadTotals, trackProgress, MISSION_TYPES } from "../../domain/selectors";
import type { MissionType } from "../../domain/types";
import { BrandMark, EntryChip, LevelChip, MissionTypeChip, Points, StageChip, useCurrentCreator } from "../shared/bits";
import { cn } from "../../ui/cn";

export function Missions() {
  const { id } = useParams();
  return id ? <MissionDetail id={id} /> : <MissionBoard />;
}

function MissionBoard() {
  const t = useT();
  const L = useL();
  const { date, relative } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const [type, setType] = useState<MissionType | "all" | "mine">("all");
  const visible = useMemo(() => missionsFor(s, me), [s, me]);
  const routines = s.participations.filter((p) => p.creatorId === me.id && !["declined", "completed"].includes(p.stage));
  const list = visible.filter((m) => (type === "all" ? true : type === "mine" ? !!m.entries[me.id] : m.type === type));
  const lv = level(s, me.id);
  const counts = MISSION_TYPES.reduce((acc, k) => ({ ...acc, [k]: visible.filter((m) => m.type === k).length }), {} as Record<MissionType, number>);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("missionBoard")} sub={t("missionsSub")} actions={<LevelChip level={lv.level} className="h-8 px-3 text-[13px]" />} />
      <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <ChipButton selected={type === "all"} onClick={() => setType("all")}>{t("all")}</ChipButton>
        <ChipButton selected={type === "mine"} onClick={() => setType("mine")}>{t("you")}</ChipButton>
        {MISSION_TYPES.filter((k) => k !== "routine" && counts[k] > 0).map((k) => <ChipButton key={k} selected={type === k} onClick={() => setType(k)}>{t(`mt_${k}` as const)}</ChipButton>)}
        {routines.length > 0 && <ChipButton selected={type === "routine"} onClick={() => setType("routine")}>{t("mt_routine")}</ChipButton>}
      </div>

      {type === "routine" ? (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {routines.map((p) => {
            const c = s.campaigns.find((x) => x.id === p.campaignId)!;
            const b = s.brands.find((x) => x.id === c.brandId)!;
            return (
              <Item key={p.id}>
                <Link to={`/creator/campaigns/${p.id}`} className="card press flex items-center gap-4 p-4 hover:border-ink-3">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl"><ArtSlot id="mission-routine" showLabel={false} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><MissionTypeChip type="routine" /><BrandMark brand={b} size="sm" /></div>
                    <div className="mt-1 truncate text-[16px] font-semibold">{L(c.title)}</div>
                    <div className="mt-2 flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                  </div>
                  <Points value={c.points} />
                </Link>
              </Item>
            );
          })}
        </Stagger>
      ) : list.length === 0 ? (
        <EmptyState icon={<Lightning size={24} weight="duotone" />} title={t("noMissions")} body={t("noMissionsBody")} action={<Button variant="secondary" to="/creator/academy">{t("academy")}</Button>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const e = m.entries[me.id];
            const b = s.brands.find((x) => x.id === m.brandId);
            const dbl = isDoubleSparks(s, m);
            const locked = !meetsLevel(s, me.id, m.levelRequired) && !e;
            return (
              <Item key={m.id}>
                <Tilt max={3} className="h-full rounded-[var(--radius-card)]">
                  <Link to={`/creator/missions/${m.id}`} className={cn("card press flex h-full flex-col overflow-hidden hover:border-ink-3", locked && "opacity-75")}>
                    <div className="relative h-36 w-full"><ArtSlot id={`mission-${m.type}`} />
                      <div className="absolute start-3 top-3 flex gap-1.5"><MissionTypeChip type={m.type} />{dbl && <Chip tone="marigold" icon={<Lightning size={13} weight="fill" />}>{t("doubleSparks")}</Chip>}</div>
                      {e && <div className="absolute end-3 top-3"><EntryChip state={e.state} /></div>}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center justify-between gap-2">{b ? <BrandMark brand={b} size="sm" /> : <span className="text-[12.5px] font-semibold text-leaf">{t("appName")}</span>}{m.paid && <Chip tone="ink" className="h-6 text-[11px]">{t("paidMission")}</Chip>}</div>
                      <h2 className="text-xl">{L(m.title)}</h2>
                      <p className="line-clamp-2 text-[14px] text-ink-2">{L(m.prompt)}</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-[12.5px] text-ink-3">
                        <span className="inline-flex items-center gap-1"><CalendarBlank size={13} />{date(m.window.start)} - {date(m.window.end)}</span>
                        {locked ? <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${m.levelRequired}` as const) })}</Chip> : <Points value={missionSparks(s, m)} className={cn(dbl && "text-marigold-ink")} />}
                      </div>
                      {dbl && m.doubleSparksUntil && <span className="text-[12px] font-medium text-marigold-ink">{t("endsIn", { when: relative(m.doubleSparksUntil, new Date(s.now).getTime()) })}</span>}
                    </div>
                  </Link>
                </Tilt>
              </Item>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}

function MissionDetail({ id }: { id: string }) {
  const t = useT();
  const L = useL();
  const { date, relative, num } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const m = s.missions.find((x) => x.id === id);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [handle, setHandle] = useState("");
  const [squadPick, setSquadPick] = useState<string | null>(null);
  if (!m) return <EmptyState title={t("notFound")} action={<Button variant="secondary" to="/creator/missions">{t("missions")}</Button>} />;
  const e = m.entries[me.id];
  const b = s.brands.find((x) => x.id === m.brandId);
  const dbl = isDoubleSparks(s, m);
  const lvOk = meetsLevel(s, me.id, m.levelRequired);
  const track = m.trackId ? s.academy.tracks.find((x) => x.id === m.trackId) : undefined;
  const trackOk = !m.trackId || trackProgress(s, me.id, m.trackId).complete;
  const totals = m.type === "team" ? squadTotals(m) : [];
  const myReferrals = s.referrals.filter((r) => r.referrerId === me.id);

  const join = () => {
    dispatch({ type: "joinMission", missionId: m.id, creatorId: me.id, squadId: squadPick ?? undefined });
    celebrate();
  };
  const submit = () => {
    dispatch({ type: "submitMission", missionId: m.id, creatorId: me.id, url: url.trim(), caption: caption.trim() });
    setOpen(false);
    setUrl("");
    setCaption("");
  };
  const refer = () => {
    dispatch({ type: "refer", creatorId: me.id, handle });
    toast(t("referred"), "success");
    setHandle("");
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/creator/missions" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("missions")}</Link>
      <div className="card grid overflow-hidden lg:grid-cols-5">
        <div className="relative h-56 lg:col-span-2 lg:h-full"><ArtSlot id={`mission-${m.type}`} /></div>
        <div className="flex flex-col gap-4 p-6 lg:col-span-3 lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <MissionTypeChip type={m.type} />
            {b && <BrandMark brand={b} size="sm" />}
            {m.paid && <Chip tone="ink">{t("paidMission")}</Chip>}
            {dbl && <Chip tone="marigold" icon={<Lightning size={13} weight="fill" />}>{t("doubleSparks")} · {t("endsIn", { when: relative(m.doubleSparksUntil!, new Date(s.now).getTime()) })}</Chip>}
            {e && <EntryChip state={e.state} />}
          </div>
          <h1 className="text-3xl md:text-4xl">{L(m.title)}</h1>
          <p className="max-w-[60ch] text-[15px] text-ink-2">{L(m.prompt)}</p>
          <div className="flex flex-wrap gap-2 text-[13px]">
            <Chip icon={<CalendarBlank size={14} />}>{date(m.window.start)} - {date(m.window.end)}</Chip>
            {m.place && <Chip icon={<MapPin size={14} />}>{L(m.place)}</Chip>}
            {m.requiredHashtags.length > 0 && <Chip>{m.requiredHashtags.join(" ")}</Chip>}
            <Chip>{t("levelRequired")}: {t(`lv_${m.levelRequired}` as const)}</Chip>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <div className="text-3xl font-semibold tabular">{num(missionSparks(s, m))} <span className="text-base font-normal text-ink-3">{t("sparks")}</span></div>
            {!e && m.status === "live" && lvOk && trackOk && m.type !== "team" && m.type !== "referral" && <Button onClick={join} icon={<Check size={16} weight="bold" />}>{t("joinMission")}</Button>}
            {!e && !lvOk && <Chip icon={<Lock size={13} weight="bold" />}>{t("levelLocked", { level: t(`lv_${m.levelRequired}` as const) })}</Chip>}
            {!e && lvOk && !trackOk && track && <Button variant="secondary" to={`/creator/academy/${track.id}`}>{t("trackLocked", { track: L(track.title) })}</Button>}
            {e && (e.state === "joined" || e.state === "changes") && m.type !== "referral" && <Button onClick={() => setOpen(true)} icon={<PaperPlaneTilt size={16} weight="bold" />}>{e.state === "changes" ? t("resubmitPost") : t("submitPost")}</Button>}
            {e?.state === "completed" && <span className="text-[14px] font-medium text-leaf">{t("missionDone")}</span>}
          </div>
        </div>
      </div>

      {m.type === "team" && (
        <Section title={t("squads")} sub={t("squadBonus")}>
          <div className="grid gap-3 md:grid-cols-3">
            {totals.map(({ squad, sparks, submitted }, i) => {
              const mine = squad.id === e?.squadId;
              return (
                <div key={squad.id} className={cn("card flex flex-col gap-3 p-4", mine && "border-leaf bg-leaf-soft/30")}>
                  <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[15px] font-semibold"><UsersThree size={18} weight="duotone" className="text-leaf" />{L(squad.name)}</span><span className="text-[12px] text-ink-3">#{i + 1}</span></div>
                  <div className="flex -space-x-2 rtl:space-x-reverse">{squad.memberIds.map((cid) => { const c = s.creators.find((x) => x.id === cid); return c ? <Avatar key={cid} name={c.name} hue={c.hue} size={30} ring /> : null; })}</div>
                  <div className="flex items-center justify-between text-[13px] text-ink-2"><span>{squad.memberIds.length} {t("members")} · {submitted} {t("es_submitted").toLowerCase()}</span><Points value={sparks} /></div>
                  {!e && lvOk && m.status === "live" && <Button size="sm" variant={squadPick === squad.id ? "primary" : "secondary"} onClick={() => setSquadPick(squad.id)}>{squadPick === squad.id ? t("joinTeam", { squad: L(squad.name) }) : t("pickSquad")}</Button>}
                  {mine && <Chip tone="leaf">{t("yourSquad")}</Chip>}
                </div>
              );
            })}
          </div>
          {!e && lvOk && m.status === "live" && <Button onClick={join} disabled={!squadPick} icon={<Check size={16} weight="bold" />}>{t("joinMission")}</Button>}
        </Section>
      )}

      {m.type === "referral" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card flex flex-col gap-4 p-6">
            <h2 className="text-xl">{t("referSomeone")}</h2>
            <Field label={t("handle")} hint={t("referHint")}><Input value={handle} onChange={(ev) => setHandle(ev.target.value)} placeholder="@creator" /></Field>
            <Button onClick={refer} disabled={handle.trim().length < 2} icon={<PaperPlaneTilt size={16} weight="bold" />}>{t("referSomeone")}</Button>
          </div>
          <Section title={t("yourReferrals")}>
            {myReferrals.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="card divide-y divide-line">{myReferrals.map((r) => <li key={r.id} className="flex items-center justify-between px-4 py-3 text-[14px]"><span>@{r.handle}</span><Chip tone={r.status === "approved" ? "leaf" : r.status === "rejected" ? "rose" : "marigold"}>{t(`rf_${r.status}` as const)}</Chip></li>)}</ul>
            )}
          </Section>
        </div>
      )}

      {e && e.submissions.length > 0 && (
        <Section title={t("preCheck")} action={<SimulatedTag />}>
          <div className="grid gap-3">
            {e.submissions.slice().reverse().map((sub) => (
              <div key={sub.id} className="card flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                  <a href={sub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-leaf hover:underline"><LinkSimple size={14} />{t("openPost")}</a>
                  <span>{relative(sub.at)}</span>
                  {sub.decision && <Chip tone={sub.decision === "approved" ? "leaf" : "rose"}>{sub.decision === "approved" ? t("es_approved") : t("es_changes")}</Chip>}
                </div>
                <p className="text-[14px] text-ink-2">{sub.caption}</p>
                <ul className="flex flex-wrap gap-2">
                  {(["hashtags", "disclosure", "timing"] as const).map((k) => <li key={k} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-medium", sub.check[k] ? "bg-leaf-soft text-leaf-ink" : "bg-rose-soft text-rose")}>{sub.check[k] ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}{t(`pc_${k}` as const)}</li>)}
                </ul>
                {sub.note && <p className="rounded-xl bg-surface-2 p-3 text-[14px]"><span className="font-medium">{sub.reviewerName}: </span>{sub.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={t("submitPost")}>
        <div className="grid gap-4">
          <Field label={t("postUrl")} hint="https://"><Input value={url} onChange={(ev) => setUrl(ev.target.value)} placeholder="https://www.instagram.com/reel/..." inputMode="url" autoFocus /></Field>
          <Field label={t("caption")} hint={t("captionHint", { tags: m.requiredHashtags.join(" ") || "#DaburSquad" })}><Textarea value={caption} onChange={(ev) => setCaption(ev.target.value)} placeholder={`${m.requiredHashtags.join(" ")} #ad`} /></Field>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>{t("cancel")}</Button><Button onClick={submit} disabled={!url.trim() || !caption.trim()}>{t("submitPost")}</Button></div>
        </div>
      </Sheet>
    </div>
  );
}
