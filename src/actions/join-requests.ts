"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  barterTermsSchema,
  joinRequestSchema,
  type BarterTermsInput,
  type JoinRequestInput,
} from "@/lib/validators";
import type { ActionResult } from "@/actions/signup";

async function requireCreator() {
  const session = await requireRole("CREATOR");
  if (!session.user.creatorId) throw new Error("FORBIDDEN");
  return session.user.creatorId;
}

async function assertCampaignOpen(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || !campaign.openToCreators || campaign.status === "CLOSED") {
    return null;
  }
  return campaign;
}

export async function requestToJoin(input: JoinRequestInput): Promise<ActionResult> {
  const creatorId = await requireCreator();
  const parsed = joinRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const campaign = await assertCampaignOpen(parsed.data.campaignId);
  if (!campaign) return { ok: false, error: "This campaign is not open to creators" };

  const existing = await prisma.joinRequest.findUnique({
    where: { creatorId_campaignId: { creatorId, campaignId: campaign.id } },
  });
  if (existing) return { ok: false, error: "You already have a request for this campaign" };

  await prisma.joinRequest.create({
    data: {
      creatorId,
      campaignId: campaign.id,
      type: "JOIN",
      status: "PENDING",
    },
  });

  revalidatePath("/launches");
  revalidatePath("/me");
  return { ok: true };
}

export async function proposeBarter(input: BarterTermsInput): Promise<ActionResult> {
  const creatorId = await requireCreator();
  const parsed = barterTermsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const campaign = await assertCampaignOpen(parsed.data.campaignId);
  if (!campaign) return { ok: false, error: "This campaign is not open to creators" };

  const existing = await prisma.joinRequest.findUnique({
    where: { creatorId_campaignId: { creatorId, campaignId: campaign.id } },
  });
  if (existing) return { ok: false, error: "You already have a request for this campaign" };

  const proposedTerms = `Deliverables: ${parsed.data.deliverables}\nRequested product/perk: ${parsed.data.requestedPerk}`;

  await prisma.joinRequest.create({
    data: {
      creatorId,
      campaignId: campaign.id,
      type: "BARTER",
      proposedTerms,
      status: "PENDING",
    },
  });

  revalidatePath("/launches");
  revalidatePath("/me");
  return { ok: true };
}
