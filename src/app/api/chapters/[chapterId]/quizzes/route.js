import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  const { chapterId } = params;
  try {
    const url = new URL(req.url);
    const practiceParam = url.searchParams.get("practice"); // 'true' | 'false' | null

    let builder = supabaseAdmin
      .from("quizzes")
      .select(
        "id, title, description, questions(id, position, text, type, points, image, published, choices(id, text, is_correct, image_url))"
      )
      .eq("chapter_id", chapterId);

    if (practiceParam === "true") builder = builder.eq("is_practice", true);
    if (practiceParam === "false") builder = builder.eq("is_practice", false);

    const { data: quizzes, error } = await builder;
    if (error) throw error;

    // Filter questions to only include published ones for student-facing pages
    const filteredQuizzes =
      quizzes?.map((quiz) => ({
        ...quiz,
        questions:
          quiz.questions
            ?.filter((question) => question.published === true)
            .map((question) => ({
              ...question,
              image_url: question.image, // Map database 'image' to expected 'image_url'
              image: undefined, // Remove original field
              choices:
                question.choices?.map((choice) => ({
                  ...choice,
                  // Choice image_url is already in the data from database query
                })) || [],
            })) || [],
      })) || [];

    return new Response(JSON.stringify(filteredQuizzes || []), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
