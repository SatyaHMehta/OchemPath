import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    // Get first user with submissions
    const { data: submissions, error: submissionErr } = await supabaseAdmin
      .from("submissions")
      .select("id, user_id, quiz_id, score, created_at")
      .limit(5);

    if (submissionErr) throw submissionErr;

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ debug: "No submissions found" });
    }

    const firstSubmission = submissions[0];
    console.log("[debug] first submission:", firstSubmission);

    // Try to fetch quizzes by that quiz_id
    const { data: quiz, error: quizErr } = await supabaseAdmin
      .from("quizzes")
      .select("id, title")
      .eq("id", firstSubmission.quiz_id)
      .single();

    console.log("[debug] quiz fetch result:", {
      quiz,
      error: quizErr?.message,
    });

    return NextResponse.json({
      submissions,
      firstSubmission,
      quiz,
      quizError: quizErr?.message,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
