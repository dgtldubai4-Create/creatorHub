"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Leaf, Loader2, PartyPopper } from "lucide-react";
import { signup } from "@/actions/signup";
import { signupSchema, type SignupInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COLLAB_LABELS,
  COLLAB_TYPES,
  PLATFORMS,
  PLATFORM_LABELS,
  REGIONS,
  REGION_FLAGS,
  REGION_LABELS,
} from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      primaryPlatform: "INSTAGRAM",
      region: "UAE",
      category: "HAIR",
      collabType: "BOTH",
    },
  });

  async function onSubmit(data: SignupInput) {
    setServerError(null);
    const result = await signup(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setDone(true);
    // Log the fresh creator straight in.
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setTimeout(() => {
      router.push("/launches");
      router.refresh();
    }, 1600);
  }

  const fieldError = (name: keyof SignupInput) =>
    errors[name] && <p className="text-xs text-red-300">{errors[name]?.message}</p>;

  return (
    <div className="hero-surface relative min-h-screen overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] animate-float-slow rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 animate-float rounded-full bg-dabur-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="glass relative mx-auto w-full max-w-2xl rounded-3xl p-8 shadow-2xl"
      >
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 text-center"
          >
            <PartyPopper className="mx-auto mb-4 h-14 w-14 text-amber-300" />
            <h2 className="text-2xl font-bold text-white">Welcome to the hub! 🎉</h2>
            <p className="mt-2 text-dabur-200">
              Your creator profile is live. Taking you to the open launches…
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-lg shadow-dabur-500/40">
                <Leaf className="h-6 w-6 text-white" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white">Become a Dabur creator</h1>
                <p className="text-sm text-dabur-200">
                  Join campaigns for Amla, Vatika, Hajmola, Herb&apos;l & Real across the region.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Full name</Label>
                  <Input
                    {...register("name")}
                    placeholder="Layla Al Mansoori"
                    className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/50"
                  />
                  {fieldError("name")}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Email</Label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/50"
                  />
                  {fieldError("email")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Password</Label>
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="Min 8 characters"
                    className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/50"
                  />
                  {fieldError("password")}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Main handle</Label>
                  <Input
                    {...register("handle")}
                    placeholder="@yourhandle"
                    className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/50"
                  />
                  {fieldError("handle")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Primary platform</Label>
                  <Select
                    {...register("primaryPlatform")}
                    className="border-white/20 bg-white/10 text-white [&>option]:text-black"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Region</Label>
                  <Select
                    {...register("region")}
                    className="border-white/20 bg-white/10 text-white [&>option]:text-black"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {REGION_FLAGS[r]} {REGION_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Content category</Label>
                  <Select
                    {...register("category")}
                    className="border-white/20 bg-white/10 text-white [&>option]:text-black"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-dabur-100">Collaboration type</Label>
                  <Select
                    {...register("collabType")}
                    className="border-white/20 bg-white/10 text-white [&>option]:text-black"
                  >
                    {COLLAB_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {COLLAB_LABELS[c]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100"
                >
                  {serverError}
                </motion.p>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create my creator profile
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-dabur-200">
              Already with us?{" "}
              <Link href="/login" className="font-semibold text-amber-300 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
