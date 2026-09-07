import { useState } from "react";
import { FloppyDisk } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useT } from "../../i18n";
import { Avatar, Button, Chip, Field, Input, PageHeader, Section, SimulatedTag, Textarea } from "../../ui/primitives";
import { useToast } from "../../ui/toast";
import { VerificationChip, useCurrentCreator } from "../shared/bits";
import { useFormat } from "../../i18n";

export function Profile() {
  const t = useT();
  const { num } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const [f, setF] = useState({ line1: me.address.line1, phone: me.address.phone, city: me.city, instagram: me.socials.instagram ?? "", tiktok: me.socials.tiktok ?? "", bio: me.bio.en });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    dispatch({ type: "updateProfile", creatorId: me.id, patch: { city: f.city, address: { ...me.address, line1: f.line1, phone: f.phone, city: f.city }, socials: { instagram: f.instagram || undefined, tiktok: f.tiktok || undefined }, bio: { en: f.bio, ar: me.bio.ar === me.bio.en ? f.bio : me.bio.ar } } });
    toast(t("saved"), "success");
  };
  const lang = s.lang;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("profile")} sub={t("profileSub")} />
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={me.name} hue={me.hue} size={64} />
        <div className="min-w-0 flex-1">
          <div className="text-xl font-semibold">{me.name}</div>
          <div className="text-[13.5px] text-ink-3">@{me.handle} · {me.city}, {t(`market_${me.market}` as const)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="leaf">{t(`niche_${me.niche}` as const)}</Chip>
          <Chip>{t(`tier_${me.tier}` as const)} · {num(me.followers)} {t("followers")}</Chip>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title={t("verification")} sub={t("verificationHint")} action={<SimulatedTag />}>
          <div className="card flex flex-wrap gap-2 p-5">
            <VerificationChip state={me.verification.identity} label={t("ver_identity")} />
            <VerificationChip state={me.verification.instagram} label={t("ver_instagram")} />
            <VerificationChip state={me.verification.tiktok} label={t("ver_tiktok")} />
          </div>
        </Section>
        <Section title={t("socials")}>
          <div className="card grid gap-4 p-5">
            <Field label={t("instagramHandle")}><Input value={f.instagram} onChange={(e) => set("instagram")(e.target.value)} /></Field>
            <Field label={t("tiktokHandle")}><Input value={f.tiktok} onChange={(e) => set("tiktok")(e.target.value)} /></Field>
          </div>
        </Section>
        <Section title={t("address")}>
          <div className="card grid gap-4 p-5">
            <Field label={t("addressLine")} required><Input value={f.line1} onChange={(e) => set("line1")(e.target.value)} autoComplete="street-address" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("city")} required><Input value={f.city} onChange={(e) => set("city")(e.target.value)} /></Field>
              <Field label={t("phone")} required><Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} inputMode="tel" autoComplete="tel" /></Field>
            </div>
          </div>
        </Section>
        <Section title={t("bio")}>
          <div className="card p-5">
            <Field label={lang === "ar" ? "English" : t("bio")}><Textarea value={f.bio} onChange={(e) => set("bio")(e.target.value)} maxLength={140} /></Field>
          </div>
        </Section>
      </div>
      <div className="flex justify-end"><Button onClick={save} icon={<FloppyDisk size={16} weight="bold" />}>{t("save")}</Button></div>
    </div>
  );
}
