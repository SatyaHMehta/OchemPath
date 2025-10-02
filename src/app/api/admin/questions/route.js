import supabaseAdmin from "@/lib/supabaseServer";

async function ensureQuizForChapter(chapterId, isPractice) {
  // Look for existing quiz of desired type
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

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const chapterId = url.searchParams.get("chapter_id");
    const draftOf = url.searchParams.get("draft_of");
    const isPracticeParam = url.searchParams.get("is_practice");
    const isPractice =
      isPracticeParam === null ? true : isPracticeParam === "true";

    // If querying for drafts of a specific question
    if (draftOf) {
      const { data: drafts, error } = await supabaseAdmin
        .from("questions")
        .select(
          "id, position, text, type, points, image, quiz_id, published, draft_of, choices(id, text, is_correct, image_url)"
        )
        .eq("draft_of", draftOf);
      if (error) throw error;

      const draftsWithMappedFields = (drafts || []).map((question) => ({
        ...question,
        image_url: question.image,
        image: undefined,
      }));

      return new Response(JSON.stringify(draftsWithMappedFields), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (!chapterId) {
      return new Response(
        JSON.stringify({ error: "chapter_id query required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    // Ensure target quiz exists for requested type (default practice)
    const quizId = await ensureQuizForChapter(chapterId, isPractice);

    // Get both original questions and their drafts
    const { data: questions, error } = await supabaseAdmin
      .from("questions")
      .select(
        "id, position, text, type, points, image, quiz_id, published, draft_of, choices(id, text, is_correct, image_url)"
      )
      .eq("quiz_id", quizId)
      .order("position", { ascending: true });
    if (error) throw error;

    // Map database 'image' field to frontend-expected 'image_url' field
    const questionsWithMappedFields = (questions || []).map((question) => ({
      ...question,
      image_url: question.image,
      image: undefined, // Remove the original image field
    }));

    return new Response(JSON.stringify(questionsWithMappedFields), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      chapter_id: chapterId,
      text,
      type = "multiple_choice",
      points = 1,
      image_url = null,
      choices = [],
      is_practice: isPractice = true,
      published = true, // Default to published for immediate visibility
      draft_of = null, // Reference to original question if this is a draft
    } = body;
    if (!chapterId || !text)
      return new Response(
        JSON.stringify({ error: "chapter_id and text required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    const quizId = await ensureQuizForChapter(chapterId, isPractice);

    // compute next position
    const { data: posData } = await supabaseAdmin
      .from("questions")
      .select("position")
      .eq("quiz_id", quizId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPos = posData && posData.position ? posData.position + 1 : 1;

    const { data: q, error: qErr } = await supabaseAdmin
      .from("questions")
      .insert({
        quiz_id: quizId,
        position: nextPos,
        text,
        type,
        points,
        image: image_url, // Map image_url from frontend to image column in database
        published,
        draft_of, // Link to original question if this is a draft
      })
      .select("id, position, text, type, points, image, published, draft_of")
      .maybeSingle();
    if (qErr) throw qErr;

    // insert choices if provided
    if (Array.isArray(choices) && choices.length > 0) {
      const choicesPayload = choices.map((c) => ({
        question_id: q.id,
        text: c.text,
        is_correct: !!c.is_correct,
        image_url: c.image_url || null,
      }));
      const { error: chErr } = await supabaseAdmin
        .from("choices")
        .insert(choicesPayload);
      if (chErr) throw chErr;
    }

    const { data: questionWithChoices, error: fetchErr } = await supabaseAdmin
      .from("questions")
      .select(
        "id, position, text, type, points, image, published, draft_of, choices(id, text, is_correct, image_url)"
      )
      .eq("id", q.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    // Map database 'image' field to frontend-expected 'image_url' field
    const responseData = {
      ...questionWithChoices,
      image_url: questionWithChoices.image,
      image: undefined, // Remove the original image field
    };

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
