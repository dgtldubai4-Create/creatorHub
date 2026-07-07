"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { decisionSchema, type DecisionInput } from "@/lib/validators";
import type { ActionResult } from "@/actions/signup";

/**
 * Approve / reject a JoinRequest or Asset.
 * MARKETER users are scoped to their region; BRAND_LEAD/ADMIN see everything.
 * Rejection always requires a reason (enforced by decisionSchema).
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

    await prisma.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id },
        data: {
          status: decision,
          decisionReason: decision === "REJECTED" ? reason : reason ?? null,
          decidedById: session.user.id,
        },
      });
      // First approval activates a PROSPECT creator.
      if (decision === "APPROVED") {
        await tx.creator.updateMany({
          where: { id: request.creatorId, status: "PROSPECT" },
          data: { status: "ACTIVE" },
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

    await prisma.asset.update({
      where: { id },
      data: {
        status: decision,
        feedback: decision === "REJECTED" ? reason : reason ?? null,
      },
    });
  }

  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath("/me");
  return { ok: true };
}

/** Mark an asset the creator has published as LIVE (marketer confirms). */
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

  await prisma.asset.update({ where: { id: assetId }, data: { status: "LIVE" } });

  revalidatePath("/queue");
  revalidatePath("/me");
  return { ok: true };
}
