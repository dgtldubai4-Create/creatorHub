"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { tierForPoints, tierRank, tierByKey } from "@/lib/program";
import type { ActionResult } from "@/actions/signup";

const redeemSchema = z.object({ rewardId: z.string().min(1) });

/**
 * Redeem a reward: checks tier gate + balance, then atomically writes the
 * redemption, the negative ledger event, the balance decrement and the stock
 * decrement. Tier (lifetimePoints) is never reduced by redemptions.
 */
export async function redeemReward(input: z.infer<typeof redeemSchema>): Promise<ActionResult> {
  const session = await requireRole("CREATOR");
  const creatorId = session.user.creatorId;
  if (!creatorId) return { ok: false, error: "No creator profile linked to this account" };

  const parsed = redeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const [creator, reward] = await Promise.all([
    prisma.creator.findUniqueOrThrow({ where: { id: creatorId } }),
    prisma.reward.findUnique({ where: { id: parsed.data.rewardId } }),
  ]);

  if (!reward || !reward.active) return { ok: false, error: "This reward is not available" };
  if (reward.stock <= 0) return { ok: false, error: "This reward is out of stock" };

  const tier = tierForPoints(creator.lifetimePoints);
  if (tierRank(tier.key) < tierRank(reward.minTier)) {
    const needed = tierByKey(reward.minTier);
    return {
      ok: false,
      error: `${needed.emoji} ${needed.label} tier unlocks this reward — you're ${tier.label}. Keep climbing!`,
    };
  }
  if (creator.points < reward.pointsCost) {
    return {
      ok: false,
      error: `You need ${(reward.pointsCost - creator.points).toLocaleString()} more points for this reward`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
    // Guarded decrement: fails the transaction if stock raced to zero.
    const updated = await tx.reward.updateMany({
      where: { id: reward.id, stock: { gt: 0 } },
      data: { stock: { decrement: 1 } },
    });
    if (updated.count === 0) throw new Error("OUT_OF_STOCK");

    await tx.redemption.create({
      data: { creatorId, rewardId: reward.id, status: "REQUESTED" },
    });
    await tx.pointsEvent.create({
      data: {
        creatorId,
        type: "REDEMPTION",
        points: -reward.pointsCost,
        note: `Redeemed: ${reward.title}`,
      },
    });
    await tx.creator.update({
      where: { id: creatorId },
      data: { points: { decrement: reward.pointsCost } },
    });
    await tx.notification.create({
      data: {
        userId: session.user.id,
        title: `Redeemed: ${reward.title} ${reward.emoji}`,
        body: "The program team will confirm fulfilment — track it on your rewards page.",
        href: "/rewards",
      },
    });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "OUT_OF_STOCK") {
      return { ok: false, error: "This reward just sold out" };
    }
    throw e;
  }

  revalidatePath("/rewards");
  revalidatePath("/");
  return { ok: true };
}
