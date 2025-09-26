import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

// POST /api/grade
// body: { submission_id, grader_id }
// Calculates score by comparing submitted choice_id to choices.is_correct
export async function POST(req) {
  try {
    const { submission_id, grader_id } = await req.json();
    if (!submission_id)
      return NextResponse.json(
        { error: "submission_id required" },
        { status: 400 }
      );

    // Load answers for the submission joined with choices to determine correctness
    const { data: rows, error: rowsErr } = await supabaseAdmin
      .from("answers")
      .select("*, choices(is_correct, question_id)")
      .eq("submission_id", submission_id);
    if (rowsErr)
      return NextResponse.json({ error: rowsErr.message }, { status: 500 });

    // Score calculation: count correct choices / total points (sum question points)
    // For simplicity, treat each question as 1 point (the schema has points on questions if needed later)
    let totalPoints = 0;
    let earned = 0;
    for (const a of rows) {
      totalPoints += 1;
      const isCorrect = a.choices && a.choices.is_correct;
      if (isCorrect) earned += 1;
    }

    const score = totalPoints === 0 ? 0 : (earned / totalPoints) * 100;

    // Insert grade record
    const { data: grade, error: gradeErr } = await supabaseAdmin
      .from("grades")
      .insert([
        {
          submission_id,
          grader_id: grader_id || null,
          points: score,
          feedback: `Auto-graded: ${earned}/${totalPoints}`,
        },
      ])
      .select()
      .single();
    if (gradeErr)
      return NextResponse.json({ error: gradeErr.message }, { status: 500 });

    // Update submission with score and graded flag
    const { error: updErr } = await supabaseAdmin
      .from("submissions")
      .update({ score, graded: true })
      .eq("id", submission_id);
    if (updErr)
      return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ grade, score });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
