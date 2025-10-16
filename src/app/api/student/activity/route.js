import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getClientForRequest() {
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
    // Resolve current user via a client using cookie session
    const client = getClientForRequest();
    const { data: sess } = await client.auth.getUser();
    const userId = qpUser || sess?.user?.id;
    if (!userId) return NextResponse.json({ activity: [] });

    // Fetch submissions with quiz data
    const { data, error } = await supabaseAdmin
      .from("submissions")
      .select(`id, started_at, finished_at, score, quiz_id`)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    // Fetch quiz details for all quiz_ids
    const quizIds = [
      ...new Set((data || []).map((s) => s.quiz_id).filter(Boolean)),
    ];
    let quizzesMap = {};
    if (quizIds.length > 0) {
      const { data: quizzes, error: quizErr } = await supabaseAdmin
        .from("quizzes")
        .select("id, title, chapter_id, course_id")
        .in("id", quizIds);
      if (!quizErr && quizzes) {
        quizzesMap = Object.fromEntries(quizzes.map((q) => [q.id, q]));
      }
    }

    // Fetch chapter details for all chapter_ids
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
        .select("id, title, position, course_id")
        .in("id", chapterIds);
      if (!chapErr && chapters) {
        chaptersMap = Object.fromEntries(chapters.map((c) => [c.id, c]));
      }
    }

    // Fetch course details - get ALL course IDs from quizzes and chapters
    const courseIdsFromQuizzes = Object.values(quizzesMap)
      .map((q) => q.course_id)
      .filter(Boolean);
    const courseIdsFromChapters = Object.values(chaptersMap)
      .map((c) => c.course_id)
      .filter(Boolean);
    const courseIds = [
      ...new Set([...courseIdsFromQuizzes, ...courseIdsFromChapters]),
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
    const activity = (data || []).map((s) => {
      const scoreNum =
        s?.score !== null && s?.score !== undefined ? Number(s.score) : null;
      const hasScore = Number.isFinite(scoreNum);
      const quiz = quizzesMap[s.quiz_id];
      const chapter = quiz?.chapter_id ? chaptersMap[quiz.chapter_id] : null;

      // Get course - either from chapter or directly from quiz
      let course = null;
      if (chapter && chapter.course_id) {
        course = coursesMap[chapter.course_id];
      }
      if (!course && quiz?.course_id) {
        course = coursesMap[quiz.course_id];
      }

      // Build title: "Course Title — Chapter Position: Quiz Title"
      let title = quiz?.title || "Quiz";
      let courseName = course?.title;

      // If we have a chapter but no course name, use chapter title as fallback
      if (!courseName && chapter) {
        courseName = chapter.title;
      }

      if (chapter && courseName) {
        title = `${courseName} — Chapter ${chapter.position}: ${title}`;
      } else if (courseName) {
        title = `${courseName} — ${title}`;
      }

      return {
        kind: "quiz",
        title,
        meta: hasScore ? `Score: ${Math.round(scoreNum)}%` : "Submitted",
        when: s.finished_at || s.started_at,
      };
    });
    return NextResponse.json({ activity });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
