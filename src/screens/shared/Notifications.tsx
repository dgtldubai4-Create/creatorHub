import { Link } from "react-router-dom";
import { BellSlash, EnvelopeSimple, DeviceMobile, AppWindow } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, EmptyState, PageHeader, SimulatedTag } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { notificationsFor, unreadCount } from "../../domain/selectors";
import { cn } from "../../ui/cn";

export function Notifications({ audience }: { audience: "creator" | "brand" }) {
  const t = useT();
  const L = useL();
  const { relative } = useFormat();
  const s = useStore();
  const dispatch = useDispatch();
  const key = audience === "brand" ? "brand" : `creator:${s.session.creatorId}`;
  const list = notificationsFor(s, key);
  const unread = unreadCount(s, key);
  const icon = { email: <EnvelopeSimple size={16} />, push: <DeviceMobile size={16} />, inapp: <AppWindow size={16} /> };
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("notifications")} sub={t("notificationsSub")} eyebrow={<SimulatedTag />} actions={unread > 0 && <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "markRead", audience: key })}>{t("markAllRead")}</Button>} />
      {list.length === 0 ? (
        <EmptyState icon={<BellSlash size={24} weight="duotone" />} title={t("noNotifications")} body={t("noNotificationsBody")} />
      ) : (
        <Stagger className="grid gap-2" gap={0.03}>
          {list.map((n) => {
            const body = (
              <div className={cn("label-card flex items-start gap-4 p-4", !n.read && "border-leaf/40 bg-leaf-soft/30", n.link && "press hover:border-ink-3")}>
                <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", n.read ? "bg-surface-2 text-ink-3" : "bg-leaf-soft text-leaf")}>{icon[n.channel]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-[15px]", !n.read && "font-semibold")}>{L(n.title)}</span>
                    <Chip className="h-6 text-[11.5px]">{t(`ch_${n.channel}` as const)}</Chip>
                  </div>
                  <p className="mt-1 text-[14px] text-ink-2">{L(n.body)}</p>
                  <div className="mt-1.5 text-[12px] text-ink-3">{relative(n.at)}</div>
                </div>
              </div>
            );
            return <Item key={n.id}>{n.link ? <Link to={n.link}>{body}</Link> : body}</Item>;
          })}
        </Stagger>
      )}
    </div>
  );
}
