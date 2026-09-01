import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp } from "@/components/motion";
import { CoursePlayer } from "@/components/course-player";
import { parseJson, parseNumberList } from "@/lib/constants";
import {
  COURSE_LEVEL_LABELS,
  type CourseLevel,
  type Lesson,
  type QuizQuestion,
} from "@/lib/program";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.creatorId) return null;

  const course = await prisma.course.findUnique({ where: { slug: params.slug } });
  if (!course) notFound();

  const progress = await prisma.courseProgress.findUnique({
    where: {
      creatorId_courseId: { creatorId: session.user.creatorId, courseId: course.id },
    },
  });

  const lessons = parseJson<Lesson[]>(course.lessons, []);
  const quiz = parseJson<QuizQuestion[]>(course.quiz, []);
  // Answers never leave the server — grading happens in the submitQuiz action.
  const quizPublic = quiz.map(({ question, options }) => ({ question, options }));

  return (
    <Shell>
      <FadeUp>
        <Link
          href="/academy"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-dabur-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Academy
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{course.emoji}</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-dabur-900">{course.title}</h1>
              <p className="mt-1 max-w-xl text-muted-foreground">{course.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-dabur-100 px-3 py-1 font-semibold text-dabur-800">
                  {COURSE_LEVEL_LABELS[course.level as CourseLevel] ?? course.level}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" /> {course.minutes} min
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Coins className="h-4 w-4" /> +{course.points} MI on completion
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.1}>
        <CoursePlayer
          courseId={course.id}
          lessons={lessons}
          quiz={quizPublic}
          initialDone={progress ? parseNumberList(progress.completedLessons) : []}
          alreadyCompleted={progress?.completedAt != null}
          quizScore={progress?.quizScore ?? null}
          points={course.points}
        />
      </FadeUp>
    </Shell>
  );
}
