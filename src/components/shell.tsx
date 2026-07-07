import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import type { ReactNode } from "react";

/** Authenticated page chrome: role-aware nav + content container. */
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

  return (
    <div className="flex min-h-screen flex-col">
      <Nav
        role={session.user.role}
        name={session.user.name ?? "User"}
        region={session.user.region}
        pendingCount={pendingCount}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t bg-white/50 py-4 text-center text-xs text-muted-foreground">
        Dabur Creator Hub · Middle East Digital Marketing · MVP
      </footer>
    </div>
  );
}
