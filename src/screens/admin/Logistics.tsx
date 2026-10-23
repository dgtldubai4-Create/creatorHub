import { Truck, Package } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, EmptyState, PageHeader, SimulatedTag } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { logisticsQueue } from "../../domain/selectors";
import { SHIPMENT_ORDER, nextShipmentStatus } from "../../domain/simulate";
import { BrandMark } from "../shared/bits";
import { cn } from "../../ui/cn";

export function AdminLogistics() {
  const t = useT();
  const L = useL();
  const { relative } = useFormat();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const queue = logisticsQueue(s);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("logistics")} sub={t("logisticsSub")} eyebrow={<SimulatedTag />} />
      {queue.length === 0 ? (
        <EmptyState icon={<Package size={24} weight="duotone" />} title={t("deliveredAll")} body={t("deliveredAllBody")} />
      ) : (
        <Stagger className="grid gap-3">
          {queue.map((p) => {
            const cr = s.creators.find((x) => x.id === p.creatorId)!;
            const c = s.campaigns.find((x) => x.id === p.campaignId)!;
            const sh = p.shipment!;
            const idx = SHIPMENT_ORDER.indexOf(sh.status);
            const next = nextShipmentStatus(sh.status)!;
            return (
              <Item key={p.id}>
                <div className="label-card grid gap-4 p-4 md:grid-cols-12 md:items-center">
                  <div className="flex items-center gap-3 md:col-span-4">
                    <Avatar name={cr.name} hue={cr.hue} size={40} />
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-medium">{cr.name}</div>
                      <div className="truncate text-[12.5px] text-ink-3">{cr.address.line1}, {cr.address.city} · <span dir="ltr">{cr.address.phone}</span></div>
                      <div className="mt-1 flex items-center gap-2"><BrandMark brand={s.brands.find((b) => b.id === c.brandId)!} size="sm" /><span className="text-[12.5px] text-ink-2">{L(c.title)}</span></div>
                    </div>
                  </div>
                  <div className="md:col-span-5">
                    <div className="flex items-center gap-1.5">
                      {SHIPMENT_ORDER.map((st, i) => <span key={st} className={cn("h-2 flex-1 rounded-full", i < idx ? "bg-leaf" : i === idx ? "bg-marigold" : "bg-line-2")} title={t(`sh_${st}` as const)} />)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
                      <Chip tone="marigold">{t(`sh_${sh.status}` as const)}</Chip>
                      <span>{sh.courier} · <span className="tabular">{sh.trackingNumber}</span> · {relative(sh.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="md:col-span-3 md:text-end">
                    <Button size="sm" onClick={() => { dispatch({ type: "advanceShipment", participationId: p.id }); toast(t("shipped", { status: t(`sh_${next}` as const) }), "success"); }} icon={<Truck size={15} weight="bold" />}>{t("advance")}: {t(`sh_${next}` as const)}</Button>
                  </div>
                </div>
              </Item>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
