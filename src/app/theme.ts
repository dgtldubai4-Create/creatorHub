import { useCallback, useEffect, useState } from "react";

/**
 * Light, dark, or follow the device. A per-viewer convenience, so it lives in
 * browser storage on its own and never touches the app state. Reads and writes
 * are guarded: the page renders correctly when storage is unavailable.
 */
export type Theme = "auto" | "light" | "dark";
const KEY = "dabur-squad:theme";

function read(): Theme {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

// Whatever the host page put on the root before we touched it. "auto" restores it.
const hostTheme = typeof document === "undefined" ? null : document.documentElement.getAttribute("data-theme");

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    if (hostTheme) root.setAttribute("data-theme", hostTheme);
    else root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function initTheme() {
  const t = read();
  if (t !== "auto") apply(t);
}

function systemDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(read);
  const [sys, setSys] = useState(systemDark);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const on = () => setSys(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const dark = theme === "dark" || (theme === "auto" && (hostTheme ? hostTheme === "dark" : sys));
  const toggle = useCallback(() => {
    const next: Theme = dark ? "light" : "dark";
    try { window.localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
    apply(next);
    setTheme(next);
  }, [dark]);
  return { theme, dark, toggle };
}
