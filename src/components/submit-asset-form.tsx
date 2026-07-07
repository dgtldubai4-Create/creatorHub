"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitAsset } from "@/actions/assets";
import { assetSubmissionSchema, type AssetSubmissionInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ASSET_TYPES, ASSET_TYPE_LABELS } from "@/lib/constants";

export function SubmitAssetForm({ campaigns }: { campaigns: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetSubmissionInput>({
    resolver: zodResolver(assetSubmissionSchema),
    defaultValues: { campaignId: campaigns[0]?.id, type: "REEL" },
  });

  async function onSubmit(data: AssetSubmissionInput) {
    setServerError(null);
    setSuccess(false);
    const result = await submitAsset(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setSuccess(true);
    reset({ campaignId: data.campaignId, type: data.type, url: "", caption: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Campaign</Label>
        <Select {...register("campaignId")}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        {errors.campaignId && <p className="text-xs text-red-600">{errors.campaignId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Asset type</Label>
        <Select {...register("type")}>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {ASSET_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Content URL</Label>
        <Input {...register("url")} placeholder="https://instagram.com/reel/…" />
        {errors.url && <p className="text-xs text-red-600">{errors.url.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Caption</Label>
        <Textarea
          {...register("caption")}
          placeholder="The caption you plan to publish with — include #ad and campaign hashtags."
          rows={4}
        />
        {errors.caption && <p className="text-xs text-red-600">{errors.caption.message}</p>}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}
      {success && (
        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" /> Submitted! Track it on your My Status page.
        </motion.p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit for review
      </Button>
    </form>
  );
}
