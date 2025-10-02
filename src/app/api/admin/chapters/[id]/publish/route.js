import supabaseAdmin from "@/lib/supabaseServer";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { published } = body;

    if (typeof published !== "boolean") {
      return new Response(
        JSON.stringify({ error: "published field must be a boolean" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Fetch target (could be draft or original)
    const { data: target, error: fetchErr } = await supabaseAdmin
      .from("chapters")
      .select("id, draft_of, course_id, title, description, video_url, position, published")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !target) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // If publishing a draft, promote into original chapter
    if (published === true && target.draft_of) {
      const originalId = target.draft_of;
      const { error: updErr } = await supabaseAdmin
        .from("chapters")
        .update({
          title: target.title,
          description: target.description,
          video_url: target.video_url,
          position: target.position,
          published: true,
        })
        .eq("id", originalId);
      if (updErr) {
        return new Response(JSON.stringify({ error: "Failed to promote draft" }), { status: 500 });
      }
      // Delete draft row
      await supabaseAdmin.from("chapters").delete().eq("id", target.id);
      const { data: updatedOriginal } = await supabaseAdmin
        .from("chapters")
        .select("*")
        .eq("id", originalId)
        .maybeSingle();
      return new Response(JSON.stringify(updatedOriginal), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Otherwise simple publish/unpublish toggle on non-draft
    const { data: updated, error } = await supabaseAdmin
      .from("chapters")
      .update({ published })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) {
      return new Response(JSON.stringify({ error: "Failed to update chapter" }), { status: 500 });
    }
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error updating chapter publish status:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
