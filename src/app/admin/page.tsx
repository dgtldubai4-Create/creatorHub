import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Gift,
  Megaphone,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { CountUp, FadeUp, Stagger, StaggerItem } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "CREATOR") return null;

  const regionScope =
    session.user.role === "MARKETER" && session.user.region ? session.user.region : null;
  const campaignScope = regionScope ? { region: regionScope } : {};
  const relScope = regionScope ? { campaign: { region: regionScope } } : {};

  const [liveCampaigns, planningCampaigns, pendingCasting, pendingContent, activeCreators, lowStock] =
    await Promise.all([
      prisma.campaign.count({ where: { status: "LIVE", ...campaignScope } }),
      prisma.campaign.count({ where: { status: "PLANNING", ...campaignScope } }),
      prisma.joinRequest.count({ where: { status: "PENDING", ...relScope } }),
      prisma.asset.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, ...relScope } }),
      prisma.creator.count({ where: { status: "ACTIVE" } }),
      prisma.reward.count({ where: { active: true, stock: { lte: 5 } } }),
    ]);

  const areas = [
    {
      href: "/admin/campaigns",
      icon: Megaphone,
      title: "Campaign Manager",
      body: "Write briefs, set miles, flip campaigns live, run public challenges.",
      stat: `${liveCampaigns} live · ${planningCampaigns} in planning`,
      urgent: false,
    },
    {
      href: "/queue",
      icon: ClipboardCheck,
      title: "Control Room",
      body: "Cast creators and stamp content — every decision pays out automatically.",
      stat: `${pendingCasting + pendingContent} waiting on you`,
      urgent: pendingCasting + pendingContent > 0,
    },
    {
      href: "/admin/shop",
      icon: Gift,
      title: "Shop Manager",
      body: "Prices, stock and class gates on everything creators can claim.",
      stat: lowStock > 0 ? `${lowStock} item${lowStock === 1 ? "" : "s"} low on stock` : "Stock healthy",
      urgent: lowStock > 0,
    },
    {
      href: "/creators",
      icon: Users,
      title: "Creator Directory",
      body: "The bench — activate, pause and classify creators.",
      stat: `${activeCreators} active creators`,
      urgent: false,
    },
    {
      href: "/insights",
      icon: BarChart3,
      title: "Insights",
      body: "Funnels, approval rates and the program's pulse.",
      stat: "Updated live",
      urgent: false,
    },
  ];

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dabur-600">
            Brand side · {regionScope ?? "All markets"}
          </p>
          <h1 className="mt-1 font-game text-3xl font-extrabold text-dabur-900">
            Admin <span className="text-tang">Panel</span>
          </h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            Everything the consumer side runs on is set from these five rooms.
          </p>
        </div>
      </FadeUp>

      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" delayChildren={0.1}>
        {areas.map((a) => {
          const Icon = a.icon;
          return (
            <StaggerItem key={a.href}>
              <Link href={a.href} className="glass-card card-lift group block h-full p-6">
                <div className="mb-4 flex items-start justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-dabur-600 text-white shadow-md transition-transform duration-200 ease-out-strong group-hover:scale-110">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {a.urgent && (
                    <span className="stamped -rotate-3 rounded border-2 border-tang px-2 py-0.5 text-[10px] text-tang-deep">
                      NEEDS YOU
                    </span>
                  )}
                </div>
                <h2 className="font-game text-lg font-bold text-dabur-900">{a.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-dabur-700">
                  {a.stat}
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Shell>
  );
}
