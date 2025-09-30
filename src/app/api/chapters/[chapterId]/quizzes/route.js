import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  const { chapterId } = params;
  try {
    const url = new URL(req.url);
    const practiceParam = url.searchParams.get("practice"); // 'true' | 'false' | null

    let builder = supabaseAdmin
      .from("quizzes")
      .select(
        "id, title, description, questions(id, position, text, type, points, image, published, choices(id, text, is_correct))"
      )
      .eq("chapter_id", chapterId);

    if (practiceParam === "true") builder = builder.eq("is_practice", true);
    if (practiceParam === "false") builder = builder.eq("is_practice", false);

    const { data: quizzes, error } = await builder;
    if (error) throw error;

    // Filter questions to only include published ones for student-facing pages
    const filteredQuizzes = quizzes?.map(quiz => ({
      ...quiz,
      questions: quiz.questions?.filter(question => question.published === true) || []
    })) || [];

    // Debug logging: show how many quizzes and how many questions each has
    try {
      console.log(
        `API: /api/chapters/${chapterId}/quizzes returned ${
          Array.isArray(filteredQuizzes) ? filteredQuizzes.length : 0
        } quizzes`
      );
      if (Array.isArray(filteredQuizzes) && filteredQuizzes.length > 0) {
        filteredQuizzes.forEach((q, idx) => {
          console.log(
            `quiz[${idx}].id=${q.id} title=${q.title} questions=${
              Array.isArray(q.questions) ? q.questions.length : 0
            } (published only)`
          );
        });
        console.log("first quiz sample:", JSON.stringify(filteredQuizzes[0], null, 2));
      }
    } catch (logErr) {
      console.warn("Failed to log quizzes debug info", logErr);
    }

    return new Response(JSON.stringify(filteredQuizzes || []), {
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
