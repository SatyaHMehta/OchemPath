import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Chapter not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching chapter:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, video_url, position, draft = false } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // If draft flag is true, create (or reuse) a draft row instead of updating original
    if (draft) {
      // Fetch original
      const { data: original, error: origErr } = await supabaseAdmin
        .from("chapters")
        .select("id, course_id")
        .eq("id", id)
        .maybeSingle();
      if (origErr || !original) {
        return new Response(JSON.stringify({ error: "Original chapter not found" }), { status: 404 });
      }

      // Check if a draft already exists
      const { data: existingDraft } = await supabaseAdmin
        .from("chapters")
        .select("id")
        .eq("draft_of", id)
        .maybeSingle();

      const basePayload = {
        course_id: original.course_id,
        title,
        description: description || null,
        video_url: video_url || null,
        position: position === undefined ? null : position,
        published: false,
        draft_of: id,
      };

      if (existingDraft?.id) {
        const { data: updatedDraft, error: updDraftErr } = await supabaseAdmin
          .from("chapters")
          .update(basePayload)
          .eq("id", existingDraft.id)
          .select()
          .maybeSingle();
        if (updDraftErr) throw updDraftErr;
        return new Response(JSON.stringify(updatedDraft), { status: 200 });
      } else {
        const { data: newDraft, error: newDraftErr } = await supabaseAdmin
          .from("chapters")
          .insert(basePayload)
          .select()
          .maybeSingle();
        if (newDraftErr) throw newDraftErr;
        return new Response(JSON.stringify(newDraft), { status: 201 });
      }
    }

    const updateData = {
      title,
      description: description || null,
      video_url: video_url || null,
    };

    // Only update position if provided
    if (position !== undefined) {
      updateData.position = position;
    }

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Chapter not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating chapter:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // First check if chapter exists
    const { data: existingChapter, error: fetchError } = await supabaseAdmin
      .from("chapters")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Chapter not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      throw fetchError;
    }

    // Delete related data first (questions, quizzes, etc.)
    // Get all quiz IDs for this chapter
    const { data: quizzes } = await supabaseAdmin
      .from("quizzes")
      .select("id")
      .eq("chapter_id", id);

    if (quizzes && quizzes.length > 0) {
      const quizIds = quizzes.map((q) => q.id);
      // Fetch question ids explicitly (cannot pass a query builder into .in())
      const { data: questions, error: fetchQuestionsErr } = await supabaseAdmin
        .from("questions")
        .select("id")
        .in("quiz_id", quizIds);
      if (fetchQuestionsErr) {
        console.warn("Error fetching related questions:", fetchQuestionsErr);
      }

      if (questions && questions.length > 0) {
        const questionIds = questions.map((q) => q.id);
        // Delete choices first
        const { error: choicesError } = await supabaseAdmin
          .from("choices")
          .delete()
          .in("question_id", questionIds);
        if (choicesError) {
          console.warn("Error deleting related choices:", choicesError);
        }
        // Delete questions
        const { error: questionsError } = await supabaseAdmin
          .from("questions")
          .delete()
          .in("id", questionIds);
        if (questionsError) {
          console.warn("Error deleting related questions:", questionsError);
        }
      }

      // Delete quizzes
      const { error: quizzesError } = await supabaseAdmin
        .from("quizzes")
        .delete()
        .eq("chapter_id", id);

      if (quizzesError) {
        console.warn("Error deleting related quizzes:", quizzesError);
      }
    }

    // Finally delete the chapter
    const { error: deleteError } = await supabaseAdmin
      .from("chapters")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error deleting chapter:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
