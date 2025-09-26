import supabaseAdmin from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();
    const { course_id, position, title, video_url } = body;
    const { data, error } = await supabaseAdmin
      .from("chapters")
      .insert({ course_id, position, title, video_url })
      .select()
      .single();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
