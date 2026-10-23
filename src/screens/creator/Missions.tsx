import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Lightning, MapPin, UsersThree, PaperPlaneTilt, Lock, CalendarBlank, LinkSimple } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, ChipButton, EmptyState, Field, Input, PageHeader, Section, Sheet, SimulatedTag, Textarea } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { Label, Stamp, Ticket } from "../../ui/kit";
import { isDoubleSparks, level, meetsLevel, missionSparks, missionsFor, squadTotals, trackProgress, MISSION_TYPES } from "../../domain/selectors";
import type { Mission, MissionType } from "../../domain/types";
import { BrandMark, EntryChip, LevelChip, MissionTypeChip, Points, StageChip, useCurrentCreator } from "../shared/bits";
import { cn } from "../../ui/cn";

export function Missions() {
  const { id } = useParams();
  return id ? <MissionDetail id={id} /> : <MissionBoard />;
}

function PriceTag({ value, double }: { value: number; double?: boolean }) {
  const t = useT();
  return (
    <span className={cn("inline-flex flex-col items-center rounded-[12px] px-2.5 py-1.5 leading-none", double ? "bg-lemon text-plum border-2 border-outline" : "bg-ink text-canvas")}>
      <span className="text-[15px] font-extrabold tabular">+{value}</span>
      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] opacity-80">{t("sparks")}</span>
    </span>
  );
}

function MissionCard({ m, creatorId }: { m: Mission; creatorId: string }) {
  const t = useT();
  const L = useL();
  const { date, relative } = useFormat();
  const s = useStore();
  const e = m.entries[creatorId];
  const b = s.brands.find((x) => x.id === m.brandId);
  const dbl = isDoubleSparks(s, m);
  const locked = !meetsLevel(s, creatorId, m.levelRequired) && !e;
  return (
    <Link to={`/creator/missions/${m.id}`} className="block h-full">
      <Label brandId={m.brandId} className={cn("lift flex h-full gap-4 p-4", locked && "opacity-70")}>
        <div className="h-28 w-24 shrink-0 overflow-hidden rounded-[6px]"><ArtSlot id={`mission-${m.type}`} compact /></div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <MissionTypeChip type={m.type} />
            {b && <BrandMark brand={b} size="sm" />}
            {e && <EntryChip state={e.state} />}
            {m.paid && <Chip tone="ink" className="h-6 text-[11px]">{t("paidMission")}</Chip>}
          </div>
          <h2 className="mt-2 text-lg leading-tight">{L(m.title)}</h2>
          <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-2">{L(m.prompt)}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div className="meta flex items-center gap-1 !tracking-normal !normal-case"><CalendarBlank size={13} />{date(m.window.start)} - {date(m.window.end)}{dbl && m.doubleSparksUntil && <span className="ms-2 inline-flex items-center gap-1 text-marigold-ink"><Lightning size={12} weight="fill" />{t("endsIn", { when: relative(m.doubleSparksUntil, new Date(s.now).getTime()) })}</span>}</div>
            {locked ? <Chip icon={<Lock size={12} weight="bold" />}>{t(`lv_${m.levelRequired}` as const)}</Chip> : <PriceTag value={missionSparks(s, m)} double={dbl} />}
          </div>
        </div>
      </Label>
    </Link>
  );
}

function MissionBoard() {
  const t = useT();
  const L = useL();
  const s = useStore();
  const me = useCurrentCreator();
  const [type, setType] = useState<MissionType | "all">("all");
  const visible = useMemo(() => missionsFor(s, me), [s, me]);
  const routines = s.participations.filter((p) => p.creatorId === me.id && !["declined", "completed", "invited"].includes(p.stage));
  const now = visible.filter((m) => m.entries[me.id] && ["joined", "changes", "submitted"].includes(m.entries[me.id].state));
  const open = visible.filter((m) => !now.includes(m) && (type === "all" || m.type === type));
  const lv = level(s, me.id);
  const counts = MISSION_TYPES.reduce((acc, k) => ({ ...acc, [k]: visible.filter((m) => m.type === k).length }), {} as Record<MissionType, number>);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("missionBoard")} sub={t("missionsSub")} actions={<LevelChip level={lv.level} className="h-8 px-3 text-[13px]" />} />

      {(now.length > 0 || routines.length > 0) && (
        <Section title={t("now")}>
          <Stagger className="grid gap-4 md:grid-cols-2">
            {now.map((m) => {
              const e = m.entries[me.id];
              const b = s.brands.find((x) => x.id === m.brandId);
              return (
                <Item key={m.id}>
                  <Ticket to={`/creator/missions/${m.id}`} stub={<div className="flex items-center justify-between text-[13px]"><EntryChip state={e.state} /><PriceTag value={missionSparks(s, m)} double={isDoubleSparks(s, m)} /></div>}>
                    <div className="flex items-center gap-2"><MissionTypeChip type={m.type} />{b && <BrandMark brand={b} size="sm" />}</div>
                    <div className="mt-2 text-xl font-semibold">{L(m.title)}</div>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-2">{e.state === "changes" ? e.submissions.at(-1)?.note : L(m.prompt)}</p>
                  </Ticket>
                </Item>
              );
            })}
            {routines.map((p) => {
              const c = s.campaigns.find((x) => x.id === p.campaignId)!;
              const b = s.brands.find((x) => x.id === c.brandId)!;
              return (
                <Item key={p.id}>
                  <Ticket to={`/creator/campaigns/${p.id}`} stub={<div className="flex items-center justify-between text-[13px]"><div className="flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div><PriceTag value={c.points} /></div>}>
                    <div className="flex items-center gap-2"><MissionTypeChip type="routine" /><BrandMark brand={b} size="sm" /></div>
                    <div className="mt-2 text-xl font-semibold">{L(c.title)}</div>
                    <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-2">{L(c.hook)}</p>
                  </Ticket>
                </Item>
              );
            })}
          </Stagger>
        </Section>
      )}

      <Section
        title={t("openMissions")}
        action={
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            <ChipButton selected={type === "all"} onClick={() => setType("all")}>{t("all")}</ChipButton>
            {MISSION_TYPES.filter((k) => k !== "routine" && counts[k] > 0).map((k) => <ChipButton key={k} selected={type === k} onClick={() => setType(k)}>{t(`mt_${k}` as const)}</ChipButton>)}
          </div>
        }
      >
        {open.length === 0 ? (
          <EmptyState icon={<Lightning size={24} weight="duotone" />} title={t("noMissions")} body={t("noMissionsBody")} action={<Button variant="secondary" to="/creator/academy">{t("academy")}</Button>} />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {open.map((m) => <Item key={m.id}><MissionCard m={m} creatorId={me.id} /></Item>)}
          </Stagger>
        )}
      </Section>
    </div>
  );
}

