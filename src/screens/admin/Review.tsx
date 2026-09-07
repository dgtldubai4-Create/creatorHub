import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Check, X, PlayCircle, Plus, Trash, ArrowLeft } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, EmptyState, Field, Input, PageHeader, ProgressRing, SimulatedTag, Textarea } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { reviewQueue } from "../../domain/selectors";
import { BrandMark } from "../shared/bits";
import type { TimedNote } from "../../domain/types";
import { cn } from "../../ui/cn";

export function AdminReview() {
  const t = useT();
  const L = useL();
  const { bytes, clock, relative } = useFormat();
  const s = useStore();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const { pid, subId } = useParams();
  const queue = reviewQueue(s);
  const p = s.participations.find((x) => x.id === pid) ?? queue[0];
  const sub = p?.submissions.find((x) => x.id === subId) ?? p?.submissions.at(-1);
  const c = p ? s.campaigns.find((x) => x.id === p.campaignId) : undefined;
  const cr = p ? s.creators.find((x) => x.id === p.creatorId) : undefined;
  const [notes, setNotes] = useState<TimedNote[]>([]);
  const [draft, setDraft] = useState("");
  const [general, setGeneral] = useState("");
  const [pos, setPos] = useState(0);
  useEffect(() => { setNotes([]); setDraft(""); setGeneral(""); setPos(0); }, [sub?.id]);
  const duration = sub?.durationSec ?? 30;
  const bars = useMemo(() => Array.from({ length: 64 }, (_, i) => 0.25 + ((Math.sin(i * 1.7 + (sub ? sub.sizeBytes % 7 : 0)) + 1) / 2) * 0.75), [sub]);

  const decide = (decision: "changes" | "approved") => {
    if (!p || !sub) return;
    dispatch({ type: "review", participationId: p.id, submissionId: sub.id, decision, note: general.trim(), notes });
    toast(t("decisionSent"), "success");
    if (decision === "approved") celebrate();
    const next = queue.find((x) => x.id !== p.id);
    nav(next ? `/admin/review/${next.id}/${next.submissions.at(-1)?.id}` : "/admin/review");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("review")} sub={t("reviewSub")} />
      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <h2 className="mb-3 text-[14px] font-semibold text-ink-2">{t("queue")} · {queue.length}</h2>
          {queue.length === 0 ? (
            <EmptyState icon={<PlayCircle size={22} weight="duotone" />} title={t("emptyQueue")} body={t("emptyQueueBody")} />
          ) : (
            <Stagger className="grid gap-2" gap={0.03}>
              {queue.map((q) => {
                const qc = s.campaigns.find((x) => x.id === q.campaignId)!;
                const qcr = s.creators.find((x) => x.id === q.creatorId)!;
                const qs = q.submissions.at(-1)!;
                const active = q.id === p?.id;
                return (
                  <Item key={q.id}>
                    <Link to={`/admin/review/${q.id}/${qs.id}`} className={cn("card press flex items-center gap-3 p-3 hover:border-ink-3", active && "border-leaf bg-leaf-soft/30")}>
                      <Avatar name={qcr.name} hue={qcr.hue} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium">{qcr.name}</div>
                        <div className="truncate text-[12px] text-ink-3">{L(qc.title)} · v{qs.version}</div>
                      </div>
                      <span className={cn("text-[13px] font-semibold tabular", qs.check.passed ? "text-leaf" : "text-rose")}>{qs.check.score}</span>
                    </Link>
                  </Item>
                );
              })}
            </Stagger>
          )}
        </aside>

        {p && sub && c && cr ? (
          <div className="grid gap-4 lg:col-span-8 xl:col-span-9">
            <div className="card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar name={cr.name} hue={cr.hue} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold">{cr.name}</span><BrandMark brand={s.brands.find((b) => b.id === c.brandId)!} size="sm" /><span className="text-[13px] text-ink-2">{L(c.title)}</span></div>
                  <div className="text-[12.5px] text-ink-3">{t("fileMeta")}: {sub.filename} · {bytes(sub.sizeBytes)} · {clock(sub.durationSec)} · v{sub.version} · {relative(sub.uploadedAt)}</div>
                </div>
                <Link to="/admin/campaigns" className="hidden" aria-hidden><ArrowLeft /></Link>
              </div>
              {/* Simulated player: a scrubbable timeline. No media is stored. */}
              <div className="mt-4 rounded-2xl bg-ink p-4 text-bg">
                <div className="mb-2 flex items-center justify-between text-[12px] opacity-70"><span>{t("player")}</span><SimulatedTag className="border-bg/30 text-bg/70" /></div>
                <Scrubber bars={bars} duration={duration} pos={pos} onChange={setPos} notes={[...notes, ...p.reviews.flatMap((r) => r.notes)]} />
                <div className="mt-2 flex items-center justify-between text-[13px] tabular"><span>{clock(pos)}</span><span className="opacity-70">{clock(duration)}</span></div>
                <p className="mt-2 text-[11.5px] opacity-60">{t("playerHint")}</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <Field label={t("addNoteAt", { t: clock(pos) })}><Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { setNotes((n) => [...n, { t: Math.round(pos), text: draft.trim() }].sort((a, b) => a.t - b.t)); setDraft(""); } }} placeholder="Hook lands late, cut the first 2 seconds." /></Field>
                <Button variant="secondary" disabled={!draft.trim()} onClick={() => { setNotes((n) => [...n, { t: Math.round(pos), text: draft.trim() }].sort((a, b) => a.t - b.t)); setDraft(""); }} icon={<Plus size={15} weight="bold" />}>{t("noteText")}</Button>
              </div>
              {notes.length > 0 && (
                <ul className="mt-3 grid gap-1.5">
                  {notes.map((n, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13.5px]">
                      <button className="rounded-md bg-surface px-1.5 py-0.5 text-[12px] font-semibold tabular hover:text-leaf" onClick={() => setPos(n.t)}>{clock(n.t)}</button>
                      <span className="flex-1">{n.text}</span>
                      <button aria-label={t("close")} onClick={() => setNotes((xs) => xs.filter((_, j) => j !== i))} className="text-ink-3 hover:text-rose"><Trash size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <div className="flex items-center justify-between"><h3 className="text-[14px] font-semibold">{t("autoCheck")}</h3><SimulatedTag /></div>
                <div className="mt-3 flex items-center gap-4">
                  <ProgressRing value={sub.check.score / 100} size={60} stroke={7}><span className="text-[13px] font-bold tabular">{sub.check.score}</span></ProgressRing>
                  <Chip tone={sub.check.passed ? "leaf" : "rose"}>{sub.check.passed ? t("passed") : t("needsWork")}</Chip>
                </div>
                <ul className="mt-3 grid gap-1.5">
                  {sub.check.results.map((r) => (
                    <li key={r.key} className="flex items-start gap-2 text-[13px]"><span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", r.passed ? "bg-leaf-soft text-leaf" : "bg-rose-soft text-rose")}>{r.passed ? <Check size={10} weight="bold" /> : <X size={10} weight="bold" />}</span><span className="text-ink-2">{L(r.note)}</span></li>
                  ))}
                </ul>
              </div>
              <div className="card flex flex-col gap-3 p-5">
                <Field label={t("generalNote")}><Textarea value={general} onChange={(e) => setGeneral(e.target.value)} placeholder="Close. Two fixes and it is there." /></Field>
                <div className="mt-auto flex gap-2">
                  <Button variant="danger" className="flex-1" onClick={() => decide("changes")} icon={<X size={16} weight="bold" />}>{t("requestChanges")}</Button>
                  <Button className="flex-1" onClick={() => decide("approved")} icon={<Check size={16} weight="bold" />}>{t("approve")}</Button>
                </div>
                {p.submissions.length > 1 && (
                  <div className="mt-2 text-[12.5px] text-ink-3">{t("previousVersions")}: {p.submissions.filter((x) => x.id !== sub.id).map((x) => `v${x.version} (${x.check.score})`).join(", ")}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 xl:col-span-9"><EmptyState icon={<PlayCircle size={22} weight="duotone" />} title={t("emptyQueue")} body={t("emptyQueueBody")} /></div>
        )}
      </div>
    </div>
  );
}

function Scrubber({ bars, duration, pos, onChange, notes }: { bars: number[]; duration: number; pos: number; onChange: (t: number) => void; notes: TimedNote[] }) {
  const x = useMotionValue(pos / duration);
  useEffect(() => { x.set(pos / duration); }, [pos, duration, x]);
  const left = useTransform(x, (v) => `${v * 100}%`);
  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let ratio = (e.clientX - r.left) / r.width;
    if (rtl) ratio = 1 - ratio;
    onChange(Math.max(0, Math.min(duration, ratio * duration)));
  };
  return (
    <div className="relative h-16 cursor-pointer select-none touch-none" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e); }} onPointerMove={(e) => { if (e.buttons) seek(e); }} role="slider" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={Math.round(pos)} tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowRight") onChange(Math.min(duration, pos + 1)); if (e.key === "ArrowLeft") onChange(Math.max(0, pos - 1)); }}>
      <div className="absolute inset-0 flex items-end gap-[2px]">
        {bars.map((b, i) => <span key={i} className={cn("flex-1 rounded-sm", i / bars.length <= pos / duration ? "bg-marigold" : "bg-bg/25")} style={{ height: `${b * 100}%` }} />)}
      </div>
      {notes.map((n, i) => <span key={i} className="absolute top-0 h-full w-0.5 bg-leaf-deep" style={{ insetInlineStart: `${(n.t / duration) * 100}%` }} title={n.text} />)}
      <motion.span className="absolute top-0 h-full w-0.5 bg-bg" style={{ insetInlineStart: left }} />
    </div>
  );
}
