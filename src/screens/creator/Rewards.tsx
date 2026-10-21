import { useState } from "react";
import { Gift, Ticket, Star, Rocket, Package } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, PageHeader, Section, Segmented, Sheet } from "../../ui/primitives";
import { Counter, Item, Stagger, Tilt, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { balance, lifetimeSparks, level } from "../../domain/selectors";
import { BrandMark, LevelEmblem, useCurrentCreator } from "../shared/bits";
import type { Reward } from "../../domain/types";
import { cn } from "../../ui/cn";

type K = "all" | Reward["kind"];
const ICON: Record<Reward["kind"], React.ReactNode> = { product: <Package size={18} weight="duotone" />, experience: <Star size={18} weight="duotone" />, voucher: <Ticket size={18} weight="duotone" />, boost: <Rocket size={18} weight="duotone" /> };

export function Rewards() {
  const t = useT();
  const L = useL();
  const { num, relative } = useFormat();
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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-soft flex items-center gap-5 bg-leaf p-6 text-white md:col-span-2">
          <Gift size={40} weight="duotone" />
          <div>
            <div className="text-[13px] opacity-80">{t("balance")}</div>
            <div className="text-4xl font-semibold leading-none"><Counter value={bal} format={num} /> <span className="text-lg opacity-80">{t("pts")}</span></div>
            <div className="mt-2 text-[13px] opacity-80">{t("lifetime")}: {num(life)}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <LevelEmblem level={lv.level} size={64} />
          <div>
            <div className="text-[13px] text-ink-3">{t("level")}</div>
            <div className="text-lg font-semibold">{t(`lv_${lv.level}` as const)}</div>
            <div className="text-[12.5px] text-ink-3">{lv.next && lv.next !== "ambassador" ? t("toNextLevel", { n: num(lv.toNext), level: t(`lv_${lv.next}` as const) }) : lv.next === "ambassador" ? t("ambassadorsSelected") : t("topLevel")}</div>
          </div>
        </div>
      </div>

      <Section action={<Segmented value={k} onChange={setK} options={[{ value: "all", label: t("all") }, { value: "product", label: t("rk_product") }, { value: "experience", label: t("rk_experience") }, { value: "voucher", label: t("rk_voucher") }, { value: "boost", label: t("rk_boost") }]} />}>
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" gap={0.04}>
          {list.map((r) => {
            const b = s.brands.find((x) => x.id === r.brandId);
            const can = bal >= r.cost && r.stock > 0;
            return (
              <Item key={r.id}>
                <Tilt max={4} className="h-full rounded-[var(--radius-card)]">
                  <article className={cn("card flex h-full flex-col gap-3 p-5", r.stock <= 0 && "opacity-60")}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", r.kind === "product" ? "bg-leaf-soft text-leaf" : r.kind === "experience" ? "bg-marigold-soft text-marigold-ink" : r.kind === "voucher" ? "bg-sky/12 text-sky" : "bg-rose-soft text-rose")}>{ICON[r.kind]}</span>
                      {b ? <BrandMark brand={b} size="sm" /> : <Chip>{t(`rk_${r.kind}` as const)}</Chip>}
                    </div>
                    <h3 className="text-lg">{L(r.title)}</h3>
                    <p className="text-[14px] text-ink-2">{L(r.description)}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div>
                        <div className="text-lg font-semibold tabular">{num(r.cost)} <span className="text-[12px] font-normal text-ink-3">{t("pts")}</span></div>
                        <div className="text-[12px] text-ink-3">{r.stock > 0 ? `${r.stock} ${t("left")}` : t("outOfStock")}</div>
                      </div>
                      <Button size="sm" variant={can ? "primary" : "secondary"} disabled={r.stock <= 0} onClick={() => setConfirm(r)}>{can ? t("redeem") : r.stock <= 0 ? t("outOfStock") : t("needMore", { n: num(r.cost - bal) })}</Button>
                    </div>
                  </article>
                </Tilt>
              </Item>
            );
          })}
        </Stagger>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t("myRedemptions")}>
          {mine.length === 0 ? <p className="text-[14px] text-ink-3">{t("nothingHere")}</p> : (
            <ul className="card divide-y divide-line">
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
          <ul className="card max-h-80 divide-y divide-line overflow-y-auto" data-lenis-prevent>
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
