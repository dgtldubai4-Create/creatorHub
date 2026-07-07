"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animated state tracker: Submitted → Under Review → Approved/Rejected → Live.
 * Rejection short-circuits the flow at the decision step.
 */
export function AssetTracker({ status }: { status: string }) {
  const rejected = status === "REJECTED";
  const steps = [
    { key: "SUBMITTED", label: "Submitted" },
    { key: "UNDER_REVIEW", label: "Under Review" },
    { key: "DECISION", label: rejected ? "Rejected" : "Approved" },
    { key: "LIVE", label: "Live" },
  ];

  const progressIndex: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 1,
    APPROVED: 2,
    REJECTED: 2,
    LIVE: 3,
  };
  const current = progressIndex[status] ?? 0;

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const reached = i <= current;
        const isDecision = step.key === "DECISION";
        const failed = rejected && isDecision;
        const isCurrent = i === current;

        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className="relative mx-1 h-0.5 w-6 overflow-hidden rounded-full bg-slate-200 sm:w-10">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i <= current ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  style={{ originX: 0 }}
                  className={cn(
                    "absolute inset-0",
                    rejected && i >= 2 ? "bg-red-400" : "bg-dabur-500",
                  )}
                />
              </div>
            )}
            <div className="flex flex-col items-center gap-1">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12, type: "spring", bounce: 0.4 }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 transition-shadow",
                  failed && reached
                    ? "bg-red-500 text-white ring-red-200"
                    : reached
                      ? "bg-dabur-600 text-white ring-dabur-200"
                      : "bg-white text-slate-400 ring-slate-200",
                  isCurrent && !failed && status === "LIVE" && "animate-pulse-ring",
                )}
              >
                {reached ? (
                  failed ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )
                ) : (
                  i + 1
                )}
              </motion.span>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px] font-medium",
                  failed && reached
                    ? "text-red-600"
                    : reached
                      ? "text-dabur-700"
                      : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
