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

    return new Response(JSON.stringify(data || []), {
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
    const { course_id, position, title, description, video_url } = body;

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
        published: false, // Always create as draft
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
