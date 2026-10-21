import { useState } from "react";
import { FloppyDisk, InstagramLogo, TiktokLogo, IdentificationCard, SealCheck } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useT } from "../../i18n";
import { Avatar, Button, Chip, ChipButton, Field, Input, PageHeader, Section, SimulatedTag, Textarea } from "../../ui/primitives";
import { useToast } from "../../ui/toast";
import { LevelChip, VerificationChip, useCurrentCreator } from "../shared/bits";
import { level } from "../../domain/selectors";
import type { Language } from "../../domain/types";

export function Profile() {
  const t = useT();
  const { num, date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const lv = level(s, me.id);
  const [f, setF] = useState({ line1: me.address.line1, phone: me.address.phone, city: me.city, bio: me.bio.en, vibe: me.vibe.en, languages: me.languages, posts: me.favouritePosts.join("\n"), licence: me.licence.number ?? "" });
  const [connect, setConnect] = useState<{ instagram: string; tiktok: string }>({ instagram: "", tiktok: "" });
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggleLang = (l: Language) => set("languages")(f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l]);
  const save = () => {
    dispatch({ type: "updateProfile", creatorId: me.id, patch: { city: f.city, address: { ...me.address, line1: f.line1, phone: f.phone, city: f.city }, bio: { en: f.bio, ar: me.bio.ar === me.bio.en ? f.bio : me.bio.ar }, vibe: { en: f.vibe, ar: me.vibe.ar === me.vibe.en ? f.vibe : me.vibe.ar }, languages: f.languages.length ? f.languages : me.languages, favouritePosts: f.posts.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3) } });
    toast(t("saved"), "success");
  };
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("profile")} sub={t("profileSub")} />
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={me.name} hue={me.hue} size={64} />
        <div className="min-w-0 flex-1">
          <div className="text-xl font-semibold">{me.name}</div>
          <div className="text-[13.5px] text-ink-3">@{me.handle} · {me.city}, {t(`market_${me.market}` as const)} · {me.email}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LevelChip level={lv.level} />
          <Chip tone="leaf">{t(`niche_${me.niche}` as const)}</Chip>
          <Chip>{t(`tier_${me.tier}` as const)} · {num(me.followers)} {t("followers")}</Chip>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t("verification")} sub={t("verificationHint")} action={<SimulatedTag />}>
          <div className="card flex flex-col gap-4 p-5">
            <div className="flex flex-wrap gap-2">
              <VerificationChip state={me.verification.identity} label={t("ver_identity")} />
              <VerificationChip state={me.verification.instagram} label={t("ver_instagram")} />
              <VerificationChip state={me.verification.tiktok} label={t("ver_tiktok")} />
              <Chip tone={me.mobileVerified ? "leaf" : "rose"} icon={<SealCheck size={14} weight="fill" />}>{t("mobileVerified")}</Chip>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <div className="flex items-center gap-2 text-[14px] font-semibold"><IdentificationCard size={18} className="text-leaf" />{t("licence")}</div>
              <p className="mt-1 text-[12.5px] text-ink-3">{t("licenceHint")}</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1"><Field label={t("licenceNumber")}><Input value={f.licence} onChange={(e) => set("licence")(e.target.value)} placeholder="UAE-ADV-123456" /></Field></div>
                <VerificationChip state={me.licence.state} label={t("licence")} />
                <Button size="sm" variant="secondary" disabled={!f.licence.trim() || f.licence === me.licence.number} onClick={() => { dispatch({ type: "setLicence", creatorId: me.id, number: f.licence }); toast(t("saved"), "success"); }}>{t("submitLicence")}</Button>
              </div>
            </div>
          </div>
        </Section>
        <Section title={t("connectedAccounts")} sub={t("connectHint")} action={<SimulatedTag />}>
          <div className="card grid gap-3 p-5">
            {(["instagram", "tiktok"] as const).map((pl) => {
              const acc = me.connected[pl];
              const Icon = pl === "instagram" ? InstagramLogo : TiktokLogo;
              return (
                <div key={pl} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-3">
                  <Icon size={22} weight="duotone" className="text-ink-2" />
                  {acc ? (
                    <div className="min-w-0 flex-1 text-[13.5px]"><div className="font-medium">{t("connectedAs", { handle: acc.handle })}</div><div className="text-[12px] text-ink-3">{num(acc.followers)} {t("followers")} · {acc.engagementRate}% {t("engagement")} · {date(acc.connectedAt)}</div></div>
                  ) : (
                    <>
                      <Input value={connect[pl]} onChange={(e) => setConnect((c) => ({ ...c, [pl]: e.target.value }))} placeholder="@handle" className="min-w-0 flex-1 py-1.5" />
                      <Button size="sm" variant="secondary" disabled={connect[pl].trim().length < 2} onClick={() => { dispatch({ type: "connectSocial", creatorId: me.id, platform: pl, handle: connect[pl] }); setConnect((c) => ({ ...c, [pl]: "" })); }}>{pl === "instagram" ? t("connectInstagram") : t("connectTiktok")}</Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
        <Section title={t("address")}>
          <div className="card grid gap-4 p-5">
            <Field label={t("addressLine")} required><Input value={f.line1} onChange={(e) => set("line1")(e.target.value)} autoComplete="street-address" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("city")} required><Input value={f.city} onChange={(e) => set("city")(e.target.value)} /></Field>
              <Field label={t("phone")} required><Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} inputMode="tel" autoComplete="tel" dir="ltr" /></Field>
            </div>
          </div>
        </Section>
        <Section title={t("vibe")}>
          <div className="card grid gap-4 p-5">
            <Field label={t("vibe")}><Input value={f.vibe} onChange={(e) => set("vibe")(e.target.value)} maxLength={80} /></Field>
            <Field label={t("bio")}><Textarea value={f.bio} onChange={(e) => set("bio")(e.target.value)} maxLength={140} className="min-h-16" /></Field>
            <Field label={t("languages")}><div className="flex gap-2">{(["ar", "en"] as Language[]).map((l) => <ChipButton key={l} type="button" selected={f.languages.includes(l)} onClick={() => toggleLang(l)}>{t(`lang_${l}` as const)}</ChipButton>)}</div></Field>
            <Field label={t("favouritePosts")} hint={t("favouritePostsHint")}><Textarea value={f.posts} onChange={(e) => set("posts")(e.target.value)} className="min-h-16" dir="ltr" /></Field>
          </div>
        </Section>
      </div>
      <div className="flex justify-end"><Button onClick={save} icon={<FloppyDisk size={16} weight="bold" />}>{t("save")}</Button></div>
    </div>
  );
}
