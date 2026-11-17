import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lightning, FilmSlate, UsersThree, ChartLineUp, Stack, LinkSimple, HourglassMedium, Package, Handshake } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useT } from "../../i18n";
import { Button, Chip, ChipButton, Field, Input, PageHeader, Section, Segmented, Sheet } from "../../ui/primitives";
import { Item, Reveal, Stagger } from "../../ui/motion";
import { audienceFor } from "../../domain/selectors";
import { ENGAGEMENT_BANDS, EXPIRY_DAYS, FORMATS, FORMAT_MULT, LIVE_DAYS, MULTI_BRAND_MULT, REACH_BANDS, bandFor, quoteSparks } from "../../domain/policy";
import type { PostFormat } from "../../domain/types";
import { CharterList, ExpiryNote, LevelKitShelf, QuoteBreakdown } from "../shared/program";
import { useCurrentCreator } from "../shared/bits";
import { cn } from "../../ui/cn";

function Row({ label, mult, mine, note }: { label: string; mult: number; mine?: boolean; note?: string }) {
  const t = useT();
  return (
    <li className={cn("flex items-center justify-between gap-3 px-4 py-2.5", mine && "accent-fill")}>
      <span className="min-w-0"><span className="text-[14.5px] font-medium">{label}</span>{note && <span className="block text-[12px] font-medium opacity-70">{note}</span>}</span>
      <span className="flex shrink-0 items-center gap-2">{mine && <span className="meta !text-on/70">{t("thatsYou")}</span>}<span className="text-lg font-semibold tabular" dir="ltr">×{mult}</span></span>
    </li>
  );
}

function Table({ title, icon, tone, children }: { title: string; icon: React.ReactNode; tone: string; children: React.ReactNode }) {
  return (
    <div className="label-card h-full overflow-hidden">
      <div className={cn("flex items-center gap-2 border-b border-line px-4 py-3 text-on", tone)}>{icon}<h3 className="text-lg font-semibold">{title}</h3></div>
      <ul className="divide-y divide-line">{children}</ul>
    </div>
  );
}

