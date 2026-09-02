"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  campaignSchema,
  creatorAdminSchema,
  rewardSchema,
  type CampaignInput,
  type CreatorAdminInput,
  type RewardInput,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/signup";

type SaveResult = ActionResult | { ok: true; id: string };

/**
 * Create or update a campaign brief. Marketers are locked to their own
 * region (both the campaign's current region and the one being set);
 * brand leads and admins manage everything.
 */
export async function saveCampaign(input: CampaignInput): Promise<SaveResult> {
  const session = await requireRole("MARKETER", "BRAND_LEAD", "ADMIN");
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const regionScope =
    session.user.role === "MARKETER" && session.user.region ? session.user.region : null;
  if (regionScope && data.region !== regionScope) {
    return { ok: false, error: `As a ${regionScope} marketer you can only run ${regionScope} campaigns` };
  }

  const payload = {
    name: data.name,
    brand: data.brand,
    region: data.region,
    objective: data.objective,
    tagline: data.tagline?.trim() ? data.tagline.trim() : null,
    startDate: data.startDate,
    endDate: data.endDate,
    submissionDeadline: data.submissionDeadline ?? null,
    status: data.status,
    openToCreators: data.openToCreators,
    publicEntry: data.publicEntry,
    basePoints: data.basePoints,
    compensation: data.compensation?.trim() ? data.compensation.trim() : null,
    deliverables: JSON.stringify(
      data.deliverables.map((d) => ({ ...d, notes: d.notes?.trim() || undefined })),
    ),
    dos: JSON.stringify(data.dos),
    donts: JSON.stringify(data.donts),
    kpis: JSON.stringify(Object.fromEntries(data.kpis.map((k) => [k.metric, k.target]))),
  };

  let id: string;
  if (data.id) {
    const existing = await prisma.campaign.findUnique({ where: { id: data.id } });
    if (!existing) return { ok: false, error: "Campaign not found" };
    if (regionScope && existing.region !== regionScope) {
      return { ok: false, error: "This campaign is outside your region" };
    }
    await prisma.campaign.update({ where: { id: data.id }, data: payload });
    id = data.id;
  } else {
    const created = await prisma.campaign.create({ data: payload });
    id = created.id;
  }

  revalidatePath("/admin/campaigns");
  revalidatePath("/launches");
  revalidatePath("/challenge");
  revalidatePath("/");
  return { ok: true, id };
}

/** Create or update a shop reward. Brand-side only. */
export async function saveReward(input: RewardInput): Promise<ActionResult> {
  await requireRole("MARKETER", "BRAND_LEAD", "ADMIN");
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { id, ...data } = parsed.data;

  if (id) {
    const existing = await prisma.reward.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Reward not found" };
    await prisma.reward.update({ where: { id }, data });
  } else {
    await prisma.reward.create({ data });
  }

  revalidatePath("/admin/shop");
  revalidatePath("/rewards");
  revalidatePath("/");
  return { ok: true };
}

/** Pause/activate a creator or set their follower tier (brand classification). */
export async function updateCreatorAdmin(input: CreatorAdminInput): Promise<ActionResult> {
  await requireRole("MARKETER", "BRAND_LEAD", "ADMIN");
  const parsed = creatorAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { creatorId, status, followerTier } = parsed.data;
  if (!status && !followerTier) return { ok: false, error: "Nothing to change" };

  const creator = await prisma.creator.findUnique({ where: { id: creatorId } });
  if (!creator) return { ok: false, error: "Creator not found" };

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      ...(status ? { status } : {}),
      ...(followerTier ? { followerTier } : {}),
    },
  });

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath("/creators");
  return { ok: true };
}
