import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("course_id");

    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "course_id query parameter required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("position", { ascending: true });

    if (error) throw error;

    // Collapse originals when a draft exists
    const draftsByOriginal = new Map();
    (data || []).forEach((c) => {
      if (c.draft_of) draftsByOriginal.set(c.draft_of, c);
    });
    const collapsed = [];
    (data || []).forEach((c) => {
      if (c.draft_of) {
        collapsed.push(c);
      } else if (!draftsByOriginal.has(c.id)) {
        collapsed.push(c);
      }
    });

    return new Response(JSON.stringify(collapsed), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error fetching chapters:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      course_id,
      position,
      title,
      description,
      video_url,
      draft_of = null,
    } = body;

    if (!course_id || !title) {
      return new Response(
        JSON.stringify({ error: "course_id and title are required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .insert({
        course_id,
        position: position || 1,
        title,
        description: description || null,
        video_url: video_url || null,
        published: false, // Draft by default
        draft_of, // Link to original if this is a draft edit of an existing chapter
      })
      .select()
      .single();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating chapter:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
