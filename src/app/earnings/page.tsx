import { Banknote, CheckCircle2, Clock, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sumByCurrency(rows: Array<{ amount: number; currency: string }>): string {
  if (rows.length === 0) return "—";
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.currency, (map.get(r.currency) ?? 0) + r.amount);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cur, amt]) => `${cur} ${Math.round(amt).toLocaleString()}`)
    .join(" · ");
}

const STATUS_META = {
  PAID: { label: "Paid", tone: "bg-emerald-100 text-emerald-800" },
  APPROVED: { label: "Approved — payout scheduled", tone: "bg-sky-100 text-sky-800" },
  PENDING: { label: "Pending review", tone: "bg-amber-100 text-amber-800" },
} as const;

export default async function EarningsPage() {
  const session = await auth();
  if (!session?.user?.creatorId) return null;

  const earnings = await prisma.earning.findMany({
    where: { creatorId: session.user.creatorId },
    include: { campaign: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const paid = earnings.filter((e) => e.status === "PAID");
  const approved = earnings.filter((e) => e.status === "APPROVED");
  const pending = earnings.filter((e) => e.status === "PENDING");

  const stats = [
    { label: "Paid out", value: sumByCurrency(paid), icon: CheckCircle2, tone: "from-emerald-500 to-teal-700" },
    { label: "Approved — payout scheduled", value: sumByCurrency(approved), icon: Banknote, tone: "from-sky-500 to-indigo-600" },
    { label: "Pending review", value: sumByCurrency(pending), icon: Clock, tone: "from-amber-400 to-orange-600" },
  ];

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-dabur-900">
            Your <span className="text-gradient-green">Earnings</span>
          </h1>
          <p className="mt-1 max-w-xl text-muted-foreground">
            Every payment and barter value in one statement — barter entries show estimated retail
            value.
          </p>
        </div>
      </FadeUp>

      <Stagger className="mb-8 grid gap-4 sm:grid-cols-3" delayChildren={0.1}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <StaggerItem key={s.label}>
              <div className="glass-card p-5">
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.tone} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-dabur-900">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>

      <FadeUp delay={0.2}>
        <section className="glass-card overflow-hidden">
          {earnings.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-dabur-300" />
              <p className="text-muted-foreground">
                No earnings yet — get approved on a launch and your first line lands here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-dabur-50">
              {earnings.map((e) => {
                const meta = STATUS_META[e.status as keyof typeof STATUS_META] ?? STATUS_META.PENDING;
                return (
                  <li key={e.id} className="flex items-center gap-4 px-5 py-4">
                    <span
                      className={cn(
                        "hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold sm:flex",
                        e.type === "PAID" ? "bg-dabur-100 text-dabur-700" : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {e.type === "PAID" ? "$" : "🎁"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-dabur-900">{e.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.campaign?.name ? `${e.campaign.name} · ` : ""}
                        {e.type === "PAID" ? "Cash" : "Barter (est. value)"} · {formatDate(e.createdAt)}
                        {e.paidAt ? ` · paid ${formatDate(e.paidAt)}` : ""}
                      </p>
                    </div>
                    <span className={cn("hidden rounded-full px-2.5 py-0.5 text-xs font-semibold md:inline", meta.tone)}>
                      {meta.label}
                    </span>
                    <span className="w-28 shrink-0 text-right font-bold tabular-nums text-dabur-800">
                      {e.currency} {Math.round(e.amount).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </FadeUp>
    </Shell>
  );
}
