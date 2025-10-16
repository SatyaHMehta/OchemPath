import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: cookies().get("sb-access-token")?.value
          ? `Bearer ${cookies().get("sb-access-token")?.value}`
          : undefined,
      },
    },
  });
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const qpUser = url.searchParams.get("userId");
    const client = getClient();
    const { data: auth } = await client.auth.getUser();
    const userId = qpUser || auth?.user?.id;
    if (!userId) return NextResponse.json({ courses: [] });

    // Aggregate submissions by course->quiz
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(`id, started_at, score, quiz_id`)
      .eq("user_id", userId)
      .order("started_at", { ascending: false });
    if (error) throw error;

    // Fetch quiz details
    const quizIds = [
      ...new Set((data || []).map((s) => s.quiz_id).filter(Boolean)),
    ];
    let quizzesMap = {};
    if (quizIds.length > 0) {
      const { data: quizzes, error: quizErr } = await supabaseAdmin
        .from("quizzes")
        .select("id, title, course_id, chapter_id")
        .in("id", quizIds);
      if (!quizErr && quizzes) {
        quizzesMap = Object.fromEntries(quizzes.map((q) => [q.id, q]));
      }
    }

    // Fetch chapter details
    const chapterIds = [
      ...new Set(
        Object.values(quizzesMap)
          .map((q) => q.chapter_id)
          .filter(Boolean)
      ),
    ];
    let chaptersMap = {};
    if (chapterIds.length > 0) {
      const { data: chapters, error: chapErr } = await supabaseAdmin
        .from("chapters")
        .select("id, title, position")
        .in("id", chapterIds);
      if (!chapErr && chapters) {
        chaptersMap = Object.fromEntries(chapters.map((c) => [c.id, c]));
      }
    }

    // Fetch course details
    const courseIds = [
      ...new Set(
        Object.values(quizzesMap)
          .map((q) => q.course_id)
          .filter(Boolean)
      ),
    ];
    let coursesMap = {};
    if (courseIds.length > 0) {
      const { data: courses, error: courseErr } = await supabaseAdmin
        .from("courses")
        .select("id, title")
        .in("id", courseIds);
      if (!courseErr && courses) {
        coursesMap = Object.fromEntries(courses.map((c) => [c.id, c]));
      }
    }

    const byCourse = new Map();
    for (const s of data || []) {
      const quiz = quizzesMap[s.quiz_id];
      const course = quiz ? coursesMap[quiz.course_id] : null;
      const chapter = quiz?.chapter_id ? chaptersMap[quiz.chapter_id] : null;
      if (!course || !quiz) continue;
      if (!byCourse.has(course.id))
        byCourse.set(course.id, {
          id: course.id,
          title: course.title,
          quizzes: new Map(),
        });
      const entry = byCourse.get(course.id);

      // Build quiz title with chapter info
      let quizTitle = quiz.title;
      if (chapter) {
        quizTitle = `Chapter ${chapter.position}: ${quiz.title}`;
      }

      if (!entry.quizzes.has(quiz.id))
        entry.quizzes.set(quiz.id, {
          id: quiz.id,
          title: quizTitle,
          attempts: [],
        });
      const scoreNum =
        s?.score !== null && s?.score !== undefined ? Number(s.score) : null;
      entry.quizzes
        .get(quiz.id)
        .attempts.push({
          id: s.id,
          score: Number.isFinite(scoreNum) ? scoreNum : null,
          at: s.started_at,
        });
    }
    const courses = Array.from(byCourse.values()).map((c) => ({
      id: c.id,
      title: c.title,
      quizzes: Array.from(c.quizzes.values()),
    }));
    return NextResponse.json({ courses });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
