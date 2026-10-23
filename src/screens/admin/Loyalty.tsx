import { Coins, Gift } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, EmptyState, PageHeader, Section } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { pointsQueue } from "../../domain/selectors";
import { BrandMark } from "../shared/bits";
import { cn } from "../../ui/cn";

export function AdminLoyalty() {
  const t = useT();
  const L = useL();
  const { num, relative } = useFormat();
  const s = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const release = pointsQueue(s);
  const fulfil = s.redemptions.filter((r) => r.status === "requested");
  const ledger = s.ledger.slice().reverse().slice(0, 60);
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("loyalty")} sub={t("loyaltySub")} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={`${t("releaseQueue")} · ${release.length}`}>
          {release.length === 0 ? <EmptyState icon={<Coins size={22} weight="duotone" />} title={t("nothingHere")} /> : (
            <Stagger className="grid gap-2">
              {release.map((p) => {
                const cr = s.creators.find((x) => x.id === p.creatorId)!;
                const c = s.campaigns.find((x) => x.id === p.campaignId)!;
                return (
                  <Item key={p.id}>
                    <div className="label-card flex flex-wrap items-center gap-3 p-3 pe-4">
                      <Avatar name={cr.name} hue={cr.hue} size={38} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{cr.name}</div><div className="flex items-center gap-2 text-[12.5px] text-ink-3"><BrandMark brand={s.brands.find((b) => b.id === c.brandId)!} size="sm" />{L(c.title)}</div></div>
                      <Button size="sm" variant="accent" onClick={() => { dispatch({ type: "releasePoints", participationId: p.id }); celebrate(); toast(t("released", { n: num(c.points) }), "success"); }} icon={<Coins size={15} weight="bold" />}>{t("releasePoints")} · {num(c.points)}</Button>
                    </div>
                  </Item>
                );
              })}
            </Stagger>
          )}
        </Section>
        <Section title={`${t("fulfilQueue")} · ${fulfil.length}`}>
          {fulfil.length === 0 ? <EmptyState icon={<Gift size={22} weight="duotone" />} title={t("nothingHere")} /> : (
            <Stagger className="grid gap-2">
              {fulfil.map((rd) => {
                const cr = s.creators.find((x) => x.id === rd.creatorId)!;
                const r = s.rewards.find((x) => x.id === rd.rewardId);
                return (
                  <Item key={rd.id}>
                    <div className="label-card flex flex-wrap items-center gap-3 p-3 pe-4">
                      <Avatar name={cr.name} hue={cr.hue} size={38} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{r ? L(r.title) : rd.rewardId}</div><div className="text-[12.5px] text-ink-3">{cr.name} · {num(rd.cost)} {t("pts")} · {relative(rd.at)}</div></div>
                      <Button size="sm" variant="secondary" onClick={() => { dispatch({ type: "fulfilRedemption", redemptionId: rd.id }); toast(t("fulfilled"), "success"); }}>{t("fulfil")}</Button>
                    </div>
                  </Item>
                );
              })}
            </Stagger>
          )}
        </Section>
      </div>
      <Section title={t("fullLedger")}>
        <div className="label-card overflow-hidden">
          <div className="max-h-[32rem] overflow-y-auto" data-lenis-prevent>
            <table className="w-full text-[13.5px]">
              <thead className="sticky top-0 bg-surface-2 text-start text-[12px] text-ink-2">
                <tr><th className="px-4 py-2 text-start font-medium">{t("creators")}</th><th className="px-4 py-2 text-start font-medium">{t("ledger")}</th><th className="px-4 py-2 text-start font-medium">{t("today")}</th><th className="px-4 py-2 text-end font-medium">{t("points")}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledger.map((l) => {
                  const cr = s.creators.find((x) => x.id === l.creatorId);
                  return (
                    <tr key={l.id}>
                      <td className="px-4 py-2"><span className="flex items-center gap-2">{cr && <Avatar name={cr.name} hue={cr.hue} size={22} />}{cr?.name ?? l.creatorId}</span></td>
                      <td className="px-4 py-2"><span className="flex items-center gap-2">{L(l.reason)}<Chip className="h-5 px-1.5 text-[10.5px]">{l.ref.kind}</Chip></span></td>
                      <td className="px-4 py-2 text-ink-3">{relative(l.at)}</td>
                      <td className={cn("px-4 py-2 text-end font-semibold tabular", l.delta < 0 ? "text-rose" : "text-leaf")}>{l.delta > 0 ? "+" : ""}{num(l.delta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}