export function SparksPage() {
  const t = useT();
  const { num } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const mine = audienceFor(me, "instagram");
  const [base, setBase] = useState(180);
  const [format, setFormat] = useState<PostFormat>("video");
  const [followers, setFollowers] = useState(String(mine.followers));
  const [rate, setRate] = useState(String(mine.engagementRate));
  const [multi, setMulti] = useState(false);
  const [drop, setDrop] = useState(false);
  const [charter, setCharter] = useState(false);
  const quote = quoteSparks({ base, format, followers: Number(followers) || 0, engagementRate: Number(rate) || 0, brandCount: multi ? 2 : 1, double: drop });
  const myReach = bandFor(REACH_BANDS, mine.followers);
  const myEng = bandFor(ENGAGEMENT_BANDS, mine.engagementRate);
  const bases = Array.from(new Set(s.missions.filter((m) => m.status === "live").map((m) => m.sparks))).sort((a, b) => a - b).slice(0, 7);

  return (
    <div className="flex flex-col gap-10">
      <Link to="/creator/rewards" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />{t("rewards")}</Link>
      <PageHeader title={t("sparksHow")} sub={t("sparksHowSub")} actions={<Chip tone="lime" icon={<Lightning size={14} weight="fill" />}>{t("neverBelow")}</Chip>} />

      <Reveal inView={false}>
        <div className="inverse-fill rounded-[1.75rem] p-6 md:p-8">
          <div className="meta !text-on/60">{t("yourEstimate")}</div>
          <div className="mt-2 text-2xl font-semibold md:text-4xl">{t("sparksFormula")}</div>
          <p className="mt-3 text-[14.5px] text-on/75">{t("estimateHint", { followers: num(mine.followers), rate: mine.engagementRate })} {t("roundNote")}</p>
        </div>
      </Reveal>

      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Item>
          <Table title={t("sp_format")} icon={<FilmSlate size={20} weight="fill" />} tone="bg-surface-2">
            {FORMATS.map((f) => <Row key={f} label={t(`fmt_${f}` as const)} mult={FORMAT_MULT[f]} note={f === "story" ? t("fmtStoryNote") : undefined} />)}
          </Table>
        </Item>
        <Item>
          <Table title={t("sp_reach")} icon={<UsersThree size={20} weight="fill" />} tone="bg-accent-soft">
            {REACH_BANDS.map((b, i) => <Row key={b.min} label={i === 0 ? t("reachFloor", { n: num(REACH_BANDS[1].min) }) : t("reachBand", { n: num(b.min) })} mult={b.mult} mine={b === myReach} />)}
          </Table>
        </Item>
        <Item>
          <Table title={t("sp_engagement")} icon={<ChartLineUp size={20} weight="fill" />} tone="bg-surface-2">
            {ENGAGEMENT_BANDS.map((b, i) => <Row key={b.min} label={i === 0 ? t("engFloor", { n: ENGAGEMENT_BANDS[1].min }) : t("engBand", { n: b.min })} mult={b.mult} mine={b === myEng} />)}
          </Table>
        </Item>
        <Item>
          <Table title={t("sp_brands")} icon={<Stack size={20} weight="fill" />} tone="bg-surface-2">
            <Row label={t("brandsOne")} mult={1} />
            <Row label={t("brandsMulti")} mult={MULTI_BRAND_MULT} />
            <Row label={t("sp_double")} mult={2} />
            <li className="px-4 py-2.5 text-[12.5px] font-medium text-ink-2">{t("flatNote")}</li>
          </Table>
        </Item>
      </Stagger>

      <Section title={t("calcTitle")}>
        <div className="label-card grid gap-6 p-5 lg:grid-cols-2">
          <div className="grid gap-4">
            <Field label={t("calcBase")}><div className="flex flex-wrap gap-2">{bases.map((b) => <ChipButton key={b} type="button" selected={base === b} onClick={() => setBase(b)}>{num(b)}</ChipButton>)}</div></Field>
            <Field label={t("postFormat")}><Segmented value={format} onChange={setFormat} options={FORMATS.map((f) => ({ value: f, label: t(`fmt_${f}` as const) }))} className="max-w-full flex-wrap" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("calcFollowers")}><Input inputMode="numeric" value={followers} onChange={(e) => setFollowers(e.target.value.replace(/\D/g, ""))} dir="ltr" /></Field>
              <Field label={t("calcEngagement")}><Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} dir="ltr" /></Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <ChipButton type="button" selected={multi} onClick={() => setMulti(!multi)}>{t("brandsMulti")}</ChipButton>
              <ChipButton type="button" selected={drop} onClick={() => setDrop(!drop)}>{t("sp_double")}</ChipButton>
              <Button size="sm" variant="ghost" onClick={() => { setFollowers(String(mine.followers)); setRate(String(mine.engagementRate)); }}>{t("calcMine")}</Button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-[18px] border border-line bg-surface-2 p-5">
            <div className="text-6xl font-semibold tabular md:text-7xl" dir="ltr">+{num(quote.total)}</div>
            <QuoteBreakdown quote={quote} />
          </div>
        </div>
      </Section>

      <Section title={t("rulesTitle")}>
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: LinkSimple, tone: "bg-surface-2", title: t("ruleLive"), body: t("ruleLiveBody"), tag: `${LIVE_DAYS}` },
            { icon: HourglassMedium, tone: "bg-surface-2", title: t("ruleExpiry"), body: t("ruleExpiryBody"), tag: `${EXPIRY_DAYS}` },
            { icon: Package, tone: "bg-surface-2", title: t("ruleKits"), body: t("ruleKitsBody"), tag: "3" },
            { icon: Handshake, tone: "bg-surface-2", title: t("ruleCharter"), body: t("ruleCharterBody"), tag: "6" },
          ].map((r) => (
            <Item key={r.title}>
              <div className="label-card h-full p-5">
                <div className="flex items-start justify-between"><r.icon size={24} className="text-ink-2" /><span className="text-3xl font-medium tabular tracking-tight text-ink-3" dir="ltr">{r.tag}</span></div>
                <h3 className="mt-6 text-lg">{r.title}</h3>
                <p className="mt-2 text-[14px] text-ink-2">{r.body}</p>
              </div>
            </Item>
          ))}
        </Stagger>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ExpiryNote creatorId={me.id} />
          <Button size="sm" variant="secondary" onClick={() => setCharter(true)}>{t("viewCharter")}</Button>
        </div>
      </Section>

      <Section title={t("levelKits")} sub={t("levelKitsSub")}>
        <LevelKitShelf creatorId={me.id} />
      </Section>

      <Sheet open={charter} onClose={() => setCharter(false)} title={t("charterTitle")}>
        <p className="mb-4 text-[14px] text-ink-2">{t("charterSub")}</p>
        <CharterList />
      </Sheet>
    </div>
  );
}
