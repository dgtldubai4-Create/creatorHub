import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Certificate as CertificateIcon, Lock, PlayCircle, Users, ChalkboardTeacher } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, PageHeader, Section } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { Certificate, Label, Stamp } from "../../ui/kit";
import { certificatesFor, level, meetsLevel, trackProgress } from "../../domain/selectors";
import { LevelChip, useCurrentCreator } from "../shared/bits";
import { cn } from "../../ui/cn";

export function Academy() {
  const { trackId } = useParams();
  return trackId ? <TrackDetail id={trackId} /> : <AcademyHub />;
}

function AcademyHub() {
  const t = useT();
  const L = useL();
  const { date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const lv = level(s, me.id);
  const certs = certificatesFor(s, me.id);
  const perks = ["licence", "kit", "spotlight", "women"] as const;
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("academy")} sub={t("academySub")} actions={<div className="flex items-center gap-2"><LevelChip level={lv.level} />{certs.length > 0 && <Chip tone="leaf" icon={<CertificateIcon size={14} weight="fill" />}>{certs.length} {t("certificates").toLowerCase()}</Chip>}</div>} />

      <Section title={t("tracks")}>
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {s.academy.tracks.map((tr) => {
            const p = trackProgress(s, me.id, tr.id);
            const ok = meetsLevel(s, me.id, tr.levelRequired);
            return (
              <Item key={tr.id}>
                <Link to={`/creator/academy/${tr.id}`} className="block h-full">
                  <Label className={cn("lift flex h-full gap-4 p-4", !ok && "opacity-70")} watermark={false}>
                    <div className="h-32 w-24 shrink-0 overflow-hidden rounded-[6px]"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} compact /></div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h2 className="text-lg leading-tight">{L(tr.title)}</h2>
                      <p className="mt-1 text-[13.5px] text-ink-2">{L(tr.blurb)}</p>
                      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div className="meta !normal-case !tracking-normal">{tr.modules.length} {t("modules")} · {L(tr.format)}</div>
                        {p.complete ? <Stamp pressed size={44} animate={false}><span className="text-[7px]">PASSED</span></Stamp> : !ok ? <Chip icon={<Lock size={12} weight="bold" />}>{t(`lv_${tr.levelRequired}` as const)}</Chip> : <span className="text-[13px] font-semibold tabular text-ink-2">{p.done}/{p.total}</span>}
                      </div>
                    </div>
                  </Label>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      {certs.length > 0 && (
        <Section title={t("certificates")} sub={t("certificateHint")}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certs.map((id) => {
              const tr = s.academy.tracks.find((x) => x.id === id)!;
              const at = s.academy.progress[me.id]?.[tr.modules[tr.modules.length - 1].id] ?? s.now;
              return <Certificate key={id} title={L(tr.title)} name={me.name} date={date(at)} meta={`${tr.modules.length} ${t("modules")}`} sealed />;
            })}
          </div>
        </Section>
      )}

      <Section title={t("mentoring")} sub={t("mentoringSub")}>
        <div className="grid gap-3 md:grid-cols-2">
          {s.mentorSessions.map((ms) => {
            const booked = ms.bookedBy.includes(me.id);
            const ok = meetsLevel(s, me.id, ms.levelRequired);
            const left = ms.seats - ms.bookedBy.length;
            return (
              <Label key={ms.id} className="flex flex-wrap items-center gap-4 p-4" watermark={false}>
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-[10px]", ms.kind === "group" ? "bg-leaf-soft text-leaf" : "bg-marigold-soft text-marigold-ink")}>{ms.kind === "group" ? <Users size={20} weight="duotone" /> : <ChalkboardTeacher size={20} weight="duotone" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{L(ms.title)}</div>
                  <div className="text-[12.5px] text-ink-3">{ms.mentor} · {date(ms.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {left > 0 ? t("seatsLeft", { n: left }) : t("full")}</div>
                </div>
                {booked ? <Chip tone="leaf" icon={<Check size={13} weight="bold" />}>{t("booked")}</Chip> : !ok ? <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${ms.levelRequired}` as const) })}</Chip> : <Button size="sm" variant="secondary" disabled={left <= 0} onClick={() => { dispatch({ type: "bookMentor", creatorId: me.id, sessionId: ms.id }); toast(t("booked"), "success"); }}>{t("book")}</Button>}
              </Label>
            );
          })}
        </div>
      </Section>

      <Section title={t("empowerment")}>
        <div className="label-card grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4 rtl:sm:divide-x-reverse">
          {perks.map((p) => (
            <div key={p} className="p-5">
              <h3 className="text-[15px] font-semibold">{t(`emp_${p}` as const)}</h3>
              <p className="mt-1 text-[13.5px] text-ink-2">{t(`emp_${p}_body` as const)}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function TrackDetail({ id }: { id: string }) {
  const t = useT();
  const L = useL();
  const { date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const celebrate = useCelebrate();
  const toast = useToast();
  const tr = s.academy.tracks.find((x) => x.id === id);
  if (!tr) return <div className="text-ink-2">{t("notFound")}</div>;
  const progress = s.academy.progress[me.id] ?? {};
  const p = trackProgress(s, me.id, tr.id);
  const ok = meetsLevel(s, me.id, tr.levelRequired);
  const complete = (moduleId: string) => {
    const willFinish = tr.modules.filter((m) => !progress[m.id]).length === 1;
    dispatch({ type: "completeModule", creatorId: me.id, trackId: tr.id, moduleId });
    if (willFinish) {
      celebrate();
      toast(`${t("trackComplete")}. +${tr.sparks} ${t("sparks")}`, "success");
    }
  };
  return (
    <div className="flex flex-col gap-8">
      <Link to="/creator/academy" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("academy")}</Link>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <Label className="flex gap-5 p-6" watermark={false}>
            <div className="hidden h-40 w-32 shrink-0 overflow-hidden rounded-[6px] sm:block"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} compact /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2"><Chip>{L(tr.format)}</Chip><Chip>{t("levelRequired")}: {t(`lv_${tr.levelRequired}` as const)}</Chip><Chip tone="marigold">+{tr.sparks} {t("sparks")}</Chip></div>
              <h1 className="mt-3 text-3xl md:text-4xl">{L(tr.title)}</h1>
              <p className="mt-3 max-w-[60ch] text-ink-2">{L(tr.blurb)}</p>
            </div>
          </Label>
          <ol className="mt-4 grid gap-3">
            {tr.modules.map((m, i) => {
              const done = progress[m.id];
              return (
                <li key={m.id}>
                  <Label className={cn("flex flex-wrap items-center gap-4 p-4", done && "bg-leaf-soft/30")} watermark={false}>
                    <Stamp pressed={!!done} size={52} animate={i === tr.modules.findIndex((x) => progress[x.id]) + (tr.modules.filter((x) => progress[x.id]).length - 1)} icon={done ? <Check weight="bold" size={20} /> : undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">{i + 1}. {L(m.title)}</div>
                      <div className="text-[13px] text-ink-2">{L(m.summary)}</div>
                      <div className="mt-1 text-[12px] text-ink-3">{t(`mk_${m.kind}` as const)} · {m.minutes} {t("minutes")}{done && ` · ${date(done)}`}</div>
                    </div>
                    {done ? <Chip tone="leaf">{t("completed2")}</Chip> : ok ? <Button size="sm" variant="secondary" onClick={() => complete(m.id)} icon={<PlayCircle size={16} weight="fill" />}>{t("markComplete2")}</Button> : <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${tr.levelRequired}` as const) })}</Chip>}
                  </Label>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="lg:col-span-4">
          <Certificate title={L(tr.title)} name={me.name} date={p.complete ? date(progress[tr.modules[tr.modules.length - 1].id]) : `${p.done}/${p.total} ${t("modules")}`} meta={`${tr.modules.length} ${t("modules")}`} sealed={p.complete} />
          {p.complete && <p className="mt-2 text-center text-[12.5px] text-ink-3">{t("certificateHint")}</p>}
        </div>
      </div>
    </div>
  );
}
