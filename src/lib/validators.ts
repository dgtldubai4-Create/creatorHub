import { z } from "zod";
import {
  ASSET_TYPES,
  BRANDS,
  CAMPAIGN_STATUSES,
  CATEGORIES,
  COLLAB_TYPES,
  CREATOR_STATUSES,
  FOLLOWER_TIERS,
  PLATFORMS,
  REGIONS,
} from "@/lib/constants";
import { PROGRAM_TIERS, REWARD_CATEGORIES } from "@/lib/program";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  primaryPlatform: z.enum(PLATFORMS),
  handle: z
    .string()
    .min(2, "Handle is required")
    .max(60)
    .transform((h) => (h.startsWith("@") ? h : `@${h}`)),
  region: z.enum(REGIONS),
  category: z.enum(CATEGORIES),
  collabType: z.enum(COLLAB_TYPES),
  // Guest side-quest miles held in escrow; server re-caps regardless of input.
  escrowMiles: z.number().int().min(0).max(1000).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

// Public challenge entry: registration + first submission in one move.
export const challengeEntrySchema = z.object({
  campaignId: z.string().cuid(),
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  handle: z
    .string()
    .min(2, "Handle is required")
    .max(60)
    .transform((h) => (h.startsWith("@") ? h : `@${h}`)),
  primaryPlatform: z.enum(PLATFORMS),
  region: z.enum(REGIONS),
  entryUrl: z.string().url("Link your entry post (e.g. the Reel URL)"),
  caption: z.string().min(3, "Tell us about your entry").max(2200),
  escrowMiles: z.number().int().min(0).max(1000).optional(),
});
export type ChallengeEntryInput = z.infer<typeof challengeEntrySchema>;

export const joinRequestSchema = z.object({
  campaignId: z.string().cuid(),
  type: z.enum(["JOIN", "BARTER"]),
  proposedTerms: z.string().max(1000).optional(),
});
export type JoinRequestInput = z.infer<typeof joinRequestSchema>;

export const barterTermsSchema = z.object({
  campaignId: z.string().cuid(),
  deliverables: z.string().min(10, "Describe your deliverables (min 10 chars)").max(600),
  requestedPerk: z.string().min(3, "Tell us what product/perk you'd like").max(400),
});
export type BarterTermsInput = z.infer<typeof barterTermsSchema>;

export const assetSubmissionSchema = z.object({
  campaignId: z.string().cuid(),
  type: z.enum(ASSET_TYPES),
  url: z.string().url("Enter a valid URL (e.g. your Instagram post link)"),
  caption: z.string().min(3, "Caption is required").max(2200),
});
export type AssetSubmissionInput = z.infer<typeof assetSubmissionSchema>;

export const decisionSchema = z
  .object({
    id: z.string().cuid(),
    kind: z.enum(["JOIN_REQUEST", "ASSET"]),
    decision: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().max(1000).optional(),
  })
  .refine((d) => d.decision !== "REJECTED" || (d.reason && d.reason.trim().length >= 5), {
    message: "A reason (min 5 characters) is required when rejecting",
    path: ["reason"],
  });
export type DecisionInput = z.infer<typeof decisionSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── Brand-side admin ────────────────────────────────────────────────────────

export const campaignSchema = z
  .object({
    id: z.string().cuid().optional(), // present = update, absent = create
    name: z.string().min(3, "Give the campaign a name (min 3 chars)").max(120),
    brand: z.enum(BRANDS),
    region: z.enum(REGIONS),
    objective: z.string().min(10, "Describe the objective (min 10 chars)").max(600),
    tagline: z.string().max(140).optional().or(z.literal("")),
    startDate: z.coerce.date({ errorMap: () => ({ message: "Start date is required" }) }),
    endDate: z.coerce.date({ errorMap: () => ({ message: "End date is required" }) }),
    submissionDeadline: z.coerce.date().optional(),
    status: z.enum(CAMPAIGN_STATUSES),
    openToCreators: z.boolean(),
    publicEntry: z.boolean(),
    basePoints: z.coerce
      .number()
      .int()
      .min(10, "Min 10 miles per post")
      .max(1000, "Max 1,000 miles per post"),
    compensation: z.string().max(300).optional().or(z.literal("")),
    deliverables: z
      .array(
        z.object({
          type: z.enum(ASSET_TYPES),
          qty: z.coerce.number().int().min(1, "Qty ≥ 1").max(20, "Qty ≤ 20"),
          notes: z.string().max(200).optional().or(z.literal("")),
        }),
      )
      .min(1, "Add at least one deliverable")
      .max(8),
    dos: z.array(z.string().min(2).max(200)).max(10),
    donts: z.array(z.string().min(2).max(200)).max(10),
    kpis: z.array(z.object({ metric: z.string().min(1).max(40), target: z.string().min(1).max(40) })).max(8),
  })
  .refine((c) => c.endDate >= c.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  });
export type CampaignInput = z.infer<typeof campaignSchema>;

const TIER_KEYS = PROGRAM_TIERS.map((t) => t.key) as [string, ...string[]];

export const rewardSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(3, "Title required").max(80),
  description: z.string().min(5, "Description required").max(300),
  category: z.enum(REWARD_CATEGORIES),
  emoji: z.string().min(1, "Pick an emoji").max(8),
  pointsCost: z.coerce.number().int().min(50, "Min 50 MI").max(100000),
  minTier: z.enum(TIER_KEYS),
  stock: z.coerce.number().int().min(0).max(10000),
  active: z.boolean(),
});
export type RewardInput = z.infer<typeof rewardSchema>;

export const creatorAdminSchema = z.object({
  creatorId: z.string().cuid(),
  status: z.enum(CREATOR_STATUSES).optional(),
  followerTier: z.enum(FOLLOWER_TIERS).optional(),
});
export type CreatorAdminInput = z.infer<typeof creatorAdminSchema>;
