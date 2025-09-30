import supabaseAdmin from "@/lib/supabaseServer";

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { published } = body;

    if (typeof published !== 'boolean') {
      return new Response(
        JSON.stringify({ error: "published field must be a boolean" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("chapters")
      .update({ published })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Chapter not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
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