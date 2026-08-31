import Link from "next/link";
import { CheckCircle2, Clock, Coins, GraduationCap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/shell";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import { parseJson, parseNumberList } from "@/lib/constants";
import {
  COURSE_LEVEL_LABELS,
  formatPoints,
  type CourseLevel,
} from "@/lib/program";

export const dynamic = "force-dynamic";

const LEVEL_TONES: Record<CourseLevel, string> = {
  FOUNDATION: "bg-emerald-100 text-emerald-800",
  INTERMEDIATE: "bg-sky-100 text-sky-800",
  ADVANCED: "bg-amber-100 text-amber-800",
};

export default async function AcademyPage() {
  const session = await auth();
  if (!session?.user?.creatorId) return null;
  const creatorId = session.user.creatorId;

  const [courses, progress] = await Promise.all([
    prisma.course.findMany({ orderBy: { order: "asc" } }),
    prisma.courseProgress.findMany({ where: { creatorId } }),
  ]);
  const progressByCourse = new Map(progress.map((p) => [p.courseId, p]));

  const completedCount = progress.filter((p) => p.completedAt !== null).length;
  const totalPoints = courses.reduce((sum, c) => sum + c.points, 0);
  const earnedPoints = courses
    .filter((c) => progressByCourse.get(c.id)?.completedAt)
    .reduce((sum, c) => sum + c.points, 0);

  return (
    <Shell>
      <FadeUp>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-dabur-900">
              Creator <span className="text-gradient-green">Academy</span>
            </h1>
            <p className="mt-1 max-w-xl text-muted-foreground">
              Short courses written with Dabur&apos;s regional teams. Every completion banks points
              before you post a single frame.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-dabur-100 bg-white px-5 py-3 text-sm shadow-sm">
            <span className="flex items-center gap-2 font-semibold text-dabur-800">
              <GraduationCap className="h-4 w-4 text-dabur-600" />
              {completedCount}/{courses.length} complete
            </span>
            <span className="h-4 w-px bg-dabur-100" />
            <span className="flex items-center gap-2 font-semibold text-amber-700">
              <Coins className="h-4 w-4" />
              {formatPoints(earnedPoints)}/{formatPoints(totalPoints)} pts
            </span>
          </div>
        </div>
      </FadeUp>

      <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" delayChildren={0.1}>
        {courses.map((course) => {
          const p = progressByCourse.get(course.id);
          const lessonCount = parseJson<unknown[]>(course.lessons, []).length;
          const lessonsDone = p ? parseNumberList(p.completedLessons).length : 0;
          const completed = p?.completedAt != null;
          const pct = completed ? 100 : Math.round((lessonsDone / Math.max(1, lessonCount)) * 100);

          return (
            <StaggerItem key={course.id}>
              <Link
                href={`/academy/${course.slug}`}
                className="glass-card card-lift group flex h-full flex-col p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="text-4xl">{course.emoji}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_TONES[course.level as CourseLevel] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {COURSE_LEVEL_LABELS[course.level as CourseLevel] ?? course.level}
                  </span>
                </div>
                <h3 className="font-semibold text-dabur-900 group-hover:text-dabur-700">
                  {course.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {course.summary}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {course.minutes} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700">
                    <Coins className="h-3.5 w-3.5" /> +{course.points} pts
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-dabur-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-out-strong ${completed ? "bg-emerald-500" : "bg-dabur-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium">
                    {completed ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        {p?.quizScore != null ? ` · quiz ${p.quizScore}%` : ""}
                      </span>
                    ) : lessonsDone > 0 ? (
                      <span className="text-dabur-600">
                        {lessonsDone}/{lessonCount} lessons — keep going
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not started</span>
                    )}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Shell>
  );
}
