"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { enterChallenge } from "@/actions/signup";
import { challengeEntrySchema, type ChallengeEntryInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Stamp } from "@/components/game/stamp";
import { confettiBurst } from "@/lib/confetti";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  REGIONS,
  REGION_FLAGS,
  REGION_LABELS,
} from "@/lib/constants";

/**
 * Entry = registration. One form creates the account, joins the challenge and
 * submits the entry into the Control Room queue.
 */
export function ChallengeEntryForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [escrow, setEscrow] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChallengeEntryInput>({
    resolver: zodResolver(challengeEntrySchema),
    defaultValues: { campaignId, primaryPlatform: "TIKTOK", region: "UAE", escrowMiles: 0 },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ds_escrow");
      if (!raw) return;
      const miles = Math.max(0, Math.floor(JSON.parse(raw)?.miles ?? 0));
      if (miles > 0) {
        setEscrow(miles);
        setValue("escrowMiles", miles);
      }
    } catch {
      /* ignore */
    }
  }, [setValue]);

  async function onSubmit(data: ChallengeEntryInput) {
    setServerError(null);
    const result = await enterChallenge(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    try {
      localStorage.removeItem("ds_escrow");
    } catch {
      /* ignore */
    }
    setDone(true);
    confettiBurst(undefined, undefined, 120);
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setTimeout(() => {
      router.push("/me");
      router.refresh();
    }, 1800);
  }

  const err = (name: keyof ChallengeEntryInput) =>
    errors[name] && (
      <p className="text-xs font-semibold text-stampred" role="alert">
        {errors[name]?.message}
      </p>
    );

  if (done) {
    return (
      <div className="py-14 text-center">
        <Stamp tone="green" slam shape="round" className="mx-auto h-28 w-28 text-sm">
          ENTRY
          <br />
          RECEIVED
        </Stamp>
        <h3 className="mt-5 font-game text-2xl font-extrabold text-dabur-900">
          You&apos;re in — and you have an account now.
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your entry is with the judges. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {escrow > 0 && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-mango bg-tang-soft px-4 py-3">
          <span aria-hidden className="text-xl">🎟️</span>
          <p className="text-sm text-inkbrown">
            <strong className="font-game">{escrow} escrowed miles</strong> come with you — entering
            banks them on top of your 50 welcome miles.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ce-name">Your name</Label>
          <Input id="ce-name" {...register("name")} placeholder="Omar Farouk" autoComplete="name" />
          {err("name")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-handle">Main handle</Label>
          <Input id="ce-handle" {...register("handle")} placeholder="@yourhandle" />
          {err("handle")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ce-email">Email</Label>
          <Input id="ce-email" {...register("email")} type="email" placeholder="you@example.com" autoComplete="email" />
          {err("email")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-password">Choose a password</Label>
          <Input id="ce-password" {...register("password")} type="password" placeholder="Min 8 characters" autoComplete="new-password" />
          {err("password")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ce-platform">Where did you post it?</Label>
          <Select id="ce-platform" {...register("primaryPlatform")}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-region">Your market</Label>
          <Select id="ce-region" {...register("region")}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {REGION_FLAGS[r]} {REGION_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ce-url">Link to your entry</Label>
        <Input id="ce-url" {...register("entryUrl")} placeholder="https://tiktok.com/@you/video/…" inputMode="url" />
        {err("entryUrl")}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ce-caption">Tell the judges about it</Label>
        <Textarea
          id="ce-caption"
          {...register("caption")}
          placeholder="3 weeks of growth, one jar of paste, zero filters on the after."
        />
        {err("caption")}
      </div>

      {serverError && (
        <p className="rounded-lg bg-stampred-soft px-3 py-2 text-sm font-semibold text-stampred" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-3d flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base disabled:pointer-events-none disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dabur-600"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Submit my entry — and create my account
      </button>
      <p className="text-center text-xs text-muted-foreground">
        One form, both things. Judges review weekly; an approval stamps your entry and banks the
        challenge miles.
      </p>
    </form>
  );
}
