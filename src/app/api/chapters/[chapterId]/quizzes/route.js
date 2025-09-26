import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  const { chapterId } = params;
  try {
    const { data: quizzes, error } = await supabaseAdmin
      .from("quizzes")
      .select(
        "id, title, description, questions(id, position, text, type, points, choices(id, text, is_correct))"
      )
      .eq("chapter_id", chapterId);
    if (error) throw error;
    return new Response(JSON.stringify(quizzes || []), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching quizzes for chapter", chapterId, err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
