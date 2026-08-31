"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema, type SignupInput } from "@/lib/validators";
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
        points: POINTS.SIGNUP,
        lifetimePoints: POINTS.SIGNUP,
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
        title: `Welcome to DaburStars 🌱 +${POINTS.SIGNUP} pts`,
        body: "Your welcome points are banked. Start with the Playbook course in the Academy, then join your first launch.",
        href: "/academy",
      },
    });
  });

  return { ok: true };
}
