import supabaseAdmin from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get("course_id");
    let q = supabaseAdmin
      .from("chapters")
      .select("*")
      .order("position", { ascending: true });
    if (course_id) q = q.eq("course_id", course_id);
    const { data, error } = await q;
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
