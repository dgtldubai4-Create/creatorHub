import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { tierForPoints } from "@/lib/program";
import { timeAgo } from "@/lib/utils";
import type { ReactNode } from "react";

/** Authenticated page chrome: role-aware nav + notifications + tier chip. */
export async function Shell({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  let pendingCount = 0;
  if (session.user.role !== "CREATOR") {
    const regionFilter =
      session.user.role === "MARKETER" && session.user.region
        ? { campaign: { region: session.user.region } }
        : {};
    const [requests, assets] = await Promise.all([
      prisma.joinRequest.count({ where: { status: "PENDING", ...regionFilter } }),
      prisma.asset.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] }, ...regionFilter } }),
    ]);
    pendingCount = requests + assets;
  }

  const [rawNotifications, creator] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    session.user.creatorId
      ? prisma.creator.findUnique({
          where: { id: session.user.creatorId },
          select: { points: true, lifetimePoints: true },
        })
      : Promise.resolve(null),
  ]);

  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    unread: n.readAt === null,
    when: timeAgo(n.createdAt),
  }));

  const tier = creator ? tierForPoints(creator.lifetimePoints) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Nav
        role={session.user.role}
        name={session.user.name ?? "User"}
        region={session.user.region}
        pendingCount={pendingCount}
        notifications={notifications}
        tier={tier ? { label: tier.label, emoji: tier.emoji } : null}
        points={creator?.points}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border bg-card/60 py-4 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        DaburStars · Earn → Level → Spend · Middle East
      </footer>
    </div>
  );
}
