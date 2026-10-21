import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Leaf, InstagramLogo, TiktokLogo, ShieldWarning, Translate } from "@phosphor-icons/react";
import { useDispatch } from "../../app/store";
import { useFormat, useT, useToggleLang } from "../../i18n";
import { Button, Field, Input, Select, Textarea, ChipButton, Chip, SimulatedTag } from "../../ui/primitives";
import { spring, useCelebrate } from "../../ui/motion";
import { ArtSlot } from "../../ui/ArtSlot";
import { Logo } from "../../app/shell";
import { connectAccount, otpFor } from "../../domain/simulate";
import type { ConnectedAccount, FollowerTier, Language, Market, Niche } from "../../domain/types";
import { cn } from "../../ui/cn";

const NICHES: Niche[] = ["haircare", "beauty", "family", "wellness", "food", "fitness", "lifestyle", "oralcare", "comedy"];
const TIERS: FollowerTier[] = ["nano", "micro", "macro", "mega"];
const MARKETS: Market[] = ["UAE", "KSA", "Kuwait", "Qatar", "Oman", "Bahrain"];

export function Join() {
  const t = useT();
  const { num } = useFormat();
  const dispatch = useDispatch();
  const nav = useNavigate();
  const toggle = useToggleLang();
  const celebrate = useCelebrate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const [f, setF] = useState({ name: "", handle: "", email: "", mobile: "", market: "UAE" as Market, city: "", age: false, consent: false, code: "", verified: false, instagram: "", tiktok: "", niche: "haircare" as Niche, tier: "micro" as FollowerTier, languages: ["ar", "en"] as Language[], vibe: "", bio: "", posts: "", referral: "" });
  const [connected, setConnected] = useState<Partial<Record<"instagram" | "tiktok", ConnectedAccount>>>({});
  const [codeSent, setCodeSent] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const otp = otpFor(f.mobile);

  const errors = {
    name: f.name.trim().length < 2 ? t("required") : "",
    handle: f.handle.trim().length < 2 ? t("required") : "",
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? t("required") : "",
    mobile: !/^\+?(971|966|965|974|968|973)[\d\s]{7,}$/.test(f.mobile.replace(/[^\d+]/g, "").length > 0 ? f.mobile : "") ? t("mobile") : "",
    city: f.city.trim().length < 2 ? t("required") : "",
    age: !f.age ? t("required") : "",
    verified: !f.verified ? t("enterCode") : "",
    connect: !connected.instagram && !connected.tiktok ? t("required") : "",
    vibe: f.vibe.trim().length < 4 ? t("required") : "",
    consent: !f.consent ? t("required") : "",
  };
  const stepValid = [!errors.name && !errors.handle && !errors.email && !errors.mobile && !errors.city && !errors.age, !errors.verified, !errors.connect, !errors.vibe && !errors.consent][step];
  const steps = [t("joinStep1"), t("joinStep2"), t("joinStep3"), t("joinStep4")];

  const connect = (pl: "instagram" | "tiktok") => {
    const h = f[pl].trim();
    if (h.length < 2) return;
    setConnected((c) => ({ ...c, [pl]: connectAccount(pl, h, new Date().toISOString()) }));
  };

  const next = () => {
    setTouched(true);
    if (!stepValid) return;
    if (step < 3) {
      setStep(step + 1);
      setTouched(false);
      return;
    }
    const followers = Math.max(connected.instagram?.followers ?? 0, connected.tiktok?.followers ?? 0);
    dispatch({
      type: "registerCreator",
      input: {
        name: f.name.trim(), handle: f.handle.trim(), email: f.email.trim(), mobile: f.mobile.trim(), market: f.market, city: f.city.trim(), niche: f.niche, tier: f.tier, followers,
        languages: f.languages, vibe: f.vibe.trim(), favouritePosts: f.posts.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3),
        socials: { instagram: connected.instagram?.handle, tiktok: connected.tiktok?.handle }, bio: f.bio.trim() || f.vibe.trim(), referralCode: f.referral.trim() || undefined,
      },
    });
    setDone(true);
    celebrate({ x: 0.5, y: 0.4 });
  };

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <Link to="/"><Logo /></Link>
        <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={15} weight="bold" />{t("language")}</button>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="card grid overflow-hidden md:grid-cols-2">
              <div className="h-56 md:h-full"><ArtSlot id="join-welcome" /></div>
              <div className="flex flex-col items-start gap-4 p-8">
                <span className="leaf-shape flex h-14 w-14 items-center justify-center bg-leaf text-white"><Leaf size={26} weight="fill" /></span>
                <h1 className="text-3xl">{t("joinDone")}</h1>
                <p className="text-ink-2">{t("joinDoneBody")}</p>
                <Button size="lg" className="mt-2" onClick={() => nav("/creator")}>{t("goToHome")}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl">{t("joinTitle")}</h1>
                <p className="mt-3 text-ink-2">{t("joinSub")}</p>
                <div className="mt-5 flex flex-wrap gap-2"><Chip tone="leaf">{t("noMinimum")}</Chip><Chip>{t("sixMarkets")}</Chip><Chip>{t("twoLanguages")}</Chip></div>
                <p className="mt-4 text-[13px] text-ink-3">{t("eligibility")}</p>
                <div className="mt-6 flex items-start gap-2 rounded-2xl bg-marigold-soft p-4 text-[13px] text-marigold-ink"><ShieldWarning size={18} weight="fill" className="mt-0.5 shrink-0" />{t("scamWarning")}</div>
                <ol className="mt-8 grid gap-2">
                  {steps.map((label, i) => (
                    <li key={label} className="flex items-center gap-3">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold", i < step ? "bg-leaf text-white" : i === step ? "bg-ink text-canvas" : "bg-surface-2 text-ink-3")}>{i < step ? <Check size={14} weight="bold" /> : i + 1}</span>
                      <span className={cn("text-[14px] font-medium", i === step ? "text-ink" : "text-ink-3")}>{label}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="card p-6 md:p-8 lg:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={spring} className="grid gap-5">
                    {step === 0 && (
                      <>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label={t("fullName")} required error={touched ? errors.name : ""}><Input value={f.name} onChange={(e) => set("name")(e.target.value)} autoFocus autoComplete="name" /></Field>
                          <Field label={t("handle")} required error={touched ? errors.handle : ""}><Input value={f.handle} onChange={(e) => set("handle")(e.target.value)} placeholder="@yourname" /></Field>
                          <Field label={t("email")} required error={touched ? errors.email : ""}><Input type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" dir="ltr" /></Field>
                          <Field label={t("mobile")} required error={touched ? errors.mobile : ""}><Input inputMode="tel" value={f.mobile} onChange={(e) => { set("mobile")(e.target.value); set("verified")(false); setCodeSent(false); }} placeholder="+971 50 123 4567" dir="ltr" /></Field>
                          <Field label={t("market")} required><Select value={f.market} onChange={(e) => set("market")(e.target.value as Market)}>{MARKETS.map((m) => <option key={m} value={m}>{t(`market_${m}` as const)}</option>)}</Select></Field>
                          <Field label={t("city")} required error={touched ? errors.city : ""}><Input value={f.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" /></Field>
                        </div>
                        <label className="flex items-start gap-2 text-[14px]"><input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--leaf)]" checked={f.age} onChange={(e) => set("age")(e.target.checked)} />{t("ageConfirm")}{touched && errors.age && <span className="text-rose"> · {errors.age}</span>}</label>
                      </>
                    )}
                    {step === 1 && (
                      <>
                        <div className="flex items-center justify-between"><p className="text-[14.5px] text-ink-2">{f.mobile}</p><SimulatedTag /></div>
                        {!codeSent ? (
                          <Button onClick={() => setCodeSent(true)}>{t("sendCode")}</Button>
                        ) : (
                          <>
                            <p className="rounded-xl bg-surface-2 p-3 text-[13px] text-ink-2">{t("codeHint", { code: otp })}</p>
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="w-40"><Field label={t("enterCode")} error={touched ? errors.verified : ""}><Input inputMode="numeric" maxLength={4} value={f.code} onChange={(e) => set("code")(e.target.value.replace(/\D/g, ""))} className="text-center text-xl tracking-[0.4em]" dir="ltr" /></Field></div>
                              {f.verified ? <Chip tone="leaf" icon={<Check size={13} weight="bold" />}>{t("mobileVerified")}</Chip> : <Button variant="secondary" onClick={() => { if (f.code === otp) set("verified")(true); else setTouched(true); }}>{t("verifyCode")}</Button>}
                            </div>
                            {touched && !f.verified && f.code.length === 4 && <p className="text-[13px] text-rose">{t("wrongCode")}</p>}
                          </>
                        )}
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <div className="flex items-center justify-between"><p className="text-[14.5px] text-ink-2">{t("connectHint")}</p><SimulatedTag /></div>
                        {(["instagram", "tiktok"] as const).map((pl) => {
                          const Icon = pl === "instagram" ? InstagramLogo : TiktokLogo;
                          const acc = connected[pl];
                          return (
                            <div key={pl} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-3">
                              <Icon size={24} weight="duotone" />
                              {acc ? (
                                <div className="min-w-0 flex-1 text-[13.5px]"><div className="font-medium">{t("connectedAs", { handle: acc.handle })}</div><div className="text-[12px] text-ink-3">{num(acc.followers)} {t("followers")} · {acc.engagementRate}% {t("engagement")}</div></div>
                              ) : (
                                <>
                                  <Input value={f[pl]} onChange={(e) => set(pl)(e.target.value)} placeholder="@handle" className="min-w-0 flex-1 py-1.5" dir="ltr" />
                                  <Button size="sm" variant="secondary" disabled={f[pl].trim().length < 2} onClick={() => connect(pl)}>{pl === "instagram" ? t("connectInstagram") : t("connectTiktok")}</Button>
                                </>
                              )}
                              {acc && <Button size="sm" variant="ghost" onClick={() => setConnected((c) => ({ ...c, [pl]: undefined }))}>{t("disconnect")}</Button>}
                            </div>
                          );
                        })}
                        {touched && errors.connect && <p className="text-[13px] text-rose">{errors.connect}</p>}
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <Field label={t("vibe")} required error={touched ? errors.vibe : ""}><Input value={f.vibe} onChange={(e) => set("vibe")(e.target.value)} maxLength={80} autoFocus placeholder={t("nba_rest_body")} /></Field>
                        <Field label={t("niche")} required><div className="flex flex-wrap gap-2">{NICHES.map((n) => <ChipButton key={n} type="button" selected={f.niche === n} onClick={() => set("niche")(n)}>{t(`niche_${n}` as const)}</ChipButton>)}</div></Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label={t("tier")}><div className="flex flex-wrap gap-2">{TIERS.map((n) => <ChipButton key={n} type="button" selected={f.tier === n} onClick={() => set("tier")(n)}>{t(`tier_${n}` as const)}</ChipButton>)}</div></Field>
                          <Field label={t("languages")}><div className="flex gap-2">{(["ar", "en"] as Language[]).map((l) => <ChipButton key={l} type="button" selected={f.languages.includes(l)} onClick={() => set("languages")(f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l])}>{t(`lang_${l}` as const)}</ChipButton>)}</div></Field>
                        </div>
                        <Field label={t("favouritePosts")} hint={t("favouritePostsHint")}><Textarea value={f.posts} onChange={(e) => set("posts")(e.target.value)} className="min-h-16" dir="ltr" /></Field>
                        <Field label={t("referralCode")}><Input value={f.referral} onChange={(e) => set("referral")(e.target.value)} placeholder="@creator" /></Field>
                        <label className="flex items-start gap-2 text-[14px]"><input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--leaf)]" checked={f.consent} onChange={(e) => set("consent")(e.target.checked)} />{t("consent")}{touched && errors.consent && <span className="text-rose"> · {errors.consent}</span>}</label>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-8 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => { setStep(Math.max(0, step - 1)); setTouched(false); }} disabled={step === 0} icon={<ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />}>{t("back")}</Button>
                  <Button onClick={next} iconEnd={<ArrowRight size={16} weight="bold" className="rtl:rotate-180" />}>{step === 3 ? t("submitApplication") : t("continue")}</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
