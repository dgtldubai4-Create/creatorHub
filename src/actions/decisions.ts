"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { decisionSchema, type DecisionInput } from "@/lib/validators";
import { POINTS } from "@/lib/program";
import type { ActionResult } from "@/actions/signup";

/** Look up the login user attached to a creator profile (may not exist). */
async function creatorUserId(creatorId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { creatorId }, select: { id: true } });
  return user?.id ?? null;
}

/**
 * Approve / reject a JoinRequest or Asset.
 * MARKETER users are scoped to their region; BRAND_LEAD/ADMIN see everything.
 * Rejection always requires a reason (enforced by decisionSchema).
 *
 * Approvals drive the points economy: join approval and asset approval write
 * ledger events, bump the creator's balance + lifetime points, and notify the
 * creator — all in the same transaction as the decision.
 */
export async function decide(input: DecisionInput): Promise<ActionResult> {
  const session = await requireRole("MARKETER", "BRAND_LEAD", "ADMIN");
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { id, kind, decision, reason } = parsed.data;

  const regionScope =
    session.user.role === "MARKETER" && session.user.region
      ? session.user.region
      : null;

  if (kind === "JOIN_REQUEST") {
    const request = await prisma.joinRequest.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!request || request.status !== "PENDING") {
      return { ok: false, error: "Request not found or already decided" };
    }
    if (regionScope && request.campaign.region !== regionScope) {
      return { ok: false, error: "This request is outside your region" };
    }

    const userId = await creatorUserId(request.creatorId);

    await prisma.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id },
        data: {
          status: decision,
          decisionReason: decision === "REJECTED" ? reason : reason ?? null,
          decidedById: session.user.id,
        },
      });

      if (decision === "APPROVED") {
        // First approval activates a PROSPECT creator.
        await tx.creator.updateMany({
          where: { id: request.creatorId, status: "PROSPECT" },
          data: { status: "ACTIVE" },
        });
        await tx.pointsEvent.create({
          data: {
            creatorId: request.creatorId,
            type: "JOIN_APPROVED",
            points: POINTS.JOIN_APPROVED,
            note: `Accepted into ${request.campaign.name}`,
          },
        });
        await tx.creator.update({
          where: { id: request.creatorId },
          data: {
            points: { increment: POINTS.JOIN_APPROVED },
            lifetimePoints: { increment: POINTS.JOIN_APPROVED },
          },
        });
        if (userId) {
          await tx.notification.create({
            data: {
              userId,
              title: `You're on "${request.campaign.name}" 🎉 +${POINTS.JOIN_APPROVED} pts`,
              body: "Read the brief carefully (especially the don'ts) and submit your first deliverable.",
              href: `/launches/${request.campaignId}`,
            },
          });
        }
      } else if (userId) {
        await tx.notification.create({
          data: {
            userId,
            title: `Update on "${request.campaign.name}"`,
            body: reason ?? "Your request wasn't approved this time.",
            href: "/me",
          },
        });
      }
    });
  } else {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!asset || !["SUBMITTED", "UNDER_REVIEW"].includes(asset.status)) {
      return { ok: false, error: "Asset not found or already decided" };
    }
    if (regionScope && asset.campaign.region !== regionScope) {
      return { ok: false, error: "This asset is outside your region" };
    }

    const userId = await creatorUserId(asset.creatorId);
    const basePoints = asset.campaign.basePoints;

    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: {
          status: decision,
          feedback: decision === "REJECTED" ? reason : reason ?? null,
        },
      });

      if (decision === "APPROVED") {
        await tx.pointsEvent.create({
          data: {
            creatorId: asset.creatorId,
            type: "ASSET_APPROVED",
            points: basePoints,
            note: `${asset.type.charAt(0) + asset.type.slice(1).toLowerCase()} approved — ${asset.campaign.name}`,
          },
        });
        await tx.creator.update({
          where: { id: asset.creatorId },
          data: {
            points: { increment: basePoints },
            lifetimePoints: { increment: basePoints },
          },
        });
        if (userId) {
          await tx.notification.create({
            data: {
              userId,
              title: `Content approved 🎉 +${basePoints} pts`,
              body: `Your ${asset.type.toLowerCase()} for "${asset.campaign.name}" is cleared — post it and the live bonus follows.`,
              href: "/me",
            },
          });
        }
      } else if (userId) {
        await tx.notification.create({
          data: {
            userId,
            title: `Action needed on your ${asset.type.toLowerCase()}`,
            body: reason ?? "Your submission needs changes — see the feedback and resubmit.",
            href: "/me",
          },
        });
      }
    });
  }

  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath("/me");
  return { ok: true };
}

/**
 * Mark an approved asset as LIVE (marketer confirms the post is up).
 * Awards the live bonus on top of the approval points.
 */
export async function markAssetLive(assetId: string): Promise<ActionResult> {
  const session = await requireRole("MARKETER", "BRAND_LEAD", "ADMIN");

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { campaign: true },
  });
  if (!asset || asset.status !== "APPROVED") {
    return { ok: false, error: "Only approved assets can go live" };
  }
  if (
    session.user.role === "MARKETER" &&
    session.user.region &&
    asset.campaign.region !== session.user.region
  ) {
    return { ok: false, error: "This asset is outside your region" };
  }

  const userId = await creatorUserId(asset.creatorId);

  await prisma.$transaction(async (tx) => {
    await tx.asset.update({ where: { id: assetId }, data: { status: "LIVE" } });
    await tx.pointsEvent.create({
      data: {
        creatorId: asset.creatorId,
        type: "ASSET_LIVE",
        points: POINTS.ASSET_LIVE_BONUS,
        note: `${asset.type.charAt(0) + asset.type.slice(1).toLowerCase()} live — ${asset.campaign.name}`,
      },
    });
    await tx.creator.update({
      where: { id: asset.creatorId },
      data: {
        points: { increment: POINTS.ASSET_LIVE_BONUS },
        lifetimePoints: { increment: POINTS.ASSET_LIVE_BONUS },
      },
    });
    if (userId) {
      await tx.notification.create({
        data: {
          userId,
          title: `You're live! +${POINTS.ASSET_LIVE_BONUS} pts`,
          body: `"${asset.campaign.name}" content is confirmed live. The bonus just landed.`,
          href: "/me",
        },
      });
    }
  });

  revalidatePath("/queue");
  revalidatePath("/me");
  revalidatePath("/");
  return { ok: true };
}
