"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  challengeEntrySchema,
  signupSchema,
  type ChallengeEntryInput,
  type SignupInput,
} from "@/lib/validators";
import { POINTS } from "@/lib/program";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await hash(data.password, 10);
  // Guest side-quest escrow: the client reports what was earned, the server
  // enforces the hard cap — inflated values are simply clamped.
  const banked = Math.min(Math.max(0, data.escrowMiles ?? 0), POINTS.SIDE_QUEST_CAP);
  const startingMiles = POINTS.SIGNUP + banked;

  // Creator profile + login in one transaction; status starts as PROSPECT.
  await prisma.$transaction(async (tx) => {
    const creator = await tx.creator.create({
      data: {
        name: data.name,
        email,
        handles: JSON.stringify({ [data.primaryPlatform]: data.handle }),
        primaryPlatform: data.primaryPlatform,
        followerTier: "NANO", // classified later by the team
        region: data.region,
        category: data.category,
        collabType: data.collabType,
        status: "PROSPECT",
        tags: "[]",
        points: startingMiles,
        lifetimePoints: startingMiles,
      },
    });
    await tx.pointsEvent.create({
      data: {
        creatorId: creator.id,
        type: "SIGNUP",
        points: POINTS.SIGNUP,
        note: "Welcome to DaburStars",
      },
    });
    if (banked > 0) {
      await tx.pointsEvent.create({
        data: {
          creatorId: creator.id,
          type: "SIDE_QUEST",
          points: banked,
          note: "Side quests cleared as a guest — escrow banked",
        },
      });
    }
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "CREATOR",
        name: data.name,
        creatorId: creator.id,
      },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        title: `Welcome to DaburStars 🧭 +${startingMiles} miles`,
        body:
          banked > 0
            ? `Your ${banked} escrowed quest miles are banked on top of the ${POINTS.SIGNUP} welcome miles. Start with the Playbook in the Academy.`
            : "Your welcome miles are banked. Start with the Playbook course in the Academy, then join your first campaign.",
        href: "/academy",
      },
    });
  });

  return { ok: true };
}

/**
 * Public challenge entry — registration and first submission in one move.
 * Only campaigns flagged `publicEntry` accept it. The entry lands in the
 * Control Room queue as a SUBMITTED asset; the join request is auto-approved
 * (that's the point of a public challenge).
 */
export async function enterChallenge(input: ChallengeEntryInput): Promise<ActionResult> {
  const parsed = challengeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const campaign = await prisma.campaign.findUnique({ where: { id: data.campaignId } });
  if (!campaign || !campaign.publicEntry || campaign.status !== "LIVE") {
    return { ok: false, error: "This challenge isn't open for public entries" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "You already have an account — sign in and submit from your dashboard instead",
    };
  }

  const passwordHash = await hash(data.password, 10);
  const banked = Math.min(Math.max(0, data.escrowMiles ?? 0), POINTS.SIDE_QUEST_CAP);
  const startingMiles = POINTS.SIGNUP + banked;

  await prisma.$transaction(async (tx) => {
    const creator = await tx.creator.create({
      data: {
        name: data.name,
        email,
        handles: JSON.stringify({ [data.primaryPlatform]: data.handle }),
        primaryPlatform: data.primaryPlatform,
        followerTier: "NANO",
        region: data.region,
        category: "GROOMING",
        collabType: "BOTH",
        status: "PROSPECT",
        tags: JSON.stringify(["challenge-entry"]),
        points: startingMiles,
        lifetimePoints: startingMiles,
      },
    });
    await tx.pointsEvent.create({
      data: { creatorId: creator.id, type: "SIGNUP", points: POINTS.SIGNUP, note: "Joined via The Menz Makeover Challenge" },
    });
    if (banked > 0) {
      await tx.pointsEvent.create({
        data: { creatorId: creator.id, type: "SIDE_QUEST", points: banked, note: "Side quests cleared as a guest — escrow banked" },
      });
    }
    await tx.joinRequest.create({
      data: {
        creatorId: creator.id,
        campaignId: campaign.id,
        type: "JOIN",
        status: "APPROVED",
        proposedTerms: "Public challenge entry",
      },
    });
    await tx.asset.create({
      data: {
        creatorId: creator.id,
        campaignId: campaign.id,
        type: "REEL",
        url: data.entryUrl,
        caption: data.caption,
        status: "SUBMITTED",
      },
    });
    const user = await tx.user.create({
      data: { email, passwordHash, role: "CREATOR", name: data.name, creatorId: creator.id },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        title: `You're in the ${campaign.name} 💪 +${startingMiles} miles`,
        body: "Your entry is with the judges. An approval stamps it and banks the challenge miles — watch this space.",
        href: "/me",
      },
    });
  });

  return { ok: true };
}
