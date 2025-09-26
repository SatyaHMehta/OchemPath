import supabaseAdmin from "@/lib/supabaseServer";

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from("chapters")
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { error } = await supabaseAdmin
      .from("chapters")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
