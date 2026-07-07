"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { assetSubmissionSchema, type AssetSubmissionInput } from "@/lib/validators";
import type { ActionResult } from "@/actions/signup";

export async function submitAsset(input: AssetSubmissionInput): Promise<ActionResult> {
  const session = await requireRole("CREATOR");
  const creatorId = session.user.creatorId;
  if (!creatorId) return { ok: false, error: "No creator profile linked to this account" };

  const parsed = assetSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  // Only campaigns the creator has an APPROVED join request for.
  const approved = await prisma.joinRequest.findFirst({
    where: { creatorId, campaignId: parsed.data.campaignId, status: "APPROVED" },
  });
  if (!approved) {
    return { ok: false, error: "You can only submit to campaigns you've been approved for" };
  }

  await prisma.asset.create({
    data: {
      creatorId,
      campaignId: parsed.data.campaignId,
      type: parsed.data.type,
      url: parsed.data.url,
      caption: parsed.data.caption,
      status: "SUBMITTED",
    },
  });

  revalidatePath("/me");
  revalidatePath("/submit");
  return { ok: true };
}
