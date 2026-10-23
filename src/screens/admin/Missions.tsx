import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Check, X, LinkSimple, Lightning, PencilSimple, Play, Stop } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, ChipButton, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, Sheet, SimulatedTag, Textarea } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { ArtSlot } from "../../ui/ArtSlot";
import { missionEntriesToReview, MISSION_TYPES, squadTotals } from "../../domain/selectors";
import { can } from "../../domain/permissions";
import { newId } from "../../domain/simulate";
import type { Language, Level, Market, Mission, MissionType, Niche } from "../../domain/types";
import { BrandMark, EntryChip, MissionTypeChip } from "../shared/bits";
import { cn } from "../../ui/cn";

const MARKETS: Market[] = ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"];
const NICHES: Niche[] = ["haircare", "beauty", "family", "wellness", "food", "fitness", "lifestyle", "oralcare", "comedy"];
const LEVELS: Level[] = ["member", "insider", "pro", "ambassador"];

export function AdminMissions() {
  const t = useT();
  const L = useL();
  const { date, relative } = useFormat();
  const s = useStore();
  const { id } = useParams();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const role = s.session.role;
  const [f, setF] = useState<"live" | "draft" | "closed" | "review">("review");
  const [editing, setEditing] = useState<Mission | null | "new">(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queue = missionEntriesToReview(s);
  const list = s.missions.filter((m) => (f === "review" ? queue.some((q) => q.mission.id === m.id) : m.status === f));
  const open = s.missions.find((m) => m.id === id);
  const referrals = s.referrals.filter((r) => r.status === "pending");

  const decide = (m: Mission, creatorId: string, decision: "approved" | "changes") => {
    dispatch({ type: "reviewMission", missionId: m.id, creatorId, decision, note: notes[`${m.id}:${creatorId}`] ?? "" });
    toast(t("decisionSent"), "success");
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("missions")}
        sub={`${t("missionPostsToReview")}: ${queue.length}`}
        actions={
          <>
            <Segmented value={f} onChange={setF} options={[{ value: "review", label: `${t("review")} (${queue.length})` }, { value: "live", label: t("mStatus_live") }, { value: "draft", label: t("mStatus_draft") }, { value: "closed", label: t("mStatus_closed") }]} />
            {can(role, "campaigns") && <Button onClick={() => setEditing("new")} icon={<Plus size={16} weight="bold" />}>{t("newMission")}</Button>}
          </>
        }
      />

      {list.length === 0 ? (
        <EmptyState icon={<Lightning size={24} weight="duotone" />} title={f === "review" ? t("emptyQueue") : t("nothingHere")} body={f === "review" ? t("emptyQueueBody") : undefined} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" gap={0.03}>
          {list.map((m) => {
            const b = s.brands.find((x) => x.id === m.brandId);
            const entries = Object.values(m.entries);
            const toReview = entries.filter((e) => e.state === "submitted").length;
            return (
              <Item key={m.id}>
                <Link to={`/admin/missions/${m.id}`} className="label-card lift flex h-full flex-col overflow-hidden ">
                  <div className="relative h-28"><ArtSlot id={`mission-${m.type}`} /><div className="absolute start-3 top-3 flex gap-1.5"><MissionTypeChip type={m.type} /><Chip tone={m.status === "live" ? "leaf" : m.status === "draft" ? "neutral" : "ink"}>{t(`mStatus_${m.status}` as const)}</Chip></div></div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-2">{b ? <BrandMark brand={b} size="sm" /> : <span className="text-[12.5px] font-semibold text-leaf">{t("appName")}</span>}{toReview > 0 && <Chip tone="marigold">{toReview} {t("review").toLowerCase()}</Chip>}</div>
                    <h2 className="text-lg">{L(m.title)}</h2>
                    <div className="mt-auto flex items-center justify-between pt-2 text-[12.5px] text-ink-3"><span>{entries.length} {t("entries").toLowerCase()} · {m.markets.length === 6 ? t("sixMarkets") : m.markets.map((x) => t(`market_${x}` as const)).join(", ")}</span><span className="font-semibold tabular text-ink">{m.sparks} {t("sparks")}</span></div>
                  </div>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      )}

      {can(role, "invite") && referrals.length > 0 && (
        <Section title={`${t("referrals")} · ${referrals.length}`}>
          <ul className="label-card divide-y divide-line">
            {referrals.map((r) => {
              const cr = s.creators.find((c) => c.id === r.referrerId)!;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[14px]">
                  <Avatar name={cr.name} hue={cr.hue} size={30} /><span>{cr.name}</span><span className="text-ink-3">→ @{r.handle} · {relative(r.at)}</span>
                  <div className="ms-auto flex gap-2"><Button size="sm" variant="secondary" onClick={() => dispatch({ type: "decideReferral", referralId: r.id, approve: false })}>{t("rejectReferral")}</Button><Button size="sm" onClick={() => { dispatch({ type: "decideReferral", referralId: r.id, approve: true }); toast(t("approveReferral"), "success"); }}>{t("approveReferral")}</Button></div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Sheet open={!!open} onClose={() => nav("/admin/missions")} wide title={open ? L(open.title) : ""}>
        {open && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <MissionTypeChip type={open.type} /><Chip tone={open.status === "live" ? "leaf" : "neutral"}>{t(`mStatus_${open.status}` as const)}</Chip><Chip>{date(open.window.start)} - {date(open.window.end)}</Chip><Chip>{open.sparks} {t("sparks")}</Chip><Chip>{t(`lv_${open.levelRequired}` as const)}</Chip>
              {open.requiredHashtags.length > 0 && <Chip>{open.requiredHashtags.join(" ")}</Chip>}
              <div className="ms-auto flex gap-2">
                {can(role, "campaigns") && open.status === "draft" && <Button size="sm" onClick={() => dispatch({ type: "setMissionStatus", missionId: open.id, status: "live" })} icon={<Play size={14} weight="fill" />}>{t("goLive")}</Button>}
                {can(role, "campaigns") && open.status === "live" && <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "setMissionStatus", missionId: open.id, status: "closed" })} icon={<Stop size={14} weight="fill" />}>{t("closeMission")}</Button>}
                {can(role, "campaigns") && <Button size="sm" variant="secondary" onClick={() => setEditing(open)} icon={<PencilSimple size={14} weight="bold" />}>{t("editMission")}</Button>}
              </div>
            </div>
            <p className="text-[14.5px] text-ink-2">{L(open.prompt)}</p>
            {open.type === "team" && (
              <div className="grid gap-2 sm:grid-cols-3">{squadTotals(open).map(({ squad, sparks, submitted }) => <div key={squad.id} className="rounded-[8px] bg-surface-2 p-3 text-[13px]"><div className="font-semibold">{L(squad.name)}</div><div className="text-ink-3">{squad.memberIds.length} {t("members")} · {submitted} {t("es_submitted").toLowerCase()} · {sparks} {t("sparks")}</div></div>)}</div>
            )}
            <div className="flex items-center justify-between"><h3 className="text-[15px] font-semibold">{t("entries")} · {Object.keys(open.entries).length}</h3><SimulatedTag /></div>
            <ul className="grid gap-2">
              {Object.entries(open.entries).sort(([, a], [, b]) => (a.state === "submitted" ? -1 : 1) - (b.state === "submitted" ? -1 : 1)).map(([creatorId, e]) => {
                const cr = s.creators.find((c) => c.id === creatorId)!;
                const sub = e.submissions[e.submissions.length - 1];
                const key = `${open.id}:${creatorId}`;
                return (
                  <li key={creatorId} className={cn("rounded-[8px] border border-line p-3", e.state === "submitted" && "border-marigold/50 bg-marigold-soft/20")}>
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar name={cr.name} hue={cr.hue} size={34} />
                      <div className="min-w-0 flex-1"><div className="text-[14px] font-medium">{cr.name}</div><div className="text-[12px] text-ink-3">{cr.city} · {t(`market_${cr.market}` as const)}{e.squadId && ` · ${L(open.squads?.find((q) => q.id === e.squadId)?.name ?? { en: "", ar: "" })}`}</div></div>
                      <EntryChip state={e.state} />
                      {e.awarded && <span className="text-[13px] font-semibold tabular text-leaf">+{e.awarded}</span>}
                    </div>
                    {sub && (
                      <div className="mt-3 grid gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                          <a href={sub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-leaf hover:underline"><LinkSimple size={13} />{t("openPost")}</a>
                          <span className="text-ink-3">{relative(sub.at)}</span>
                          {(["hashtags", "disclosure", "timing"] as const).map((k) => <span key={k} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", sub.check[k] ? "bg-leaf-soft text-leaf-ink" : "bg-rose-soft text-rose")}>{sub.check[k] ? <Check size={11} weight="bold" /> : <X size={11} weight="bold" />}{t(`pc_${k}` as const)}</span>)}
                        </div>
                        <p className="text-[13.5px] text-ink-2">{sub.caption}</p>
                        {e.state === "submitted" && can(role, "review") && (
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="min-w-56 flex-1"><Field label={t("reviewerNote")}><Textarea value={notes[key] ?? ""} onChange={(ev) => setNotes((n) => ({ ...n, [key]: ev.target.value }))} className="min-h-12" /></Field></div>
                            <Button size="sm" variant="danger" onClick={() => decide(open, creatorId, "changes")} icon={<X size={14} weight="bold" />}>{t("requestChanges")}</Button>
                            <Button size="sm" onClick={() => decide(open, creatorId, "approved")} icon={<Check size={14} weight="bold" />}>{t("approve")}</Button>
                          </div>
                        )}
                        {sub.note && <p className="rounded-[8px] bg-surface-2 p-2.5 text-[13px]"><span className="font-medium">{sub.reviewerName}: </span>{sub.note}</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Sheet>
      <MissionEditor open={editing !== null} mission={editing === "new" ? undefined : editing ?? undefined} onClose={() => setEditing(null)} />
    </div>
  );
}

function MissionEditor({ open, onClose, mission }: { open: boolean; onClose: () => void; mission?: Mission }) {
  const t = useT();
  const L = useL();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const nav = useNavigate();
  const blank = () => ({ type: "monthly" as MissionType, brandId: "", titleEn: "", titleAr: "", promptEn: "", promptAr: "", sparks: "150", paid: false, start: new Date().toISOString().slice(0, 10), end: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), markets: MARKETS, languages: ["ar", "en"] as Language[], niches: [] as Niche[], level: "member" as Level, hashtags: "#DaburSquad", drop: false, place: "", trackId: "", squads: "" });
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (!open) return;
    if (!mission) {
      setF(blank());
      return;
    }
    setF({ type: mission.type, brandId: mission.brandId ?? "", titleEn: mission.title.en, titleAr: mission.title.ar, promptEn: mission.prompt.en, promptAr: mission.prompt.ar, sparks: String(mission.sparks), paid: mission.paid, start: mission.window.start, end: mission.window.end, markets: mission.markets, languages: mission.languages, niches: mission.niches, level: mission.levelRequired, hashtags: mission.requiredHashtags.join(" "), drop: !!mission.doubleSparksUntil, place: mission.place?.en ?? "", trackId: mission.trackId ?? "", squads: (mission.squads ?? []).map((q) => q.name.en).join("\n") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mission?.id]);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <T extends string>(k: "markets" | "languages" | "niches", v: T) => setF((x) => ({ ...x, [k]: (x[k] as T[]).includes(v) ? (x[k] as T[]).filter((y) => y !== v) : [...(x[k] as T[]), v] }));
  const valid = f.titleEn.trim() && f.promptEn.trim() && Number(f.sparks) > 0 && f.markets.length > 0 && f.languages.length > 0;
  const save = () => {
    if (!valid) return;
    const squadNames = f.squads.split("\n").map((x) => x.trim()).filter(Boolean);
    const m: Mission = {
      id: mission?.id ?? newId("ms", f.titleEn), type: f.type, status: mission?.status ?? "draft",
      title: { en: f.titleEn.trim(), ar: f.titleAr.trim() || f.titleEn.trim() }, prompt: { en: f.promptEn.trim(), ar: f.promptAr.trim() || f.promptEn.trim() },
      brandId: f.brandId || null, sparks: Number(f.sparks), paid: f.paid, window: { start: f.start, end: f.end }, markets: f.markets, languages: f.languages, niches: f.niches, levelRequired: f.level,
      requiredHashtags: f.hashtags.split(/\s+/).map((x) => x.trim()).filter((x) => x.startsWith("#")),
      doubleSparksUntil: f.drop ? new Date(Date.now() + 48 * 3600_000).toISOString() : undefined,
      place: f.place.trim() ? { en: f.place.trim(), ar: f.place.trim() } : undefined,
      trackId: f.type === "academy" && f.trackId ? f.trackId : undefined,
      squads: f.type === "team" ? (mission?.squads?.length ? mission.squads : squadNames.map((n, i) => ({ id: `sq_${i}_${newId("", n).slice(1, 7)}`, name: { en: n, ar: n }, memberIds: [] }))) : undefined,
      entries: mission?.entries ?? {},
    };
    dispatch({ type: "saveMission", mission: m });
    toast(t("saved"), "success");
    onClose();
    if (!mission) nav(`/admin/missions/${m.id}`);
  };
  return (
    <Sheet open={open} onClose={onClose} wide title={mission ? t("editMission") : t("newMission")}>
      <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("missionType")}><Select value={f.type} onChange={(e) => set("type", e.target.value as MissionType)}>{MISSION_TYPES.filter((x) => x !== "routine").map((x) => <option key={x} value={x}>{t(`mt_${x}` as const)}</option>)}</Select></Field>
          <Field label={t("brand")}><Select value={f.brandId} onChange={(e) => set("brandId", e.target.value)}><option value="">{t("appName")}</option>{s.brands.map((b) => <option key={b.id} value={b.id}>{L(b.localisedName)}</option>)}</Select></Field>
          <Field label={t("sparksValue")} required><Input inputMode="numeric" value={f.sparks} onChange={(e) => set("sparks", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label={`${t("campaignTitle")} (EN)`} required><Input value={f.titleEn} onChange={(e) => set("titleEn", e.target.value)} /></Field>
          <Field label={`${t("campaignTitle")} (AR)`}><Input dir="rtl" value={f.titleAr} onChange={(e) => set("titleAr", e.target.value)} /></Field>
          <Field label={t("levelRequired")}><Select value={f.level} onChange={(e) => set("level", e.target.value as Level)}>{LEVELS.map((l) => <option key={l} value={l}>{t(`lv_${l}` as const)}</option>)}</Select></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t("campaignHook")} (EN)`} required><Textarea value={f.promptEn} onChange={(e) => set("promptEn", e.target.value)} /></Field>
          <Field label={`${t("campaignHook")} (AR)`}><Textarea dir="rtl" value={f.promptAr} onChange={(e) => set("promptAr", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("windowStart")}><Input type="date" value={f.start} onChange={(e) => set("start", e.target.value)} /></Field>
          <Field label={t("windowEnd")}><Input type="date" value={f.end} onChange={(e) => set("end", e.target.value)} /></Field>
          <Field label={t("requiredHashtags")}><Input value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} dir="ltr" /></Field>
        </div>
        {(f.type === "event") && <Field label={t("where")}><Input value={f.place} onChange={(e) => set("place", e.target.value)} /></Field>}
        {f.type === "academy" && <Field label={t("tracks")}><Select value={f.trackId} onChange={(e) => set("trackId", e.target.value)}><option value="">-</option>{s.academy.tracks.map((tr) => <option key={tr.id} value={tr.id}>{L(tr.title)}</option>)}</Select></Field>}
        {f.type === "team" && !mission?.squads?.length && <Field label={t("squads")} hint="One squad name per line"><Textarea value={f.squads} onChange={(e) => set("squads", e.target.value)} /></Field>}
        <Field label={t("marketsTarget")}><div className="flex flex-wrap gap-2">{MARKETS.map((m) => <ChipButton key={m} type="button" selected={f.markets.includes(m)} onClick={() => toggle("markets", m)}>{t(`market_${m}` as const)}</ChipButton>)}</div></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("languagesTarget")}><div className="flex gap-2">{(["ar", "en"] as Language[]).map((l) => <ChipButton key={l} type="button" selected={f.languages.includes(l)} onClick={() => toggle("languages", l)}>{t(`lang_${l}` as const)}</ChipButton>)}</div></Field>
          <div className="grid gap-2 self-end text-[14px]">
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--leaf)]" checked={f.paid} onChange={(e) => set("paid", e.target.checked)} />{t("isPaid")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--leaf)]" checked={f.drop} onChange={(e) => set("drop", e.target.checked)} />{t("surpriseDrop")}</label>
          </div>
        </div>
        <Field label={t("niche")} hint={t("all")}><div className="flex flex-wrap gap-2">{NICHES.map((n) => <ChipButton key={n} type="button" selected={f.niches.includes(n)} onClick={() => toggle("niches", n)}>{t(`niche_${n}` as const)}</ChipButton>)}</div></Field>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t("cancel")}</Button><Button disabled={!valid} onClick={save}>{t("save")}</Button></div>
      </div>
    </Sheet>
  );
}
