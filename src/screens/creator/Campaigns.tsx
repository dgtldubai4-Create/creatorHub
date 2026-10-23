import { useState } from "react";
import { Link } from "react-router-dom";
import { Path } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, EmptyState, PageHeader, Segmented } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { campaignById, participationsFor } from "../../domain/selectors";
import { BrandMark, KitList, Points, StageChip, useCurrentCreator } from "../shared/bits";

type F = "active" | "done" | "declined";

export function CreatorCampaigns() {
  const t = useT();
  const L = useL();
  const { relative } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const [f, setF] = useState<F>("active");
  const all = participationsFor(s, me.id).filter((p) => p.stage !== "invited");
  const list = all.filter((p) => (f === "active" ? p.stage !== "completed" && p.stage !== "declined" : f === "done" ? p.stage === "completed" : p.stage === "declined"));
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("campaigns")} sub={t("campaignsSub")} actions={<Segmented value={f} onChange={setF} options={[{ value: "active", label: t("active") }, { value: "done", label: t("done") }, { value: "declined", label: t("declined") }]} />} />
      {list.length === 0 ? (
        <EmptyState icon={<Path size={24} weight="duotone" />} title={t("noCampaigns")} body={t("noCampaignsBody")} action={<Button variant="secondary" to="/creator/invitations">{t("invitations")}</Button>} />
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const c = campaignById(s, p.campaignId)!;
            const b = s.brands.find((x) => x.id === c.brandId)!;
            const last = p.stageLog[p.stageLog.length - 1];
            return (
              <Item key={p.id}>
                <Link to={`/creator/campaigns/${p.id}`} className="label-card lift flex h-full flex-col gap-4 p-5 ">
                  <div className="flex items-center justify-between gap-3">
                    <BrandMark brand={b} size="sm" />
                    <Points value={c.points} />
                  </div>
                  <h2 className="text-xl">{L(c.title)}</h2>
                  <KitList campaign={c} compact />
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3"><PhaseTrail stage={p.stage} /><StageChip stage={p.stage} /></div>
                    <span className="text-[12px] text-ink-3">{relative(last.at)}</span>
                  </div>
                </Link>
              </Item>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
