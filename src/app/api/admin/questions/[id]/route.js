import supabaseAdmin from "@/lib/supabaseServer";

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { text, type, points, image, choices } = body;

    const updatePayload = {};
    if (text !== undefined) updatePayload.text = text;
    if (type !== undefined) updatePayload.type = type;
    if (points !== undefined) updatePayload.points = points;
    if (image !== undefined) updatePayload.image = image;

    if (Object.keys(updatePayload).length > 0) {
      const { error: upErr } = await supabaseAdmin
        .from("questions")
        .update(updatePayload)
        .eq("id", id);
      if (upErr) throw upErr;
    }

    // Replace choices if provided (simple approach: delete existing then insert new)
    if (Array.isArray(choices)) {
      const { error: delErr } = await supabaseAdmin
        .from("choices")
        .delete()
        .eq("question_id", id);
      if (delErr) throw delErr;
      if (choices.length > 0) {
        const payload = choices.map((c) => ({
          question_id: id,
          text: c.text,
          is_correct: !!c.is_correct,
        }));
        const { error: insErr } = await supabaseAdmin
          .from("choices")
          .insert(payload);
        if (insErr) throw insErr;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("questions")
      .select(
        "id, position, text, type, points, image, choices(id, text, is_correct)"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("Error in admin/questions/[id] PUT", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    // delete choices first
    const { error: delChoicesErr } = await supabaseAdmin
      .from("choices")
      .delete()
      .eq("question_id", id);
    if (delChoicesErr) throw delChoicesErr;
    const { error: delQErr } = await supabaseAdmin
      .from("questions")
      .delete()
      .eq("id", id);
    if (delQErr) throw delQErr;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error in admin/questions/[id] DELETE", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
