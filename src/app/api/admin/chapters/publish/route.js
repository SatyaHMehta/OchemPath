import supabaseAdmin from "@/lib/supabaseServer";

// PATCH /api/admin/chapters/publish?course_id=... -> publish all drafts for course
export async function PATCH(req) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("course_id");
    if (!courseId) {
      return new Response(JSON.stringify({ error: "course_id required" }), {
        status: 400,
      });
    }

    // Fetch all drafts for course
    const { data: drafts, error: draftsErr } = await supabaseAdmin
      .from("chapters")
      .select("id, draft_of, title, description, video_url, position")
      .eq("course_id", courseId)
      .not("draft_of", "is", null);
    if (draftsErr) throw draftsErr;

    let promoted = 0;
    for (const d of drafts) {
      // Update original
      const { error: updErr } = await supabaseAdmin
        .from("chapters")
        .update({
          title: d.title,
          description: d.description,
          video_url: d.video_url,
          position: d.position,
          published: true,
        })
        .eq("id", d.draft_of);
      if (updErr) continue;
      // Delete draft
      await supabaseAdmin.from("chapters").delete().eq("id", d.id);
      promoted++;
    }

    return new Response(JSON.stringify({ promoted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
