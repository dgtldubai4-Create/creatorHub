import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Certificate, Lock, PlayCircle, Users, ChalkboardTeacher, HeartHalf, Lightbulb, Scales, Sparkle } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, ProgressRing, Section } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
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
  const perks = [
    { k: "licence", icon: <Scales size={22} weight="duotone" /> },
    { k: "kit", icon: <Lightbulb size={22} weight="duotone" /> },
    { k: "spotlight", icon: <Sparkle size={22} weight="duotone" /> },
    { k: "women", icon: <HeartHalf size={22} weight="duotone" /> },
  ] as const;
  return (
    <div className="flex flex-col gap-10">
      <div className="relative -mx-4 grid overflow-hidden bg-forest text-white md:mx-0 md:rounded-[var(--radius-card)] lg:grid-cols-5">
        <div className="relative flex flex-col justify-center gap-3 p-6 lg:col-span-3 lg:p-10">
          <div className="pattern-grid absolute inset-0 text-lime/10" />
          <h1 className="relative text-4xl font-extrabold tracking-[-0.04em] text-white md:text-5xl">{t("academy")}<span className="text-lime">.</span></h1>
          <p className="relative max-w-[55ch] text-white/80">{t("academySub")}</p>
          <div className="relative mt-2 flex flex-wrap items-center gap-2"><LevelChip level={lv.level} />{certs.length > 0 && <span className="sticker bg-lime text-lime-ink" style={{ ["--tilt" as string]: "-3deg" }}><Certificate size={14} weight="fill" />{certs.length} {t("certificates").toLowerCase()}</span>}</div>
        </div>
        <div className="h-48 lg:col-span-2 lg:h-full"><ArtSlot id="academy-hero" /></div>
      </div>

      <Section title={t("tracks")}>
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {s.academy.tracks.map((tr) => {
            const p = trackProgress(s, me.id, tr.id);
            const ok = meetsLevel(s, me.id, tr.levelRequired);
            return (
              <Item key={tr.id}>
                <Link to={`/creator/academy/${tr.id}`} className={cn("lift card flex h-full flex-col overflow-hidden", !ok && "opacity-75")}>
                  <div className="relative h-36"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} />
                    <div className="absolute end-3 top-3">{p.complete ? <Chip tone="leaf" icon={<Certificate size={13} weight="fill" />}>{t("trackComplete")}</Chip> : !ok ? <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${tr.levelRequired}` as const) })}</Chip> : null}</div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h2 className="text-xl">{L(tr.title)}</h2>
                    <p className="text-[14px] text-ink-2">{L(tr.blurb)}</p>
                    <div className="mt-auto flex items-center justify-between pt-3 text-[12.5px] text-ink-3">
                      <span>{tr.modules.length} {t("modules")} · {L(tr.format)}</span>
                      <ProgressRing value={p.total ? p.done / p.total : 0} size={34} stroke={4}><span className="text-[10px] font-bold tabular">{p.done}/{p.total}</span></ProgressRing>
                    </div>
                  </div>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      <Section title={t("mentoring")} sub={t("mentoringSub")}>
        <div className="grid gap-3 md:grid-cols-2">
          {s.mentorSessions.map((ms) => {
            const booked = ms.bookedBy.includes(me.id);
            const ok = meetsLevel(s, me.id, ms.levelRequired);
            const left = ms.seats - ms.bookedBy.length;
            return (
              <div key={ms.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", ms.kind === "group" ? "bg-leaf-soft text-leaf" : "bg-marigold-soft text-marigold-ink")}>{ms.kind === "group" ? <Users size={20} weight="duotone" /> : <ChalkboardTeacher size={20} weight="duotone" />}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{L(ms.title)}</div>
                  <div className="text-[12.5px] text-ink-3">{ms.mentor} · {date(ms.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {left > 0 ? t("seatsLeft", { n: left }) : t("full")}</div>
                </div>
                {booked ? <Chip tone="leaf" icon={<Check size={13} weight="bold" />}>{t("booked")}</Chip> : !ok ? <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${ms.levelRequired}` as const) })}</Chip> : <Button size="sm" variant="secondary" disabled={left <= 0} onClick={() => { dispatch({ type: "bookMentor", creatorId: me.id, sessionId: ms.id }); toast(t("booked"), "success"); }}>{t("book")}</Button>}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={t("empowerment")}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {perks.map((p) => (
            <div key={p.k} className="card-soft flex flex-col gap-3 p-5">
              <span className="text-leaf">{p.icon}</span>
              <h3 className="text-[16px] font-semibold">{t(`emp_${p.k}` as const)}</h3>
              <p className="text-[13.5px] text-ink-2">{t(`emp_${p.k}_body` as const)}</p>
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
    <div className="flex flex-col gap-6">
      <Link to="/creator/academy" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("academy")}</Link>
      <div className="card grid overflow-hidden lg:grid-cols-5">
        <div className="h-48 lg:col-span-2 lg:h-full"><ArtSlot id={`track-${tr.id.replace("tr_", "")}`} /></div>
        <div className="flex flex-col gap-3 p-6 lg:col-span-3 lg:p-8">
          <div className="flex flex-wrap gap-2"><Chip>{L(tr.format)}</Chip><Chip>{t("levelRequired")}: {t(`lv_${tr.levelRequired}` as const)}</Chip><Chip tone="marigold">+{tr.sparks} {t("sparks")}</Chip></div>
          <h1 className="text-3xl md:text-4xl">{L(tr.title)}</h1>
          <p className="max-w-[60ch] text-ink-2">{L(tr.blurb)}</p>
          <div className="mt-auto flex items-center gap-3 pt-2">
            <ProgressRing value={p.total ? p.done / p.total : 0} size={48} stroke={5}><span className="text-[11px] font-bold tabular">{p.done}/{p.total}</span></ProgressRing>
            {p.complete && <Chip tone="leaf" icon={<Certificate size={14} weight="fill" />}>{t("certificate")} · {t("certificateHint")}</Chip>}
          </div>
        </div>
      </div>
      <ol className="grid gap-3">
        {tr.modules.map((m, i) => {
          const done = progress[m.id];
          return (
            <li key={m.id} className={cn("card flex flex-wrap items-center gap-4 p-4", done && "border-leaf/40 bg-leaf-soft/20")}>
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", done ? "bg-leaf text-white" : "bg-surface-2 text-ink-2")}>{done ? <Check size={20} weight="bold" /> : <PlayCircle size={22} weight="duotone" />}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{i + 1}. {L(m.title)}</div>
                <div className="text-[13px] text-ink-2">{L(m.summary)}</div>
                <div className="mt-1 text-[12px] text-ink-3">{t(`mk_${m.kind}` as const)} · {m.minutes} {t("minutes")}{done && ` · ${date(done)}`}</div>
              </div>
              {done ? <Chip tone="leaf">{t("completed2")}</Chip> : ok ? <Button size="sm" variant="secondary" onClick={() => complete(m.id)}>{t("markComplete2")}</Button> : <Chip icon={<Lock size={12} weight="bold" />}>{t("levelLocked", { level: t(`lv_${tr.levelRequired}` as const) })}</Chip>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
