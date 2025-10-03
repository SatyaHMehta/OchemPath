import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { published } = await request.json();

    // Validate input
    if (typeof published !== "boolean") {
      return Response.json(
        { error: "Published field must be a boolean" },
        { status: 400 }
      );
    }

    // First try to add the column if it doesn't exist
    try {
      // Check if column exists by trying a simple select
      await supabaseAdmin.from("questions").select("published").limit(1);
    } catch (columnError) {
      // If column doesn't exist, try to add it

      // For now, return a helpful error message
      return Response.json(
        {
          error: "Database schema update needed",
          details:
            "The 'published' column needs to be added to the questions table. Please run the database migration or contact your administrator.",
          code: "MISSING_COLUMN",
        },
        { status: 500 }
      );
    }

    // Fetch the target question first to determine if it's a draft or original
    const { data: target, error: fetchErr } = await supabaseAdmin
      .from("questions")
      .select(
        "id, draft_of, published, text, type, points, image, position, quiz_id, choices(id, text, is_correct, image_url)"
      )
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !target) {
      return Response.json({ error: "Question not found" }, { status: 404 });
    }

    // If this is a draft being published -> promote its content into original and delete draft
    if (published === true && target.draft_of) {
      const originalId = target.draft_of;

      // Fetch original to ensure it exists
      const { data: original, error: origErr } = await supabaseAdmin
        .from("questions")
        .select("id, text, type, points, image, position, quiz_id, published")
        .eq("id", originalId)
        .maybeSingle();
      if (origErr || !original) {
        return Response.json(
          { error: "Original question for draft not found" },
          { status: 404 }
        );
      }

      // Update original with draft's mutable fields
      const { error: updErr } = await supabaseAdmin
        .from("questions")
        .update({
          text: target.text,
          type: target.type,
          points: target.points,
          image: target.image,
          position: target.position, // allow position change via draft
          published: true,
        })
        .eq("id", originalId);
      if (updErr) {
        return Response.json(
          { error: "Failed to promote draft (update)" },
          { status: 500 }
        );
      }

      // Replace original choices: delete then insert
      const { error: delChoicesErr } = await supabaseAdmin
        .from("choices")
        .delete()
        .eq("question_id", originalId);
      if (delChoicesErr) {
        return Response.json(
          { error: "Failed to clear original choices" },
          { status: 500 }
        );
      }

      if (Array.isArray(target.choices) && target.choices.length > 0) {
        const { error: insChoicesErr } = await supabaseAdmin
          .from("choices")
          .insert(
            target.choices.map((c) => ({
              question_id: originalId,
              text: c.text,
              is_correct: c.is_correct,
              image_url: c.image_url || null,
            }))
          );
        if (insChoicesErr) {
          return Response.json(
            { error: "Failed to insert updated choices" },
            { status: 500 }
          );
        }
      }

      // Delete the draft row
      const { error: delDraftErr } = await supabaseAdmin
        .from("questions")
        .delete()
        .eq("id", target.id);
      if (delDraftErr) {
        return Response.json(
          { error: "Failed to remove draft row after promotion" },
          { status: 500 }
        );
      }

      // Return updated original (with new choices)
      const { data: updatedOriginal, error: updatedFetchErr } =
        await supabaseAdmin
          .from("questions")
          .select(
            "id, draft_of, published, text, type, points, image, position, quiz_id, choices(id, text, is_correct, image_url)"
          )
          .eq("id", originalId)
          .maybeSingle();
      if (updatedFetchErr) {
        return Response.json(
          { error: "Failed to fetch updated original" },
          { status: 500 }
        );
      }
      return Response.json(updatedOriginal, { status: 200 });
    }

    // Otherwise just update the published flag on a non-draft question
    const { data: updated, error: simpleErr } = await supabaseAdmin
      .from("questions")
      .update({ published })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (simpleErr) {
      return Response.json(
        { error: "Failed to update question" },
        { status: 500 }
      );
    }
    return Response.json(updated, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
