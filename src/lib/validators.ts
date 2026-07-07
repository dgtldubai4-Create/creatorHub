import { z } from "zod";
import {
  ASSET_TYPES,
  CATEGORIES,
  COLLAB_TYPES,
  PLATFORMS,
  REGIONS,
} from "@/lib/constants";

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
});
export type SignupInput = z.infer<typeof signupSchema>;

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
