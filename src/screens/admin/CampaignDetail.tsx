import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PencilSimple, PaperPlaneTilt, SealCheck, Coins, Flag } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, EmptyState, PageHeader, Section, Segmented } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { campaignFunnel, campaignParticipations, matchScore } from "../../domain/selectors";
import { can } from "../../domain/permissions";
import { BrandMark, CampaignStatusChip, KitList, Points, StageChip } from "../shared/bits";
import { CampaignEditor } from "./CampaignEditor";
import { cn } from "../../ui/cn";
import type { CampaignStatus } from "../../domain/types";

const NEXT: Record<CampaignStatus, CampaignStatus | null> = { draft: "inviting", inviting: "active", active: "review", review: "publishing", publishing: "completed", completed: null };

export function AdminCampaignDetail() {
  const t = useT();
  const L = useL();
  const { date, num } = useFormat();
  const s = useStore();
  const { id } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const role = s.session.role;
  const c = s.campaigns.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"participants" | "shortlist">("participants");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const ps = c ? campaignParticipations(s, c.id) : [];
  const onCampaign = new Set(ps.map((p) => p.creatorId));
  const ranked = useMemo(() => (c ? s.creators.map((cr) => ({ cr, m: matchScore(s, cr, c) })).sort((a, b) => b.m.score - a.m.score) : []), [s, c]);
  if (!c) return <EmptyState title={t("notFound")} action={<Button variant="secondary" to="/admin/campaigns">{t("campaigns")}</Button>} />;
  const b = s.brands.find((x) => x.id === c.brandId)!;
  const fn = campaignFunnel(s, c.id);

  const invite = () => {
    const ids = [...picked];
    dispatch({ type: "invite", campaignId: c.id, creatorIds: ids });
    toast(t("invited", { n: ids.length }), "success");
    celebrate();
    setPicked(new Set());
    setView("participants");
  };

  return (
    <div className="flex flex-col gap-8">
      <Link to="/admin/campaigns" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("campaigns")}</Link>
      <PageHeader
        eyebrow={<div className="flex items-center gap-2"><BrandMark brand={b} /><CampaignStatusChip status={c.status} /></div>}
        title={L(c.title)}
        sub={L(c.hook)}
        actions={
          <>
            <Points value={c.points} className="me-2 text-lg" />
            {NEXT[c.status] && <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "setCampaignStatus", campaignId: c.id, status: NEXT[c.status]! })} icon={<Flag size={15} weight="bold" />}>{t("advanceStatus")}: {t(`cs_${NEXT[c.status]!}` as const)}</Button>}
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} icon={<PencilSimple size={15} weight="bold" />}>{t("editCampaign")}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="label-card p-5 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[14px] font-semibold">{t("deliverable")}</h3>
              <p className="mt-1 text-[14px] text-ink-2">{L(c.brief.deliverable)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip>{date(c.window.start)} - {date(c.window.end)}</Chip>
                <Chip>{c.brief.durationSec.min}-{c.brief.durationSec.max} {t("seconds")}</Chip>
                {c.targetNiches.map((n) => <Chip key={n} tone="leaf">{t(`niche_${n}` as const)}</Chip>)}
                {c.targetMarkets.map((n) => <Chip key={n}>{t(`market_${n}` as const)}</Chip>)}
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold">{t("kit")}</h3>
              <div className="mt-2"><KitList campaign={c} /></div>
            </div>
          </div>
        </div>
        <div className="label-card p-5">
          <h3 className="text-[14px] font-semibold">{t("funnel")}</h3>
          <ul className="mt-3 grid gap-1.5">
            {(["invite", "kit", "create", "review", "publish", "done"] as const).map((ph) => (
              <li key={ph} className="flex items-center gap-3 text-[13.5px]">
                <span className="w-16 text-ink-2">{t(`phase_${ph}` as const)}</span>
                <span className="h-2 rounded-full bg-leaf" style={{ width: `${(fn.counts[ph] / Math.max(1, fn.total)) * 100}%`, minWidth: fn.counts[ph] ? 8 : 0 }} />
                <span className="tabular text-ink-3">{fn.counts[ph]}</span>
              </li>
            ))}
            {fn.counts.declined > 0 && <li className="text-[12.5px] text-ink-3">{t("declined")}: {fn.counts.declined}</li>}
          </ul>
        </div>
      </div>

      <Section
        title={view === "participants" ? t("participants") : t("shortlist")}
        sub={view === "shortlist" ? t("shortlistSub") : undefined}
        action={
          <div className="flex items-center gap-2">
            {view === "shortlist" && picked.size > 0 && can(role, "invite") && <Button size="sm" onClick={invite} icon={<PaperPlaneTilt size={15} weight="bold" />}>{t("inviteSelected", { n: picked.size })}</Button>}
            {can(role, "invite") && <Segmented value={view} onChange={setView} options={[{ value: "participants", label: `${t("participants")} (${ps.length})` }, { value: "shortlist", label: t("shortlist") }]} />}
          </div>
        }
      >
        {view === "participants" ? (
          ps.length === 0 ? (
            <EmptyState title={t("nothingHere")} action={can(role, "invite") && <Button variant="secondary" onClick={() => setView("shortlist")}>{t("shortlist")}</Button>} />
          ) : (
            <Stagger className="grid gap-2">
              {ps.map((p) => {
                const cr = s.creators.find((x) => x.id === p.creatorId)!;
                const last = p.stageLog[p.stageLog.length - 1];
                return (
                  <Item key={p.id}>
                    <div className="label-card flex flex-wrap items-center gap-4 p-3 pe-4">
                      <Link to={`/admin/creators/${cr.id}`} className="flex items-center gap-3 hover:underline"><Avatar name={cr.name} hue={cr.hue} size={38} /><div><div className="text-[14px] font-medium">{cr.name}</div><div className="text-[12px] text-ink-3">@{cr.handle} · {cr.city}</div></div></Link>
                      <div className="flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                      <span className="text-[12px] text-ink-3">{date(last.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <div className="ms-auto flex items-center gap-2">
                        {p.stage === "manual_review" && can(role, "review") && <Button size="sm" variant="secondary" to={`/admin/review/${p.id}/${p.submissions.at(-1)?.id}`}>{t("review")}</Button>}
                        {p.stage === "link_submitted" && can(role, "review") && <Button size="sm" onClick={() => { dispatch({ type: "verifyPost", participationId: p.id }); toast(t("verified"), "success"); }} icon={<SealCheck size={15} weight="bold" />}>{t("verifyPost")}</Button>}
                        {p.stage === "post_verified" && can(role, "loyalty") && <Button size="sm" variant="accent" onClick={() => { dispatch({ type: "releasePoints", participationId: p.id }); celebrate(); toast(t("released", { n: num(c.points) }), "success"); }} icon={<Coins size={15} weight="bold" />}>{t("releasePoints")}</Button>}
                        {p.stage === "points_released" && <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "complete", participationId: p.id })}>{t("markComplete")}</Button>}
                        {p.publish && <a href={p.publish.url} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-leaf hover:underline">{p.publish.platform}</a>}
                      </div>
                    </div>
                  </Item>
                );
              })}
            </Stagger>
          )
        ) : (
          <Stagger className="grid gap-2" gap={0.02}>
            {ranked.map(({ cr, m }) => {
              const on = onCampaign.has(cr.id);
              const sel = picked.has(cr.id);
              return (
                <Item key={cr.id}>
                  <label className={cn("label-card flex cursor-pointer flex-wrap items-center gap-4 p-3 pe-4", sel && "border-leaf bg-leaf-soft/30", on && "opacity-60")}>
                    <input type="checkbox" className="h-5 w-5 accent-[var(--leaf)]" disabled={on} checked={sel} onChange={() => setPicked((set) => { const n = new Set(set); if (n.has(cr.id)) n.delete(cr.id); else n.add(cr.id); return n; })} />
                    <Avatar name={cr.name} hue={cr.hue} size={38} />
                    <div className="min-w-40"><div className="text-[14px] font-medium">{cr.name}</div><div className="text-[12px] text-ink-3">{t(`niche_${cr.niche}` as const)} · {t(`tier_${cr.tier}` as const)} · {cr.city}</div></div>
                    <div className="flex flex-wrap gap-1">{m.reasons.filter((r) => r.ok).map((r) => <Chip key={r.key} tone="leaf" className="h-6 text-[11.5px]">{t(`m_${r.key}` as const)}</Chip>)}</div>
                    <div className="ms-auto flex items-center gap-3">
                      {on && <Chip>{t("alreadyOn")}</Chip>}
                      <div className="text-end"><div className="text-lg font-semibold tabular leading-none">{m.score}</div><div className="text-[11px] text-ink-3">{t("match")}</div></div>
                    </div>
                  </label>
                </Item>
              );
            })}
          </Stagger>
        )}
      </Section>
      <CampaignEditor open={editing} onClose={() => setEditing(false)} campaign={c} />
    </div>
  );
}
