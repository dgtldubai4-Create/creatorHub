import { useState } from "react";
import { Ticket, Star, Rocket, Package } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, PageHeader, Section, Segmented, Sheet } from "../../ui/primitives";
import { Counter, Item, Stagger, Tilt, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { balance, lifetimeSparks, level } from "../../domain/selectors";
import { BrandMark, useCurrentCreator } from "../shared/bits";
import { Label, MembershipCard } from "../../ui/kit";
import type { Reward } from "../../domain/types";
import { cn } from "../../ui/cn";

type K = "all" | Reward["kind"];
const ICON: Record<Reward["kind"], React.ReactNode> = { product: <Package size={18} weight="duotone" />, experience: <Star size={18} weight="duotone" />, voucher: <Ticket size={18} weight="duotone" />, boost: <Rocket size={18} weight="duotone" /> };

export function Rewards() {
  const t = useT();
  const L = useL();
  const { num, relative, date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const [k, setK] = useState<K>("all");
  const [confirm, setConfirm] = useState<Reward | null>(null);
  const bal = balance(s, me.id);
  const life = lifetimeSparks(s, me.id);
  const lv = level(s, me.id);
  const list = s.rewards.filter((r) => k === "all" || r.kind === k);
  const mine = s.redemptions.filter((r) => r.creatorId === me.id).reverse();
  const ledger = s.ledger.filter((l) => l.creatorId === me.id).slice().reverse();

  const redeem = () => {
    if (!confirm) return;
    dispatch({ type: "redeem", creatorId: me.id, rewardId: confirm.id });
    if (bal >= confirm.cost && confirm.stock > 0) {
      celebrate();
      toast(`${t("redeemed")}: ${L(confirm.title)}`, "success");
    }
    setConfirm(null);
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("rewards")} sub={t("rewardsSub")} />
      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-5"><MembershipCard id={me.id} name={me.name} handle={me.handle} level={lv.level} since={date(me.joinedAt, { month: "short", year: "numeric" })} sparks={bal} /></div>
        <Label className="flex flex-col justify-center gap-2 p-6 lg:col-span-7" watermark={false}>
          <div className="meta">{t("balance")}</div>
          <div className="text-5xl font-semibold tabular leading-none"><Counter value={bal} format={num} /> <span className="text-lg font-medium text-ink-3">{t("sparks")}</span></div>
          <div className="mt-2 text-[13.5px] text-ink-2">{t("lifetime")}: {num(life)} · {t(`lv_${lv.level}` as const)}{lv.next && lv.next !== "ambassador" ? ` · ${t("toNextLevel", { n: num(lv.toNext), level: t(`lv_${lv.next}` as const) })}` : ""}</div>
        </Label>
      </div>

      <Section action={<Segmented value={k} onChange={setK} options={[{ value: "all", label: t("all") }, { value: "product", label: t("rk_product") }, { value: "experience", label: t("rk_experience") }, { value: "voucher", label: t("rk_voucher") }, { value: "boost", label: t("rk_boost") }]} />}>
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" gap={0.04}>
          {list.map((r) => {
            const b = s.brands.find((x) => x.id === r.brandId);
            const can = bal >= r.cost && r.stock > 0;
            return (
              <Item key={r.id}>
                <Tilt max={3} className="h-full rounded-[10px]">
                  <Label as="article" brandId={r.brandId} watermark={!!r.brandId} className={cn("lift flex h-full flex-col gap-3 p-5", r.stock <= 0 && "opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-surface-2 text-ink-2">{ICON[r.kind]}</span>
                      {b ? <BrandMark brand={b} size="sm" /> : <Chip>{t(`rk_${r.kind}` as const)}</Chip>}
                    </div>
                    <h3 className="text-lg">{L(r.title)}</h3>
                    <p className="text-[14px] text-ink-2">{L(r.description)}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex flex-col items-center rounded-[8px] bg-marigold px-2.5 py-1.5 leading-none text-marigold-ink"><span className="text-[15px] font-semibold tabular">{num(r.cost)}</span><span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] opacity-80">{t("sparks")}</span></span>
                        <div className="text-[12px] text-ink-3">{r.stock > 0 ? `${r.stock} ${t("left")}` : t("outOfStock")}</div>
                      </div>
                      <Button size="sm" variant={can ? "primary" : "secondary"} disabled={r.stock <= 0} onClick={() => setConfirm(r)}>{can ? t("redeem") : r.stock <= 0 ? t("outOfStock") : t("needMore", { n: num(r.cost - bal) })}</Button>
                    </div>
                  </Label>
                </Tilt>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t("myRedemptions")}>
          {mine.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
            <ul className="label-card divide-y divide-line">
              {mine.map((rd) => {
                const r = s.rewards.find((x) => x.id === rd.rewardId);
                return (
                  <li key={rd.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0"><div className="truncate text-[14px] font-medium">{r ? L(r.title) : rd.rewardId}</div><div className="text-[12px] text-ink-3">{relative(rd.at)}</div></div>
                    <Chip tone={rd.status === "fulfilled" ? "leaf" : "marigold"}>{t(`rd_${rd.status}` as const)}</Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
        <Section title={t("ledger")}>
          <ul className="label-card max-h-80 divide-y divide-line overflow-y-auto" data-lenis-prevent>
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><div className="truncate text-[14px] font-medium">{L(l.reason)}</div><div className="text-[12px] text-ink-3">{relative(l.at)}</div></div>
                <span className={cn("shrink-0 font-semibold tabular", l.delta < 0 ? "text-rose" : "text-leaf")}>{l.delta > 0 ? "+" : ""}{num(l.delta)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? L(confirm.title) : ""}>
        {confirm && (
          <>
            <p className="text-[14.5px] text-ink-2">{t("redeemConfirm", { reward: L(confirm.title), cost: num(confirm.cost) })}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)}>{t("cancel")}</Button>
              <Button onClick={redeem}>{t("redeem")}</Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
