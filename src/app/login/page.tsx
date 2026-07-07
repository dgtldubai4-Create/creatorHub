"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { label: "Creator", email: "layla@creators.example" },
  { label: "Marketer (UAE)", email: "marketer.uae@dabur.example" },
  { label: "Brand Lead", email: "brandlead@dabur.example" },
  { label: "Admin", email: "admin@dabur.example" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(searchParams.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-dabur-100">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/60"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-dabur-100">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-white/20 bg-white/10 text-white placeholder:text-dabur-200/60"
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100"
        >
          {error}
        </motion.p>
      )}
      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Sign in
      </Button>

      <div className="pt-2">
        <p className="mb-2 text-center text-xs uppercase tracking-widest text-dabur-200/70">
          Demo accounts · password <span className="font-mono font-bold">dabur2026</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("dabur2026");
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-dabur-100 transition-all hover:border-amber-300/50 hover:bg-white/15"
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="hero-surface relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* floating ambient blobs */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 animate-float-slow rounded-full bg-dabur-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 animate-float rounded-full bg-amber-400/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="glass relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.7, bounce: 0.5 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-dabur-400 to-dabur-700 shadow-xl shadow-dabur-500/40"
          >
            <Leaf className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white">
            Dabur <span className="text-gradient-brand">Creator Hub</span>
          </h1>
          <p className="mt-2 text-sm text-dabur-200">
            Campaigns, collabs & approvals for the Middle East
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-dabur-200">
          New creator?{" "}
          <Link href="/signup" className="font-semibold text-amber-300 hover:underline">
            Join the hub →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
