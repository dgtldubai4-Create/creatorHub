"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseJson, parseNumberList } from "@/lib/constants";
import type { QuizQuestion } from "@/lib/program";
import type { ActionResult } from "@/actions/signup";

const PASS_THRESHOLD = 67; // percent

const lessonSchema = z.object({
  courseId: z.string().min(1),
  lessonIndex: z.number().int().min(0).max(50),
});

/** Mark one lesson as read for the signed-in creator. */
export async function completeLesson(input: z.infer<typeof lessonSchema>): Promise<ActionResult> {
  const session = await requireRole("CREATOR");
  const creatorId = session.user.creatorId;
  if (!creatorId) return { ok: false, error: "No creator profile linked to this account" };

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return { ok: false, error: "Course not found" };
  const lessonCount = parseJson<unknown[]>(course.lessons, []).length;
  if (parsed.data.lessonIndex >= lessonCount) return { ok: false, error: "Invalid lesson" };

  const existing = await prisma.courseProgress.findUnique({
    where: { creatorId_courseId: { creatorId, courseId: course.id } },
  });
  const done = new Set(existing ? parseNumberList(existing.completedLessons) : []);
  done.add(parsed.data.lessonIndex);
  const completedLessons = JSON.stringify(Array.from(done).sort((a, b) => a - b));

  await prisma.courseProgress.upsert({
    where: { creatorId_courseId: { creatorId, courseId: course.id } },
    create: { creatorId, courseId: course.id, completedLessons },
    update: { completedLessons },
  });

  revalidatePath("/academy");
  return { ok: true };
}

const quizSchema = z.object({
  courseId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(10)).max(20),
});

export type QuizResult = ActionResult & {
  score?: number;
  passed?: boolean;
  pointsAwarded?: number;
  correct?: boolean[];
};

/**
 * Grade the quiz server-side (answers never reach the client). A pass marks
 * the course complete and awards its points exactly once.
 */
export async function submitQuiz(input: z.infer<typeof quizSchema>): Promise<QuizResult> {
  const session = await requireRole("CREATOR");
  const creatorId = session.user.creatorId;
  if (!creatorId) return { ok: false, error: "No creator profile linked to this account" };

  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return { ok: false, error: "Course not found" };

  const quiz = parseJson<QuizQuestion[]>(course.quiz, []);
  if (parsed.data.answers.length !== quiz.length) {
    return { ok: false, error: "Answer every question before submitting" };
  }

  const correct = quiz.map((q, i) => q.answer === parsed.data.answers[i]);
  const score = Math.round((correct.filter(Boolean).length / quiz.length) * 100);
  const passed = score >= PASS_THRESHOLD;

  const existing = await prisma.courseProgress.findUnique({
    where: { creatorId_courseId: { creatorId, courseId: course.id } },
  });
  const alreadyCompleted = existing?.completedAt != null;
  let pointsAwarded = 0;

  await prisma.$transaction(async (tx) => {
    await tx.courseProgress.upsert({
      where: { creatorId_courseId: { creatorId, courseId: course.id } },
      create: {
        creatorId,
        courseId: course.id,
        completedLessons: existing?.completedLessons ?? "[]",
        quizScore: score,
        completedAt: passed ? new Date() : null,
      },
      update: {
        quizScore: alreadyCompleted ? Math.max(existing?.quizScore ?? 0, score) : score,
        ...(passed && !alreadyCompleted ? { completedAt: new Date() } : {}),
      },
    });

    if (passed && !alreadyCompleted) {
      pointsAwarded = course.points;
      await tx.pointsEvent.create({
        data: {
          creatorId,
          type: "COURSE_COMPLETED",
          points: course.points,
          note: course.title,
        },
      });
      await tx.creator.update({
        where: { id: creatorId },
        data: {
          points: { increment: course.points },
          lifetimePoints: { increment: course.points },
        },
      });
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: `Course complete: ${course.title} 🎓`,
          body: `+${course.points} points banked. Keep the streak going in the Academy.`,
          href: "/academy",
        },
      });
    }
  });

  revalidatePath("/academy");
  revalidatePath("/");
  return { ok: true, score, passed, pointsAwarded, correct };
}