function MissionDetail({ id }: { id: string }) {
  const t = useT();
  const L = useL();
  const { date, relative } = useFormat();
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
  const canJoin = !e && m.status === "live" && lvOk && trackOk && m.type !== "referral";

  return (
    <div className="flex flex-col gap-8">
      <Link to="/creator/missions" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("missions")}</Link>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <Ticket
            torn={e?.state === "completed"}
            stub={
              <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip icon={<CalendarBlank size={14} />}>{date(m.window.start)} - {date(m.window.end)}</Chip>
                  {m.place && <Chip icon={<MapPin size={14} />}>{L(m.place)}</Chip>}
                  {m.requiredHashtags.length > 0 && <Chip>{m.requiredHashtags.join(" ")}</Chip>}
                  <Chip>{t("levelRequired")}: {t(`lv_${m.levelRequired}` as const)}</Chip>
                </div>
                <PriceTag value={missionSparks(s, m)} double={dbl} />
              </div>
            }
          >
            <div className="flex gap-5">
              <div className="hidden h-36 w-28 shrink-0 overflow-hidden rounded-[6px] sm:block"><ArtSlot id={`mission-${m.type}`} compact /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <MissionTypeChip type={m.type} />
                  {b && <BrandMark brand={b} size="sm" />}
                  {m.paid && <Chip tone="ink">{t("paidMission")}</Chip>}
                  {dbl && <Chip tone="marigold" icon={<Lightning size={13} weight="fill" />}>{t("doubleSparks")} · {t("endsIn", { when: relative(m.doubleSparksUntil!, new Date(s.now).getTime()) })}</Chip>}
                  {e && <EntryChip state={e.state} />}
                </div>
                <h1 className="mt-3 text-3xl md:text-4xl">{L(m.title)}</h1>
                <p className="mt-3 max-w-[60ch] text-[15px] text-ink-2">{L(m.prompt)}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {canJoin && m.type !== "team" && <Button onClick={() => { join(); celebrate(); }} icon={<Check size={16} weight="bold" />}>{t("joinMission")}</Button>}
                  {!e && !lvOk && <Chip icon={<Lock size={13} weight="bold" />}>{t("levelLocked", { level: t(`lv_${m.levelRequired}` as const) })}</Chip>}
                  {!e && lvOk && !trackOk && track && <Button variant="secondary" to={`/creator/academy/${track.id}`}>{t("trackLocked", { track: L(track.title) })}</Button>}
                  {e && (e.state === "joined" || e.state === "changes") && m.type !== "referral" && <Button onClick={() => setOpen(true)} icon={<PaperPlaneTilt size={16} weight="bold" />}>{e.state === "changes" ? t("resubmitPost") : t("submitPost")}</Button>}
                  {e?.state === "completed" && <span className="inline-flex items-center gap-2 text-[14px] font-medium text-leaf"><Stamp pressed size={40} animate={false} />{t("missionDone")}</span>}
                </div>
              </div>
            </div>
          </Ticket>
        </div>
        <div className="lg:col-span-4">
          {e && e.submissions.length > 0 ? (
            <Label className="p-5">
              <div className="flex items-center justify-between"><h3 className="text-[15px] font-semibold">{t("preCheck")}</h3><SimulatedTag /></div>
              {e.submissions.slice().reverse().slice(0, 1).map((sub) => (
                <div key={sub.id} className="mt-4">
                  <div className="flex justify-between">
                    {(["hashtags", "disclosure", "timing"] as const).map((k) => (
                      <div key={k} className="flex flex-col items-center gap-1.5 text-center">
                        <Stamp pressed={sub.check[k]} size={56} tone={sub.check[k] ? "leaf" : "rose"} icon={sub.check[k] ? <Check weight="bold" size={22} /> : undefined} />
                        <span className="text-[11px] leading-tight text-ink-2">{t(`pc_${k}` as const)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3"><a href={sub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-leaf hover:underline"><LinkSimple size={14} />{t("openPost")}</a><span>{relative(sub.at)}</span>{sub.decision && <Chip tone={sub.decision === "approved" ? "leaf" : "rose"}>{sub.decision === "approved" ? t("es_approved") : t("es_changes")}</Chip>}</div>
                  <p className="mt-2 text-[13.5px] text-ink-2">{sub.caption}</p>
                  {sub.note && <p className="mt-3 rounded-[8px] bg-surface-2 p-3 text-[13.5px]"><span className="font-medium">{sub.reviewerName}: </span>{sub.note}</p>}
                </div>
              ))}
            </Label>
          ) : (
            <Label className="p-5">
              <h3 className="text-[15px] font-semibold">{t("preCheck")}</h3>
              <p className="mt-1 text-[13px] text-ink-3">{t("captionHint", { tags: m.requiredHashtags.join(" ") || "#DaburSquad" })}</p>
              <div className="mt-4 flex justify-between">
                {(["hashtags", "disclosure", "timing"] as const).map((k) => <div key={k} className="flex flex-col items-center gap-1.5 text-center"><Stamp pressed={false} size={56} /><span className="text-[11px] leading-tight text-ink-3">{t(`pc_${k}` as const)}</span></div>)}
              </div>
            </Label>
          )}
        </div>
      </div>

      {m.type === "team" && (
        <Section title={t("squads")} sub={t("squadBonus")}>
          <div className="grid gap-3 md:grid-cols-3">
            {totals.map(({ squad, sparks, submitted }, i) => {
              const mine = squad.id === e?.squadId;
              return (
                <Label key={squad.id} className={cn("flex flex-col gap-3 p-4", mine && "ring-2 ring-leaf")}>
                  <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[15px] font-semibold"><UsersThree size={18} weight="duotone" className="text-leaf" />{L(squad.name)}</span><span className="meta">#{i + 1}</span></div>
                  <div className="flex -space-x-2 rtl:space-x-reverse">{squad.memberIds.map((cid) => { const c = s.creators.find((x) => x.id === cid); return c ? <Avatar key={cid} name={c.name} hue={c.hue} size={30} ring /> : null; })}</div>
                  <div className="flex items-center justify-between text-[13px] text-ink-2"><span>{squad.memberIds.length} {t("members")} · {submitted} {t("es_submitted").toLowerCase()}</span><Points value={sparks} /></div>
                  {!e && lvOk && m.status === "live" && <Button size="sm" variant={squadPick === squad.id ? "primary" : "secondary"} onClick={() => setSquadPick(squad.id)}>{squadPick === squad.id ? t("joinTeam", { squad: L(squad.name) }) : t("pickSquad")}</Button>}
                  {mine && <Chip tone="leaf">{t("yourSquad")}</Chip>}
                </Label>
              );
            })}
          </div>
          {!e && lvOk && m.status === "live" && <Button onClick={() => { join(); celebrate(); }} disabled={!squadPick} icon={<Check size={16} weight="bold" />}>{t("joinMission")}</Button>}
        </Section>
      )}

      {m.type === "referral" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Label className="flex flex-col gap-4 p-6">
            <h2 className="text-xl">{t("referSomeone")}</h2>
            <Field label={t("handle")} hint={t("referHint")}><Input value={handle} onChange={(ev) => setHandle(ev.target.value)} placeholder="@creator" /></Field>
            <Button onClick={refer} disabled={handle.trim().length < 2} icon={<PaperPlaneTilt size={16} weight="bold" />}>{t("referSomeone")}</Button>
          </Label>
          <Section title={t("yourReferrals")}>
            {myReferrals.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
              <ul className="label-card divide-y divide-line">{myReferrals.map((r) => <li key={r.id} className="flex items-center justify-between px-4 py-3 text-[14px]"><span>@{r.handle}</span><Chip tone={r.status === "approved" ? "leaf" : r.status === "rejected" ? "rose" : "marigold"}>{t(`rf_${r.status}` as const)}</Chip></li>)}</ul>
            )}
          </Section>
        </div>
      )}

      {e && e.submissions.length > 1 && (
        <Section title={t("versions")}>
          <ul className="label-card divide-y divide-line">
            {e.submissions.slice().reverse().map((sub, i) => (
              <li key={sub.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13.5px]"><span className="meta">v{e.submissions.length - i}</span><span className="min-w-0 flex-1 truncate">{sub.caption}</span>{sub.decision && <Chip tone={sub.decision === "approved" ? "leaf" : "rose"}>{sub.decision === "approved" ? t("es_approved") : t("es_changes")}</Chip>}<span className="text-ink-3">{relative(sub.at)}</span><X className="hidden" /></li>
            ))}
          </ul>
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
