// Installable web app and device alerts.
//
// The hosted build gets a manifest, a service worker and an install prompt. The
// single-file build (opened from disk or embedded) skips all of it: nothing here
// may cause a network request there.
//
// Alerts are local notifications raised while the app is open. A real push server
// is outside this build, so the UI labels them as simulated.
import { useEffect, useRef, useState } from "react";
import { BellRinging, DeviceMobile, DownloadSimple, Check } from "@phosphor-icons/react";
import { useDispatch, useStore } from "./store";
import { useL, useT } from "../i18n";
import { Button, Chip, SimulatedTag } from "../ui/primitives";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const hosted = (): boolean => !__SINGLE_FILE__ && typeof window !== "undefined" && /^https?:$/.test(window.location.protocol) && window.self === window.top;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

/** Called once at boot. Adds the manifest and registers the service worker on the hosted build only. */
export function setupPwa(): void {
  if (!hosted()) return;
  const link = (rel: string, href: string) => {
    const el = document.createElement("link");
    el.rel = rel;
    el.href = href;
    document.head.appendChild(el);
  };
  link("manifest", "/manifest.webmanifest");
  link("apple-touch-icon", "/apple-touch-icon.png");
  link("icon", "/icon.svg");
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function useInstall(): { state: "installed" | "ready" | "manual"; ios: boolean; install: () => Promise<void> } {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const state = isStandalone() ? "installed" : deferred ? "ready" : "manual";
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    deferred = null;
    tick((n) => n + 1);
  };
  return { state, ios, install };
}

type Permission = "granted" | "default" | "denied" | "unsupported";
function permission(): Permission {
  try {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

async function raise(title: string, body: string, url: string): Promise<void> {
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) await reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url } });
    else new Notification(title, { body });
  } catch {
    // The page keeps working without the device notification; the in-app bell still has it.
  }
}

/** Mounted once in the creator shell. Raises a device notification for each new push-channel message. */
export function DeviceAlerts({ creatorId }: { creatorId: string }) {
  const s = useStore();
  const L = useL();
  const on = !!s.creators.find((c) => c.id === creatorId)?.alerts?.drops;
  const mine = s.notifications.filter((n) => n.audience === `creator:${creatorId}` && n.channel === "push");
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(mine.map((n) => n.id));
      return;
    }
    for (const n of mine) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      if (on && permission() === "granted") void raise(L(n.title), L(n.body), n.link ?? "/creator");
    }
  }, [mine, on, L]);
  return null;
}

/** Profile section: install the app, switch mission-drop alerts on or off. */
export function AppAlertsCard({ creatorId }: { creatorId: string }) {
  const t = useT();
  const s = useStore();
  const dispatch = useDispatch();
  const { state, ios, install } = useInstall();
  const [perm, setPerm] = useState<Permission>(permission());
  const on = !!s.creators.find((c) => c.id === creatorId)?.alerts?.drops && perm === "granted";

  const turnOn = async () => {
    let p = permission();
    if (p === "default") {
      try {
        p = await Notification.requestPermission();
      } catch {
        p = "unsupported";
      }
    }
    setPerm(p);
    if (p !== "granted") return;
    dispatch({ type: "setAlerts", creatorId, drops: true });
    void raise(t("alertsOn"), t("alertsBody"), "/creator/missions");
  };
  const turnOff = () => dispatch({ type: "setAlerts", creatorId, drops: false });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="label-card flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[14px] inverse-fill"><DeviceMobile size={22} weight="fill" /></span><div className="min-w-0"><div className="font-semibold">{t("installTitle")}</div><div className="text-[13px] text-ink-2">{t("installBody")}</div></div></div>
        {state === "installed" ? (
          <Chip tone="lime" icon={<Check size={13} weight="bold" />} className="self-start">{t("installed")}</Chip>
        ) : state === "ready" ? (
          <Button size="sm" className="self-start" onClick={() => void install()} icon={<DownloadSimple size={15} weight="bold" />}>{t("installCta")}</Button>
        ) : (
          <p className="text-[13px] font-medium text-ink-2">{ios ? t("installHowIos") : t("installHow")}</p>
        )}
      </div>
      <div className="label-card flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-line bg-accent-soft text-on"><BellRinging size={22} weight="fill" /></span><div className="min-w-0 flex-1"><div className="font-semibold">{t("alertsTitle")}</div><div className="text-[13px] text-ink-2">{t("alertsBody")}</div></div><SimulatedTag /></div>
        {perm === "unsupported" ? (
          <p className="text-[13px] font-medium text-ink-2">{t("alertsUnsupported")}</p>
        ) : perm === "denied" ? (
          <p className="text-[13px] font-medium text-rose">{t("alertsBlocked")}</p>
        ) : on ? (
          <div className="flex flex-wrap items-center gap-2"><Chip tone="lime" icon={<Check size={13} weight="bold" />}>{t("alertsOn")}</Chip><Button size="sm" variant="ghost" onClick={turnOff}>{t("alertsTurnOff")}</Button></div>
        ) : (
          <Button size="sm" className="self-start" onClick={() => void turnOn()} icon={<BellRinging size={15} weight="bold" />}>{t("alertsTurnOn")}</Button>
        )}
        <p className="text-[12px] font-medium text-ink-3">{t("alertsSimNote")}</p>
      </div>
    </div>
  );
}
