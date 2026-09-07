import { useCallback, useEffect } from "react";
import { STRINGS, type StringKey } from "./strings";
import type { Lang, Localised } from "../domain/types";
import { useDispatch, useStore } from "../app/store";

export function useLang(): Lang {
  return useStore().lang;
}

export function useDir(): "ltr" | "rtl" {
  return useLang() === "ar" ? "rtl" : "ltr";
}

type Vars = Record<string, string | number>;

function fill(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** UI string translator. `t("key", { n: 3 })`. */
export function useT() {
  const lang = useLang();
  return useCallback((key: StringKey, vars?: Vars) => fill(STRINGS[key][lang === "ar" ? 1 : 0], vars), [lang]);
}

/** Picks the current language out of an entity's {en, ar} field. */
export function useL() {
  const lang = useLang();
  return useCallback((l: Localised | undefined | null) => (l ? (lang === "ar" ? l.ar || l.en : l.en) : ""), [lang]);
}

export function useToggleLang() {
  const lang = useLang();
  const dispatch = useDispatch();
  return useCallback(() => dispatch({ type: "setLanguage", lang: lang === "ar" ? "en" : "ar" }), [lang, dispatch]);
}

/** Keeps <html lang dir> in sync with global language state. */
export function useDocumentLang() {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
}

export function useFormat() {
  const lang = useLang();
  const t = useT();
  const locale = lang === "ar" ? "ar-AE" : "en-AE";
  const num = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
  const date = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Intl.DateTimeFormat(locale, opts).format(new Date(iso));
  const relative = (iso: string, now = Date.now()) => {
    const ms = now - new Date(iso).getTime();
    const hours = Math.round(ms / 3_600_000);
    if (Math.abs(hours) < 1) return t("justNow");
    if (hours < 24 && hours > 0) return t("hoursAgo", { n: hours });
    const days = Math.round(hours / 24);
    if (days === 1) return t("yesterday");
    if (days < 0) return t("inDays", { n: -days });
    return t("daysAgo", { n: days });
  };
  const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const bytes = (b: number) => (b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`);
  return { num, date, relative, clock, bytes, locale };
}
