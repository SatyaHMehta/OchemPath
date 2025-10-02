import supabaseAdmin from "@/lib/supabaseServer";

// DELETE /api/admin/chapters/drafts?course_id=... -> deletes all draft chapters (draft_of IS NOT NULL) for course
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("course_id");
    if (!courseId) {
      return new Response(JSON.stringify({ error: "course_id required" }), { status: 400 });
    }
    const { error, count } = await supabaseAdmin
      .from("chapters")
      .delete({ count: "exact" })
      .eq("course_id", courseId)
      .not("draft_of", "is", null);
    if (error) throw error;
    return new Response(JSON.stringify({ deleted: count || 0 }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
