import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, X, Upload, Truck, Camera, ChatCenteredText, Link as LinkIcon, MapPin, SealCheck, Sparkle, FilmSlate } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, EmptyState, Field, Input, ProgressRing, Select, Segmented, SimulatedTag } from "../../ui/primitives";
import { Reveal, spring, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { JourneyTrail } from "../../ui/JourneyTrail";
import { actorFor, stageOrder } from "../../domain/stages";
import { SHIPMENT_ORDER } from "../../domain/simulate";
import { campaignById, participationById } from "../../domain/selectors";
import { BrandMark, KitList, Points, StageChip, useCurrentCreator } from "../shared/bits";
import type { Participation, Campaign, Platform } from "../../domain/types";
import { cn } from "../../ui/cn";

type Tab = "brief" | "kit" | "upload" | "feedback" | "publish";
const TABS: Tab[] = ["brief", "kit", "upload", "feedback", "publish"];

export function Journey({ participationId, tab }: { participationId: string; tab?: string }) {
  const t = useT();
  const L = useL();
  const s = useStore();
  const nav = useNavigate();
  const p = participationById(s, participationId);
  const me = useCurrentCreator();
  const c = p ? campaignById(s, p.campaignId) : undefined;
  const current: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "brief";

  if (!p || !c || p.creatorId !== me.id) {
    return <EmptyState title={t("notFound")} action={<Button variant="secondary" to="/creator/campaigns">{t("campaigns")}</Button>} />;
  }
  const b = s.brands.find((x) => x.id === c.brandId)!;
  const actor = actorFor(p.stage);

  return (
    <div className="flex flex-col gap-6">
      <Link to="/creator/campaigns" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("campaigns")}</Link>
      <Reveal inView={false}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandMark brand={b} />
            <h1 className="mt-2 text-3xl md:text-4xl">{L(c.title)}</h1>
            <p className="mt-2 max-w-[60ch] text-ink-2">{L(c.hook)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StageChip stage={p.stage} className="h-8 px-3 text-[13px]" />
            <Points value={c.points} className="text-lg" />
          </div>
        </div>
      </Reveal>

      <Reveal inView={false} delay={0.06} className="card p-4 md:p-5">
        <div className="mb-1 flex items-center justify-between gap-3 px-1">
          <span className="text-[13px] font-medium text-ink-2">{t("trail")}</span>
          <span className="text-[13px] text-ink-2">
            {t("whoMoves")}: <span className="font-semibold text-ink">{actor === "creator" ? t("you") : actor === "brand" ? t("brandTeam") : t("nobody")}</span>
          </span>
        </div>
        <JourneyTrail participation={p} />
      </Reveal>

      <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Segmented value={current} onChange={(v) => nav(`/creator/campaigns/${p.id}/${v}`)} options={TABS.map((x) => ({ value: x, label: t(`tab_${x}` as const) }))} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {current === "brief" && <BriefTab c={c} />}
          {current === "kit" && <KitTab p={p} c={c} />}
          {current === "upload" && <UploadTab p={p} c={c} />}
          {current === "feedback" && <FeedbackTab p={p} />}
          {current === "publish" && <PublishTab p={p} c={c} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function BriefTab({ c }: { c: Campaign }) {
  const t = useT();
  const L = useL();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card p-6 lg:col-span-2">
        <h2 className="text-xl">{t("deliverable")}</h2>
        <p className="mt-2 text-[15px] text-ink-2">{L(c.brief.deliverable)}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-[14px] font-semibold"><FilmSlate size={16} className="me-1.5 inline text-leaf" />{t("shotList")}</h3>
            <ol className="grid gap-1.5 text-[14.5px]">{c.brief.shotList.map((x, i) => <li key={i} className="flex gap-2"><span className="w-5 shrink-0 font-semibold text-ink-3">{i + 1}</span>{L(x)}</li>)}</ol>
          </div>
          <div className="grid gap-4">
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-leaf"><Check size={16} weight="bold" className="me-1.5 inline" />{t("dos")}</h3>
              <ul className="grid gap-1.5 text-[14.5px]">{c.brief.dos.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
            </div>
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-rose"><X size={16} weight="bold" className="me-1.5 inline" />{t("donts")}</h3>
              <ul className="grid gap-1.5 text-[14.5px]">{c.brief.donts.map((x, i) => <li key={i}>{L(x)}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-xl">{t("acceptance")}</h2>
        <p className="mt-1 text-[13px] text-ink-3">{t("duration")}: {c.brief.durationSec.min}-{c.brief.durationSec.max} {t("seconds")}</p>
        <ul className="mt-4 grid gap-2">
          {c.brief.acceptance.map((a) => (
            <li key={a.key} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2 text-[13.5px]">
              <span>{L(a.label)}</span>
              <span className="shrink-0 font-semibold tabular text-ink-3">{a.weight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KitTab({ p, c }: { p: Participation; c: Campaign }) {
  const t = useT();
  const { date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const addressReady = !!me.address.line1 && !!me.address.phone;
  const shipmentIdx = p.shipment ? SHIPMENT_ORDER.indexOf(p.shipment.status) : -1;
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="card p-6 lg:col-span-3">
        <h2 className="text-xl">{t("kitIncludes")}</h2>
        <div className="mt-4"><KitList campaign={c} /></div>
      </div>
      <div className="card flex flex-col gap-5 p-6 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">{t("tracking")}</h2>
          <SimulatedTag />
        </div>
        {p.stage === "invited" && <p className="text-[14px] text-ink-2">{t("kitWaiting")}</p>}
        {p.stage === "accepted" && (
          <div className="grid gap-3">
            <div className="rounded-2xl bg-surface-2 p-4 text-[14px]">
              <div className="mb-1 flex items-center gap-1.5 font-medium"><MapPin size={16} className="text-leaf" />{t("deliverTo")}</div>
              {addressReady ? <div className="text-ink-2">{me.address.line1}, {me.address.city}<br /><span dir="ltr">{me.address.phone}</span></div> : <div className="text-rose">{t("addressMissing")}</div>}
            </div>
            {addressReady ? (
              <Button onClick={() => { dispatch({ type: "confirmProfile", participationId: p.id }); celebrate(); }} icon={<Truck size={16} weight="bold" />}>{t("confirmAddress")}</Button>
            ) : (
              <Button variant="secondary" to="/creator/profile">{t("editProfile")}</Button>
            )}
          </div>
        )}
        {p.shipment && (
          <>
            <div className="grid grid-cols-2 gap-3 text-[14px]">
              <div><div className="text-[12px] text-ink-3">{t("courier")}</div><div className="font-medium">{p.shipment.courier}</div></div>
              <div><div className="text-[12px] text-ink-3">{t("tracking")}</div><div className="font-medium tabular">{p.shipment.trackingNumber}</div></div>
            </div>
            <ol className="relative grid gap-3 border-s-2 border-line ps-5">
              {SHIPMENT_ORDER.map((st, i) => {
                const done = i <= shipmentIdx;
                const active = i === shipmentIdx;
                const entry = p.stageLog.find((e) => e.stage === (st === "address_confirmed" ? "profile_confirmed" : st));
                return (
                  <li key={st} className="relative text-[14px]">
                    <span className={cn("absolute -start-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2", done ? "border-leaf bg-leaf" : "border-line-2 bg-surface")}>{active && <motion.span layoutId="ship-dot" className="h-1.5 w-1.5 rounded-full bg-white" transition={spring} />}</span>
                    <span className={cn(active ? "font-semibold" : done ? "" : "text-ink-3")}>{t(`sh_${st}` as const)}</span>
                    {entry && <span className="ms-2 text-[12px] text-ink-3">{date(entry.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                  </li>
                );
              })}
            </ol>
          </>
        )}
        {p.stage === "delivered" && (
          <div className="grid gap-3">
            <p className="text-[14px] text-ink-2">{t("kitDelivered")}</p>
            <Button onClick={() => { dispatch({ type: "startShoot", participationId: p.id }); toast(t("stage_shoot"), "success"); }} icon={<Camera size={16} weight="bold" />}>{t("startShoot")}</Button>
          </div>
        )}
      </div>
      {s.lang && null}
    </div>
  );
}

function UploadTab({ p, c }: { p: Participation; c: Campaign }) {
  const t = useT();
  const L = useL();
  const { bytes, clock } = useFormat();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [duration, setDuration] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const canUpload = p.stage === "shoot" || p.stage === "changes_requested";
  const version = p.submissions.length + 1;
  const latest = p.submissions[p.submissions.length - 1];

  const pick = (f: File | undefined) => {
    if (!f) return;
    setFile({ name: f.name, size: f.size });
    // Read duration from metadata locally. The file never leaves the device.
    try {
      const url = URL.createObjectURL(f);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { if (Number.isFinite(v.duration)) setDuration(String(Math.round(v.duration))); URL.revokeObjectURL(url); };
      v.onerror = () => URL.revokeObjectURL(url);
      v.src = url;
    } catch {
      // ignore
    }
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => pick(e.target.files?.[0]);
  const submit = () => {
    if (!file || !duration) return;
    const before = p.submissions.length;
    dispatch({ type: "upload", participationId: p.id, filename: file.name, sizeBytes: file.size, durationSec: Number(duration) });
    // The reducer runs synchronously; if it threw, lastError surfaces as a toast.
    window.setTimeout(() => {
      toast(t("uploadedToast", { n: before + 1, score: "" }).replace(/\s+\.$/, "."), "success");
    }, 0);
    celebrate();
    setFile(null);
    setDuration("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="card p-6 lg:col-span-2">
        <h2 className="text-xl">{t("uploadTitle")}</h2>
        <p className="mt-1 text-[13.5px] text-ink-3">{t("uploadHint")}</p>
        {!canUpload ? (
          <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-[14px] text-ink-2">{stageOrder(p.stage) < stageOrder("shoot") ? t("notYetShoot") : p.stage === "manual_review" || p.stage === "auto_check" ? t("inReviewNow", { n: latest?.version ?? 1 }) : t("uploadClosed")}</p>
        ) : (
          <div className="mt-5 grid gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors", drag ? "border-leaf bg-leaf-soft" : "border-line-2 hover:border-ink-3")}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-soft text-leaf"><Upload size={22} weight="bold" /></span>
              <span className="text-[14px] font-medium">{file ? file.name : t("chooseFile")}</span>
              <span className="text-[12.5px] text-ink-3">{file ? bytes(file.size) : t("dropHere")}</span>
            </button>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onChange} />
            <Field label={t("durationSec")} hint={`${c.brief.durationSec.min}-${c.brief.durationSec.max} ${t("seconds")}`}>
              <Input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Button disabled={!file || !duration} onClick={submit}>{t("submitCut", { n: version })}</Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl">{t("versions")}</h2>
          <SimulatedTag />
        </div>
        {p.submissions.length === 0 ? (
          <EmptyState icon={<Sparkle size={22} weight="duotone" />} title={t("nothingHere")} />
        ) : (
          p.submissions.slice().reverse().map((sub) => (
            <div key={sub.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-4">
                <ProgressRing value={sub.check.score / 100} size={64} stroke={7}><span className="text-[14px] font-bold tabular">{sub.check.score}</span></ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold">v{sub.version}</span>
                    <Chip tone={sub.check.passed ? "leaf" : "rose"}>{sub.check.passed ? t("passed") : t("needsWork")}</Chip>
                  </div>
                  <div className="mt-1 truncate text-[13px] text-ink-3">{sub.filename} · {bytes(sub.sizeBytes)} · {clock(sub.durationSec)}</div>
                </div>
              </div>
              <ul className="mt-4 grid gap-1.5">
                {sub.check.results.map((r) => (
                  <li key={r.key} className="flex items-start gap-2 text-[13.5px]">
                    <span className={cn("mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full", r.passed ? "bg-leaf-soft text-leaf" : "bg-rose-soft text-rose")}>{r.passed ? <Check size={11} weight="bold" /> : <X size={11} weight="bold" />}</span>
                    <span className={cn(r.passed ? "text-ink-2" : "text-ink")}>{L(r.note)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FeedbackTab({ p }: { p: Participation }) {
  const t = useT();
  const { relative, clock } = useFormat();
  if (p.reviews.length === 0) return <EmptyState icon={<ChatCenteredText size={22} weight="duotone" />} title={t("noFeedback")} body={t("noFeedbackBody")} />;
  return (
    <div className="grid gap-4">
      {p.reviews.slice().reverse().map((r) => {
        const sub = p.submissions.find((x) => x.id === r.submissionId);
        return (
          <article key={r.id} className={cn("card p-6", r.decision === "approved" && "border-leaf/40")}>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={r.decision === "approved" ? "leaf" : "rose"}>{t(`decision_${r.decision}` as const)}</Chip>
              {sub && <Chip>v{sub.version}</Chip>}
              <span className="text-[13px] text-ink-3">{t("reviewedBy")} {r.reviewerName} · {relative(r.at)}</span>
            </div>
            {r.note && <p className="mt-3 text-[15px]">{r.note}</p>}
            {r.notes.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-[13px] font-medium text-ink-2">{t("timedNotes")}</div>
                <ul className="grid gap-1.5">
                  {r.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px]"><span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12.5px] font-semibold tabular">{clock(n.t)}</span>{n.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function PublishTab({ p, c }: { p: Participation; c: Campaign }) {
  const t = useT();
  const { date } = useFormat();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [platform, setPlatform] = useState<Platform>(me.socials.tiktok ? "tiktok" : "instagram");
  const [url, setUrl] = useState("");
  const ready = p.stage === "approved_to_publish";
  const valid = useMemo(() => /^https?:\/\/\S+/.test(url), [url]);
  const submit = () => {
    dispatch({ type: "publish", participationId: p.id, platform, url: url.trim() });
    celebrate();
    toast(t("linkSent"), "success");
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-6">
        <h2 className="text-xl">{t("publishTitle")}</h2>
        <p className="mt-1 text-[13.5px] text-ink-3">{t("publishHint")}</p>
        {ready ? (
          <div className="mt-5 grid gap-4">
            <Field label={t("platform")}>
              <Select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </Select>
            </Field>
            <Field label={t("postUrl")} hint="https://"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/..." inputMode="url" /></Field>
            <Button disabled={!valid} onClick={submit} icon={<LinkIcon size={16} weight="bold" />}>{t("submitLink")}</Button>
          </div>
        ) : p.publish ? null : (
          <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-[14px] text-ink-2">{t("notApproved")}</p>
        )}
        {p.publish && (
          <div className="mt-5 grid gap-3">
            <a href={p.publish.url} target="_blank" rel="noreferrer" className="truncate rounded-2xl bg-surface-2 p-4 text-[14px] font-medium text-leaf hover:underline">{p.publish.url}</a>
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{p.publish.platform}</Chip>
              <Chip>{date(p.publish.postedAt)}</Chip>
              <Chip tone={p.publish.verified ? "leaf" : "marigold"} icon={p.publish.verified ? <SealCheck size={14} weight="fill" /> : undefined}>{p.publish.verified ? t("verified") : t("linkSent")}</Chip>
            </div>
          </div>
        )}
      </div>
      <div className="card-soft flex flex-col justify-between gap-6 bg-leaf-soft p-6 text-leaf-ink">
        <div>
          <div className="text-[13px] opacity-70">{t("pointsValue")}</div>
          <div className="text-4xl font-semibold tabular">{c.points}</div>
        </div>
        <ol className="grid gap-2 text-[14px]">
          {(["link_submitted", "post_verified", "points_released", "completed"] as const).map((st) => {
            const done = stageOrder(p.stage) >= stageOrder(st);
            return <li key={st} className={cn("flex items-center gap-2", !done && "opacity-50")}><span className={cn("flex h-5 w-5 items-center justify-center rounded-full", done ? "bg-leaf text-white" : "border border-current")}>{done && <Check size={12} weight="bold" />}</span>{t(`stage_${st}` as const)}</li>;
          })}
        </ol>
      </div>
    </div>
  );
}
