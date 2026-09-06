import Link from "next/link";
import { ArrowLeft, CheckCircle2, Trophy, Users, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FadeUp } from "@/components/motion";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ChallengeEntryForm } from "@/components/challenge-entry-form";
import { ProductImage } from "@/components/product-image";
import { Stamp } from "@/components/game/stamp";
import { MilesValue } from "@/components/game/miles-chip";
import { parseStringList, type Brand } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "The Menz Makeover Challenge" };

export default async function ChallengePage() {
  const campaign = await prisma.campaign.findFirst({
    where: { publicEntry: true, status: "LIVE" },
    include: { _count: { select: { assets: true } } },
  });

  if (!campaign) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-game text-3xl font-extrabold text-dabur-900">No open challenge right now</h1>
        <p className="mt-3 text-muted-foreground">
          The next public challenge is loading. Meanwhile, the side quests on the home page pay out
          in escrow.
        </p>
        <Link href="/" className="btn-3d mt-6 inline-block rounded-xl px-6 py-3">
          Back to DaburStars
        </Link>
      </div>
    );
  }

  const dos = parseStringList(campaign.dos);
  const donts = parseStringList(campaign.donts);

  return (
    <SmoothScroll>
    <div className="bg-paper">
      {/* Challenge hero — the shabab lane */}
      <div className="bg-gradient-to-br from-slate-800 to-zinc-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-game text-sm font-bold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> DaburStars
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <div className="max-w-xl flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Flagship public challenge · Vatika Menz
              </p>
              <h1 className="mt-2 font-game text-4xl font-extrabold sm:text-5xl" style={{ textWrap: "balance" }}>
                {campaign.name} <span aria-hidden>🧔🏻‍♂️</span>
              </h1>
              <p className="mt-3 text-lg text-slate-300">
                {campaign.tagline} Post a before/after grooming transformation, drop the link below,
                and you&apos;re in — <strong className="text-white">no account needed to start</strong>
                (entering creates one).
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden /> {campaign._count.assets} entries so far
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-mango" aria-hidden /> Weekly top 10 win product + AED 1,000
                </span>
                <span>Closes {formatDate(campaign.submissionDeadline ?? campaign.endDate)}</span>
              </div>
            </div>
            <div className="relative mx-auto">
              <ProductImage brand={campaign.brand as Brand} height={150} />
              <Stamp tone="orange" rotate={8} slam className="absolute -right-8 top-0 text-[11px]">
                +{campaign.basePoints} MI
                <br />
                PER STAMP
              </Stamp>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5">
        {/* Rules */}
        <FadeUp className="lg:col-span-2">
          <section className="glass-card p-6">
            <h2 className="font-game text-xl font-extrabold text-dabur-900">The rules</h2>
            <p className="mt-1 text-sm text-muted-foreground">{campaign.objective}</p>
            <div className="mt-5 space-y-4">
              <div>
                <h3 className="stamped mb-2 text-sm text-dabur-700">DO</h3>
                <ul className="space-y-2">
                  {dos.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-dabur-600" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="stamped mb-2 text-sm text-stampred">DON&apos;T</h3>
                <ul className="space-y-2">
                  {donts.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-stampred" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-dashed border-mango bg-tang-soft/60 p-4 text-sm">
                <p className="font-game font-bold text-tang-deep">What winning gets you</p>
                <p className="mt-1 text-inkbrown">{campaign.compensation}</p>
                <p className="mt-2 text-muted-foreground">
                  Every stamped entry banks <MilesValue miles={campaign.basePoints} className="text-sm" /> —
                  and drops you at the door of the whole program: campaigns, shop, the ladder to
                  Ambassador.
                </p>
              </div>
            </div>
          </section>
        </FadeUp>

        {/* Entry form */}
        <FadeUp delay={0.1} className="lg:col-span-3">
          <section className="glass-card p-6 sm:p-8">
            <h2 className="font-game text-xl font-extrabold text-dabur-900">Enter the challenge</h2>
            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              Post your transformation on your channel first, then drop the link here.
            </p>
            <ChallengeEntryForm campaignId={campaign.id} />
          </section>
        </FadeUp>
      </div>
    </div>
    </SmoothScroll>
  );
}
