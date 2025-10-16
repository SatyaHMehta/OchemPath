import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    // Fetch all courses with their quiz counts
    const { data: courses, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id, title");
    if (courseErr) throw courseErr;

    // For each course, count total quizzes
    const courseStats = {};
    for (const course of courses || []) {
      const { count, error: countErr } = await supabaseAdmin
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id);

      if (!countErr) {
        courseStats[course.id] = {
          id: course.id,
          title: course.title,
          totalQuizzes: count || 0,
        };
      }
    }

    return NextResponse.json({ courseStats });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
