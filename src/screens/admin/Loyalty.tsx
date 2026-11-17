import { Coins, Gift, LinkSimple, HourglassMedium, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Button, Chip, EmptyState, PageHeader, Section, SimulatedTag } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { campaignQuote, clawbacks, expiryWatch, pointsQueue, postsDueForCheck } from "../../domain/selectors";
import { postLiveCheck } from "../../domain/simulate";
import { BrandMark } from "../shared/bits";
import { can } from "../../domain/permissions";
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
  const due = postsDueForCheck(s);
  const watch = expiryWatch(s);
  const returned = clawbacks(s);
  const canReview = can(s.session.role, "review");
  const canLoyalty = can(s.session.role, "loyalty");
  const runLinks = () => {
    // Same deterministic check the reducer runs, so the toast can say what it found.
    const gone = due.filter((d) => !postLiveCheck(d.url, s.now).live).length;
    dispatch({ type: "recheckPosts" });
    toast(t("linkCheckDone", { n: due.length, gone }), gone ? "info" : "success");
  };
  const runExpiry = () => {
    dispatch({ type: "expireSparks" });
    toast(t("expiryDone"), "success");
  };
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("loyalty")} sub={t("loyaltySub")} />
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={`${t("releaseQueue")} · ${release.length}`}>
          {release.length === 0 ? <EmptyState icon={<Coins size={22} />} title={t("nothingHere")} /> : (
            <Stagger className="grid gap-2">
              {release.map((p) => {
                const cr = s.creators.find((x) => x.id === p.creatorId)!;
                const c = s.campaigns.find((x) => x.id === p.campaignId)!;
                return (
                  <Item key={p.id}>
                    <div className="label-card flex flex-wrap items-center gap-3 p-3 pe-4">
                      <Avatar name={cr.name} hue={cr.hue} size={38} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-medium">{cr.name}</div><div className="flex items-center gap-2 text-[12.5px] text-ink-3"><BrandMark brand={s.brands.find((b) => b.id === c.brandId)!} size="sm" />{L(c.title)}</div></div>
                      <Button size="sm" variant="accent" onClick={() => { dispatch({ type: "releasePoints", participationId: p.id }); celebrate(); toast(t("released", { n: num(campaignQuote(c, cr, p.publish?.platform).total) }), "success"); }} icon={<Coins size={15} weight="bold" />}>{t("releasePoints")} · {num(campaignQuote(c, cr, p.publish?.platform).total)}</Button>
                    </div>
                  </Item>
                );
              })}
            </Stagger>
          )}
        </Section>
        <Section title={`${t("fulfilQueue")} · ${fulfil.length}`}>
          {fulfil.length === 0 ? <EmptyState icon={<Gift size={22} />} title={t("nothingHere")} /> : (
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
      <Section title={t("housekeeping")} sub={t("housekeepingSub")} action={<SimulatedTag />}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="label-card flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-line bg-surface-2 text-on"><LinkSimple size={22} weight="bold" /></span><div className="min-w-0 flex-1"><div className="font-semibold">{t("linkCheck")}</div><div className="text-[13px] text-ink-2">{t("linkCheckSub", { n: due.length })}</div></div></div>
            {due.length > 0 && (
              <ul className="max-h-48 divide-y divide-line overflow-y-auto rounded-[12px] border border-line" data-lenis-prevent>
                {due.map((d) => { const cr = s.creators.find((x) => x.id === d.creatorId); return <li key={d.id} className="flex items-center gap-2 px-3 py-2 text-[13px]">{cr && <Avatar name={cr.name} hue={cr.hue} size={24} />}<span className="min-w-0 flex-1 truncate"><span className="font-medium">{cr?.name.split(" ")[0]}</span> · {L(d.title)}</span><span className="shrink-0 text-ink-3">{relative(d.approvedAt)}</span><span className="shrink-0 font-semibold tabular">{num(d.amount)}</span></li>; })}
              </ul>
            )}
            <Button size="sm" className="self-start" disabled={due.length === 0 || !canReview} onClick={runLinks} icon={<LinkSimple size={15} weight="bold" />}>{t("runLinkCheck")}</Button>
            {returned.length > 0 && (
              <div>
                <div className="meta mb-2 flex items-center gap-1.5"><ArrowCounterClockwise size={13} weight="bold" />{t("clawbackLog")}</div>
                <ul className="grid gap-1.5">{returned.slice(0, 5).map((l) => { const cr = s.creators.find((x) => x.id === l.creatorId); return <li key={l.id} className="flex items-center gap-2 text-[13px]">{cr && <Avatar name={cr.name} hue={cr.hue} size={22} />}<span className="min-w-0 flex-1 truncate">{cr?.name} · {L(l.reason)}</span><span className="shrink-0 font-semibold tabular text-rose">{num(l.delta)}</span></li>; })}</ul>
              </div>
            )}
          </div>
          <div className="label-card flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-line bg-accent-soft text-on"><HourglassMedium size={22} weight="bold" /></span><div className="min-w-0 flex-1"><div className="font-semibold">{t("expiryJob")}</div><div className="text-[13px] text-ink-2">{t("expiryJobSub", { n: watch.length })}</div></div></div>
            {watch.length > 0 && (
              <ul className="divide-y divide-line rounded-[12px] border border-line">
                {watch.map(({ creator, expiry }) => <li key={creator.id} className="flex items-center gap-2 px-3 py-2 text-[13px]"><Avatar name={creator.name} hue={creator.hue} size={24} /><span className="min-w-0 flex-1 truncate font-medium">{creator.name}</span><Chip tone={expiry.expired ? "rose" : "lemon"} className="h-6 text-[11.5px]">{expiry.expired ? t("expiredLabel") : t("daysLeftN", { n: expiry.daysLeft ?? 0 })}</Chip><span className="shrink-0 font-semibold tabular">{num(expiry.balance)}</span></li>)}
              </ul>
            )}
            <Button size="sm" className="self-start" disabled={watch.length === 0 || !canLoyalty} onClick={runExpiry} icon={<HourglassMedium size={15} weight="bold" />}>{t("runExpiry")}</Button>
          </div>
        </div>
      </Section>

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
