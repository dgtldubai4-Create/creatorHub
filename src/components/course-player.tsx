"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Loader2, PartyPopper, RotateCcw } from "lucide-react";
import { completeLesson, submitQuiz, type QuizResult } from "@/actions/academy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/program";

const EASE = [0.23, 1, 0.32, 1] as const;

type QuizQuestionPublic = { question: string; options: string[] }; // answers stay server-side

export function CoursePlayer({
  courseId,
  lessons,
  quiz,
  initialDone,
  alreadyCompleted,
  quizScore,
  points,
}: {
  courseId: string;
  lessons: Lesson[];
  quiz: QuizQuestionPublic[];
  initialDone: number[];
  alreadyCompleted: boolean;
  quizScore: number | null;
  points: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [done, setDone] = useState<Set<number>>(new Set(initialDone));
  const [open, setOpen] = useState<number | null>(
    initialDone.length < lessons.length
      ? lessons.findIndex((_, i) => !initialDone.includes(i))
      : null,
  );
  const [answers, setAnswers] = useState<Array<number | null>>(quiz.map(() => null));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [grading, startGrading] = useTransition();

  const allLessonsDone = done.size >= lessons.length;
  const completed = alreadyCompleted || (result?.passed ?? false);

  function markDone(index: number) {
    // Optimistic: flip locally, persist in the background.
    setDone((prev) => new Set(prev).add(index));
    const nextIdx = lessons.findIndex((_, i) => i !== index && !done.has(i));
    setOpen(nextIdx === -1 ? null : nextIdx);
    startTransition(async () => {
      await completeLesson({ courseId, lessonIndex: index });
    });
  }

  function grade() {
    if (answers.some((a) => a === null)) return;
    startGrading(async () => {
      const res = await submitQuiz({ courseId, answers: answers as number[] });
      setResult(res);
      if (res.ok && res.passed) router.refresh();
    });
  }

  function retake() {
    setAnswers(quiz.map(() => null));
    setResult(null);
  }

  return (
    <div className="space-y-8">
      {/* Lessons */}
      <section className="space-y-3">
        {lessons.map((lesson, i) => {
          const isDone = done.has(i);
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={cn(
                "overflow-hidden rounded-2xl border bg-white transition-colors",
                isDone ? "border-emerald-200" : "border-dabur-100",
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200",
                    isDone ? "bg-emerald-500 text-white" : "bg-dabur-100 text-dabur-700",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="flex-1 font-semibold text-dabur-900">{lesson.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out-strong",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                  >
                    <div className="border-t border-dabur-50 px-5 py-4 pl-[4.25rem]">
                      <p className="text-sm leading-relaxed text-muted-foreground">{lesson.body}</p>
                      {!isDone && (
                        <Button size="sm" className="mt-4" onClick={() => markDone(i)} disabled={pending}>
                          <Check className="h-3.5 w-3.5" /> Mark as read
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      {/* Quiz */}
      <section
        className={cn(
          "rounded-3xl border p-6 transition-colors",
          completed
            ? "border-emerald-200 bg-emerald-50/50"
            : allLessonsDone
              ? "border-amber-200 bg-amber-50/50"
              : "border-dashed border-dabur-200 bg-dabur-50/30",
        )}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dabur-900">Knowledge check</h2>
          {completed && quizScore != null && !result && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Passed · {quizScore}%
            </span>
          )}
        </div>

        {!allLessonsDone ? (
          <p className="text-sm text-muted-foreground">
            Finish the lessons above to unlock the quiz — passing banks{" "}
            <strong className="text-amber-700">+{points} points</strong>.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {completed
                ? "You've already banked the points — retake it any time to beat your score."
                : `Pass (2 of ${quiz.length} or better) to bank +${points} points.`}
            </p>

            <div className="mt-5 space-y-6">
              {quiz.map((q, qi) => (
                <fieldset key={qi}>
                  <legend className="mb-2.5 text-sm font-semibold text-dabur-900">
                    {qi + 1}. {q.question}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((option, oi) => {
                      const selected = answers[qi] === oi;
                      const showResult = result?.correct != null;
                      const wasCorrect = showResult && selected && result.correct![qi];
                      const wasWrong = showResult && selected && !result.correct![qi];
                      return (
                        <button
                          key={oi}
                          disabled={grading || (result?.passed ?? false)}
                          onClick={() => {
                            setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
                            if (result && !result.passed) setResult(null);
                          }}
                          className={cn(
                            "press rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-colors",
                            wasCorrect
                              ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                              : wasWrong
                                ? "border-red-300 bg-red-50 text-red-900"
                                : selected
                                  ? "border-dabur-500 bg-dabur-50 text-dabur-900 ring-1 ring-dabur-500"
                                  : "border-dabur-100 bg-white text-dabur-800 hover:border-dabur-300",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              {!result?.passed && (
                <Button onClick={grade} disabled={grading || answers.some((a) => a === null)}>
                  {grading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit answers
                </Button>
              )}
              {result && !result.passed && (
                <Button variant="outline" onClick={retake}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              )}
            </div>

            <AnimatePresence>
              {result?.ok && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className={cn(
                    "mt-5 flex items-center gap-3 rounded-2xl border px-5 py-4",
                    result.passed
                      ? "border-emerald-300 bg-emerald-100/70 text-emerald-900"
                      : "border-amber-300 bg-amber-100/70 text-amber-900",
                  )}
                >
                  {result.passed ? (
                    <PartyPopper className="h-6 w-6 shrink-0 text-emerald-600" />
                  ) : (
                    <RotateCcw className="h-6 w-6 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {result.passed
                        ? result.pointsAwarded && result.pointsAwarded > 0
                          ? `Passed with ${result.score}% — +${result.pointsAwarded} points banked!`
                          : `Passed with ${result.score}%.`
                        : `${result.score}% — not quite. Review the highlighted answers and try again.`}
                    </p>
                  </div>
                </motion.div>
              )}
              {result && !result.ok && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>
              )}
            </AnimatePresence>
          </>
        )}
      </section>
    </div>
  );
}
