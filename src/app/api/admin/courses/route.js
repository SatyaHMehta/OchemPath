import supabaseAdmin from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select("id, title, description, image_url, created_at")
      .order("created_at", { ascending: true });
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, image_url } = body;
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert({ title, description, image_url })
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
