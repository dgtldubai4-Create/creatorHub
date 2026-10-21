import { Link } from "react-router-dom";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { PageHeader, Section, Stat } from "../../ui/primitives";
import { Reveal, Item, Stagger } from "../../ui/motion";
import { PhaseTrail } from "../../ui/JourneyTrail";
import { adminOverview, notificationsFor } from "../../domain/selectors";
import { PHASES, phaseOf } from "../../domain/stages";
import { can } from "../../domain/permissions";
import { CampaignStatusChip, BrandMark } from "../shared/bits";
import { Avatar } from "../../ui/primitives";
import { cn } from "../../ui/cn";

export function AdminOverview() {
  const t = useT();
  const L = useL();
  const { num, relative } = useFormat();
  const s = useStore();
  const o = adminOverview(s);
  const role = s.session.role;
  const user = s.brandUsers.find((u) => u.id === s.session.brandUserId);
  const feed = notificationsFor(s, "brand").slice(0, 6);
  const inFlight = s.participations.filter((p) => !["completed", "declined"].includes(p.stage));
  const byPhase = PHASES.map((ph) => ({ ph, items: inFlight.filter((p) => phaseOf(p.stage) === ph) }));

  const queues = [
    can(role, "review") && { label: t("awaitingReview"), value: o.pendingReview, to: "/admin/review", tone: o.pendingReview ? "marigold" : "neutral" },
    can(role, "review") && { label: t("missionPostsToReview"), value: o.missionReview, to: "/admin/missions", tone: o.missionReview ? "marigold" : "neutral" },
    can(role, "logistics") && { label: t("kitsToShip"), value: o.toShip, to: "/admin/logistics", tone: o.toShip ? "marigold" : "neutral" },
    can(role, "review") && { label: t("linksToVerify"), value: o.toVerify, to: "/admin/campaigns", tone: o.toVerify ? "marigold" : "neutral" },
    can(role, "loyalty") && { label: t("pointsToRelease"), value: o.toRelease, to: "/admin/loyalty", tone: o.toRelease ? "marigold" : "neutral" },
    can(role, "loyalty") && { label: t("redemptionsToFulfil"), value: o.toFulfil, to: "/admin/loyalty", tone: o.toFulfil ? "marigold" : "neutral" },
  ].filter(Boolean) as { label: string; value: number; to: string; tone: "marigold" | "neutral" }[];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={<>{user?.name.split(" ")[0]}, {t("adminGreeting").toLowerCase()}</>} sub={`${t(`role_${role}` as const)} · ${t("seat")}: ${t("brandSeat")}`} />
      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Item><Stat label={t("liveCampaigns")} value={num(o.live)} to={can(role, "campaigns") ? "/admin/campaigns" : undefined} tone="leaf" /></Item>
        <Item><Stat label={t("liveMissions")} value={num(o.liveMissions)} to={can(role, "review") ? "/admin/missions" : undefined} /></Item>
        <Item><Stat label={t("monthActive")} value={num(o.monthActive)} hint={`${num(o.inFlight)} ${t("inFlight").toLowerCase()}`} /></Item>
        <Item><Stat label={t("verifiedCreators")} value={`${num(o.verifiedCreators)}/${num(o.creators)}`} to={can(role, "invite") ? "/admin/creators" : undefined} /></Item>
        <Item><Stat label={t("pointsOut")} value={num(o.pointsOut)} /></Item>
      </Stagger>

      {queues.length > 0 && (
        <Section title={t("queues")}>
          <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {queues.map((q) => <Item key={q.label}><Stat label={q.label} value={num(q.value)} to={q.to} tone={q.tone} /></Item>)}
          </Stagger>
        </Section>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        <Section title={t("journeyMap")} className="lg:col-span-3">
          <Reveal className="card overflow-hidden">
            <div className="grid grid-cols-6 divide-x divide-line rtl:divide-x-reverse">
              {byPhase.map(({ ph, items }) => (
                <div key={ph} className="flex min-h-56 flex-col gap-2 p-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] font-semibold">{t(`phase_${ph}` as const)}</span>
                    <span className="text-[12px] tabular text-ink-3">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {items.slice(0, 8).map((p) => {
                      const cr = s.creators.find((x) => x.id === p.creatorId)!;
                      const c = s.campaigns.find((x) => x.id === p.campaignId)!;
                      return (
                        <Link key={p.id} to={can(role, "campaigns") ? `/admin/campaigns/${c.id}` : "/admin"} title={`${cr.name} · ${L(c.title)} · ${t(`stage_${p.stage}` as const)}`} className="press flex items-center gap-1.5 rounded-xl bg-surface-2 p-1.5 hover:bg-surface-3">
                          <Avatar name={cr.name} hue={cr.hue} size={22} />
                          <span className="hidden min-w-0 flex-1 truncate text-[11.5px] xl:block">{cr.name.split(" ")[0]}</span>
                        </Link>
                      );
                    })}
                    {items.length > 8 && <span className="px-1 text-[11px] text-ink-3">+{items.length - 8}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </Section>
        <Section title={t("whatsHappening")} className="lg:col-span-2" action={<Link to="/admin/notifications" className="text-[13px] font-medium text-leaf hover:underline">{t("viewAll")}</Link>}>
          <ul className="card divide-y divide-line">
            {feed.map((n) => (
              <li key={n.id}>
                <Link to={n.link ?? "/admin"} className={cn("block px-4 py-3 hover:bg-surface-2", !n.read && "bg-leaf-soft/30")}>
                  <div className="text-[14px] font-medium">{L(n.title)}</div>
                  <div className="text-[13px] text-ink-2">{L(n.body)}</div>
                  <div className="mt-0.5 text-[12px] text-ink-3">{relative(n.at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {can(role, "campaigns") && (
        <Section title={t("campaigns")} action={<Link to="/admin/campaigns" className="text-[13px] font-medium text-leaf hover:underline">{t("viewAll")}</Link>}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {s.campaigns.filter((c) => c.status !== "draft" && c.status !== "completed").slice(0, 6).map((c) => {
              const b = s.brands.find((x) => x.id === c.brandId)!;
              const ps = s.participations.filter((p) => p.campaignId === c.id);
              return (
                <Link key={c.id} to={`/admin/campaigns/${c.id}`} className="card press flex flex-col gap-3 p-4 hover:border-ink-3">
                  <div className="flex items-center justify-between"><BrandMark brand={b} size="sm" /><CampaignStatusChip status={c.status} /></div>
                  <div className="text-[16px] font-semibold">{L(c.title)}</div>
                  <div className="flex flex-col gap-1.5">
                    {ps.slice(0, 3).map((p) => {
                      const cr = s.creators.find((x) => x.id === p.creatorId)!;
                      return <div key={p.id} className="flex items-center gap-2 text-[12.5px]"><Avatar name={cr.name} hue={cr.hue} size={18} /><span className="w-24 truncate">{cr.name.split(" ")[0]}</span><PhaseTrail stage={p.stage} size="sm" /></div>;
                    })}
                    {ps.length > 3 && <span className="text-[12px] text-ink-3">+{ps.length - 3}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
