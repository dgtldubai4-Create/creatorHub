import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Leaf } from "@phosphor-icons/react";
import { useDispatch } from "../../app/store";
import { useT, useToggleLang } from "../../i18n";
import { Button, Field, Input, Select, Textarea, ChipButton } from "../../ui/primitives";
import { spring, useCelebrate } from "../../ui/motion";
import { Logo } from "../../app/shell";
import type { FollowerTier, Market, Niche } from "../../domain/types";
import { Translate } from "@phosphor-icons/react";
import { cn } from "../../ui/cn";

const NICHES: Niche[] = ["haircare", "beauty", "family", "wellness", "food", "fitness", "lifestyle", "oralcare", "comedy"];
const TIERS: FollowerTier[] = ["nano", "micro", "macro", "mega"];

export function Join() {
  const t = useT();
  const dispatch = useDispatch();
  const nav = useNavigate();
  const toggle = useToggleLang();
  const celebrate = useCelebrate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ name: "", handle: "", market: "UAE" as Market, city: "", niche: "haircare" as Niche, tier: "micro" as FollowerTier, followers: "", bio: "", instagram: "", tiktok: "" });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const errors = {
    name: f.name.trim().length < 2 ? t("required") : "",
    handle: f.handle.trim().length < 2 ? t("required") : "",
    city: f.city.trim().length < 2 ? t("required") : "",
    followers: !/^\d+$/.test(f.followers.trim()) ? t("required") : "",
    bio: f.bio.trim().length < 4 ? t("required") : "",
    socials: !f.instagram.trim() && !f.tiktok.trim() ? t("required") : "",
  };
  const stepValid = [!errors.name && !errors.handle && !errors.city, !errors.followers && !errors.bio, !errors.socials][step];
  const steps = [t("joinStep1"), t("joinStep2"), t("joinStep3")];

  const next = () => {
    setTouched(true);
    if (!stepValid) return;
    if (step < 2) {
      setStep(step + 1);
      setTouched(false);
      return;
    }
    dispatch({ type: "registerCreator", input: { name: f.name.trim(), handle: f.handle.trim(), market: f.market, city: f.city.trim(), niche: f.niche, tier: f.tier, followers: Number(f.followers), socials: { instagram: f.instagram.trim() || undefined, tiktok: f.tiktok.trim() || undefined }, bio: f.bio.trim() } });
    setDone(true);
    celebrate({ x: 0.5, y: 0.4 });
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <header className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <Link to="/"><Logo /></Link>
        <button onClick={toggle} className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"><Translate size={15} weight="bold" />{t("language")}</button>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 md:px-6 md:pt-14">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="card flex flex-col items-center gap-4 p-10 text-center">
              <span className="leaf-shape flex h-16 w-16 items-center justify-center bg-leaf text-white"><Leaf size={30} weight="fill" /></span>
              <h1 className="text-3xl">{t("joinDone")}</h1>
              <p className="max-w-[44ch] text-ink-2">{t("joinDoneBody")}</p>
              <Button size="lg" className="mt-2" onClick={() => nav("/creator")}>{t("goToHome")}</Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
              <h1 className="text-4xl md:text-5xl">{t("joinTitle")}</h1>
              <p className="mt-3 max-w-[50ch] text-ink-2">{t("joinSub")}</p>
              <ol className="mt-8 flex items-center gap-2">
                {steps.map((label, i) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors", i < step ? "bg-leaf text-white" : i === step ? "bg-ink text-bg" : "bg-surface-2 text-ink-3")}>{i < step ? <Check size={14} weight="bold" /> : i + 1}</span>
                    <span className={cn("text-[13.5px] font-medium", i === step ? "text-ink" : "text-ink-3", i !== step && "hidden sm:inline")}>{label}</span>
                    {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line-2" />}
                  </li>
                ))}
              </ol>
              <div className="card mt-6 p-6 md:p-8">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={spring} className="grid gap-5">
                    {step === 0 && (
                      <>
                        <Field label={t("fullName")} required error={touched ? errors.name : ""}><Input value={f.name} onChange={(e) => set("name")(e.target.value)} autoFocus autoComplete="name" /></Field>
                        <Field label={t("handle")} required error={touched ? errors.handle : ""} hint="@"><Input value={f.handle} onChange={(e) => set("handle")(e.target.value)} placeholder="@yourname" /></Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label={t("market")} required>
                            <Select value={f.market} onChange={(e) => set("market")(e.target.value)}>
                              <option value="UAE">{t("market_UAE")}</option>
                              <option value="KSA">{t("market_KSA")}</option>
                            </Select>
                          </Field>
                          <Field label={t("city")} required error={touched ? errors.city : ""}><Input value={f.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" /></Field>
                        </div>
                      </>
                    )}
                    {step === 1 && (
                      <>
                        <Field label={t("niche")} required>
                          <div className="flex flex-wrap gap-2">
                            {NICHES.map((n) => <ChipButton key={n} type="button" selected={f.niche === n} onClick={() => set("niche")(n)}>{t(`niche_${n}` as const)}</ChipButton>)}
                          </div>
                        </Field>
                        <Field label={t("tier")} required>
                          <div className="flex flex-wrap gap-2">
                            {TIERS.map((n) => <ChipButton key={n} type="button" selected={f.tier === n} onClick={() => set("tier")(n)}>{t(`tier_${n}` as const)}</ChipButton>)}
                          </div>
                        </Field>
                        <Field label={t("followersCount")} required error={touched ? errors.followers : ""}><Input inputMode="numeric" value={f.followers} onChange={(e) => set("followers")(e.target.value.replace(/\D/g, ""))} placeholder="12000" /></Field>
                        <Field label={t("bio")} required error={touched ? errors.bio : ""}><Textarea value={f.bio} onChange={(e) => set("bio")(e.target.value)} maxLength={140} /></Field>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <Field label={t("instagramHandle")} hint={t("optional")} error={touched ? errors.socials : ""}><Input value={f.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="yourname" /></Field>
                        <Field label={t("tiktokHandle")} hint={t("optional")}><Input value={f.tiktok} onChange={(e) => set("tiktok")(e.target.value)} placeholder="yourname" /></Field>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-8 flex items-center justify-between">
                  <Button variant="ghost" onClick={() => { setStep(Math.max(0, step - 1)); setTouched(false); }} disabled={step === 0} icon={<ArrowLeft size={16} weight="bold" className="rtl:rotate-180" />}>{t("back")}</Button>
                  <Button onClick={next} iconEnd={<ArrowRight size={16} weight="bold" className="rtl:rotate-180" />}>{step === 2 ? t("submitApplication") : t("continue")}</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
