import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, ChipButton, IconButton, Input, PageHeader, Select, Sheet } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { balance, completedFor, matchScore, participationsFor, standing } from "../../domain/selectors";
import { StageChip, VerificationChip } from "../shared/bits";
import type { Niche, VerificationState } from "../../domain/types";
import { cn } from "../../ui/cn";

const NICHES: Niche[] = ["haircare", "beauty", "family", "wellness", "food", "fitness", "lifestyle", "oralcare", "comedy"];

export function AdminCreators() {
  const t = useT();
  const L = useL();
  const { num, date } = useFormat();
  const s = useStore();
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState<Niche | "all">("all");
  const [scoreFor, setScoreFor] = useState<string>(s.campaigns.find((c) => c.status === "inviting" || c.status === "draft")?.id ?? s.campaigns[0].id);
  const campaign = s.campaigns.find((c) => c.id === scoreFor)!;
  const list = useMemo(
    () => s.creators.filter((c) => (niche === "all" || c.niche === niche) && `${c.name} ${c.handle} ${c.city}`.toLowerCase().includes(q.toLowerCase())).map((cr) => ({ cr, m: matchScore(s, cr, campaign) })).sort((a, b) => b.m.score - a.m.score),
    [s, q, niche, campaign],
  );
  const open = s.creators.find((c) => c.id === id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("creators")} sub={t("creatorsSub")} actions={<label className="flex items-center gap-2 text-[13px] text-ink-2">{t("scoreFor")}<Select value={scoreFor} onChange={(e) => setScoreFor(e.target.value)} className="w-56 py-2">{s.campaigns.map((c) => <option key={c.id} value={c.id}>{L(c.title)}</option>)}</Select></label>} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative me-2 w-full max-w-xs">
          <MagnifyingGlass size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-10 py-2" />
        </div>
        <ChipButton selected={niche === "all"} onClick={() => setNiche("all")}>{t("all")}</ChipButton>
        {NICHES.map((n) => <ChipButton key={n} selected={niche === n} onClick={() => setNiche(n)}>{t(`niche_${n}` as const)}</ChipButton>)}
      </div>
      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" gap={0.02}>
        {list.map(({ cr, m }) => {
          const st = standing(s, cr.id);
          return (
            <Item key={cr.id}>
              <button onClick={() => nav(`/admin/creators/${cr.id}`)} className="card press flex w-full items-center gap-3 p-4 text-start hover:border-ink-3">
                <Avatar name={cr.name} hue={cr.hue} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-[15px] font-medium">{cr.name}</span>{Object.values(cr.verification).every((v) => v === "verified") && <Chip tone="leaf" className="h-5 px-1.5 text-[10.5px]">{t("vs_verified")}</Chip>}</div>
                  <div className="truncate text-[12.5px] text-ink-3">{t(`niche_${cr.niche}` as const)} · {t(`tier_${cr.tier}` as const)} · {cr.city}</div>
                  <div className="mt-1 text-[12px] text-ink-2">{t(`st_${st.tier}` as const)} · {num(cr.followers)} {t("followers")}</div>
                </div>
                <div className="text-end"><div className={cn("text-xl font-semibold tabular leading-none", m.score >= 70 ? "text-leaf" : m.score >= 40 ? "text-marigold-ink" : "text-ink-3")}>{m.score}</div><div className="text-[11px] text-ink-3">{t("match")}</div></div>
              </button>
            </Item>
          );
        })}
      </Stagger>

      <Sheet open={!!open} onClose={() => nav("/admin/creators")} wide title={open ? open.name : ""}>
        {open && (
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={open.name} hue={open.hue} size={64} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] text-ink-3">@{open.handle} · {open.city}, {t(`market_${open.market}` as const)} · {num(open.followers)} {t("followers")}</div>
                <p className="mt-1 text-[14px] text-ink-2">{L(open.bio)}</p>
              </div>
              <div className="text-end"><div className="text-2xl font-semibold tabular">{num(balance(s, open.id))}</div><div className="text-[12px] text-ink-3">{t("balance")}</div></div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><h3 className="text-[14px] font-semibold">{t("verification")}</h3><span className="text-[12px] text-ink-3">{t("setVerification")}</span></div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["identity", "instagram", "tiktok"] as const).map((k) => (
                  <div key={k} className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
                    <VerificationChip state={open.verification[k]} label={t(`ver_${k}` as const)} />
                    <Select value={open.verification[k]} onChange={(e) => dispatch({ type: "verifyCreator", creatorId: open.id, field: k, state: e.target.value as VerificationState })} className="py-1.5 text-[13px]">
                      {(["pending", "verified", "action"] as const).map((v) => <option key={v} value={v}>{t(`vs_${v}` as const)}</option>)}
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[14px] font-semibold">{t("scoreFor")} {L(campaign.title)}</h3>
              <div className="flex flex-wrap gap-1.5">{matchScore(s, open, campaign).reasons.map((r) => <Chip key={r.key} tone={r.ok ? "leaf" : "neutral"} className={cn(!r.ok && "line-through opacity-60")}>{t(`m_${r.key}` as const)} +{r.weight}</Chip>)}</div>
            </div>
            <div>
              <h3 className="mb-2 text-[14px] font-semibold">{t("history")} · {completedFor(s, open.id).length} {t("done").toLowerCase()}</h3>
              <ul className="grid gap-1.5">
                {participationsFor(s, open.id).map((p) => {
                  const c = s.campaigns.find((x) => x.id === p.campaignId)!;
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 text-[13.5px]">
                      <Link to={`/admin/campaigns/${c.id}`} className="font-medium hover:underline">{L(c.title)}</Link>
                      <PhaseTrail stage={p.stage} size="sm" />
                      <StageChip stage={p.stage} />
                      <span className="ms-auto text-[12px] text-ink-3">{date(p.invitedAt)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-end"><IconButton label={t("close")} onClick={() => nav("/admin/creators")} className="hidden"><X /></IconButton><Button variant="secondary" onClick={() => nav("/admin/creators")}>{t("close")}</Button></div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
