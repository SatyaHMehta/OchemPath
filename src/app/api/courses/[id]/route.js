import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  const { id } = params;
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select(
        "id, title, description, image_url, chapters(id, position, title, video_url)"
      )
      .eq("id", id)
      .single();
    if (!error && data) {
      const course = {
        id: data.id,
        name: data.title,
        description: data.description,
        logo: data.image_url || null,
        chapters: (data.chapters || []).map((ch) => ({
          id: ch.id,
          title: ch.title,
          position: ch.position,
          videos: ch.video_url ? [{ id: ch.video_url, title: ch.title }] : [],
        })),
      };
      return new Response(JSON.stringify(course), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  } catch (err) {
    console.warn("supabase error fetching course", id, err?.message || err);
  }

  // If DB lookup failed or no course found, return 404
  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}
