import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Megaphone } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, PageHeader, Segmented, EmptyState, ProgressRing } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { campaignFunnel } from "../../domain/selectors";
import { BrandMark, CampaignStatusChip, KitList, Points } from "../shared/bits";
import type { CampaignStatus } from "../../domain/types";
import { CampaignEditor } from "./CampaignEditor";

type F = "all" | "live" | "draft" | "completed";

export function AdminCampaigns() {
  const t = useT();
  const L = useL();
  const { date, num } = useFormat();
  const s = useStore();
  const [f, setF] = useState<F>("live");
  const [creating, setCreating] = useState(false);
  const live: CampaignStatus[] = ["inviting", "active", "review", "publishing"];
  const list = s.campaigns.filter((c) => (f === "all" ? true : f === "live" ? live.includes(c.status) : c.status === f)).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("campaigns")}
        actions={
          <>
            <Segmented value={f} onChange={setF} options={[{ value: "live", label: t("active") }, { value: "draft", label: t("cs_draft") }, { value: "completed", label: t("cs_completed") }, { value: "all", label: t("all") }]} />
            <Button onClick={() => setCreating(true)} icon={<Plus size={16} weight="bold" />}>{t("newCampaign")}</Button>
          </>
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={<Megaphone size={24} weight="duotone" />} title={t("nothingHere")} action={<Button onClick={() => setCreating(true)}>{t("newCampaign")}</Button>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const b = s.brands.find((x) => x.id === c.brandId)!;
            const fn = campaignFunnel(s, c.id);
            return (
              <Item key={c.id}>
                <Link to={`/admin/campaigns/${c.id}`} className="card press flex h-full flex-col gap-4 p-5 hover:border-ink-3">
                  <div className="flex items-center justify-between gap-3"><BrandMark brand={b} size="sm" /><CampaignStatusChip status={c.status} /></div>
                  <h2 className="text-xl">{L(c.title)}</h2>
                  <KitList campaign={c} compact />
                  <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <ProgressRing value={fn.progress} size={40} stroke={5}><span className="text-[10px] font-bold tabular">{fn.total}</span></ProgressRing>
                      <div className="text-[12.5px] text-ink-3">{num(fn.counts.done)} {t("done").toLowerCase()} · {date(c.window.start)} - {date(c.window.end)}</div>
                    </div>
                    <Points value={c.points} />
                  </div>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      )}
      <CampaignEditor open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
