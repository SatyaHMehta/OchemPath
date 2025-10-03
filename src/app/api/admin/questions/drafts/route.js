import supabaseAdmin from "@/lib/supabaseServer";

// DELETE /api/admin/questions/drafts?quiz_id=...  OR  chapter_id=...
// Removes all draft questions (rows where draft_of IS NOT NULL) for the specified quiz.
// If only chapter_id is provided, we resolve (or create) the practice quiz first.

async function ensureQuizForChapter(chapterId, isPractice = true) {
  const { data: existing } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("is_practice", !!isPractice)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const title = isPractice ? "Practice Quiz" : "Chapter Quiz";
  const description = isPractice
    ? "Auto-created practice quiz"
    : "Auto-created chapter quiz";
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .insert({
      chapter_id: chapterId,
      title,
      description,
      is_practice: !!isPractice,
    })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data.id;
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    let quizId = url.searchParams.get("quiz_id");
    const chapterId = url.searchParams.get("chapter_id");
    const isPracticeParam = url.searchParams.get("is_practice");
    const isPractice =
      isPracticeParam === null ? true : isPracticeParam === "true";

    if (!quizId) {
      if (!chapterId) {
        return new Response(
          JSON.stringify({ error: "quiz_id or chapter_id required" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
      quizId = await ensureQuizForChapter(chapterId, isPractice);
    }

    // Bulk delete drafts (draft_of IS NOT NULL)
    const { error, count } = await supabaseAdmin
      .from("questions")
      .delete({ count: "exact" })
      .eq("quiz_id", quizId)
      .not("draft_of", "is", null);

    if (error) throw error;

    return new Response(
      JSON.stringify({ deleted: count || 0, success: true }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
