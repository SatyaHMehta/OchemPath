import supabaseAdmin from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("dashboard_users")
      .select(
        "id, name, email, role, university, courses, attempts, avg_score, practice_coverage, is_active, last_active_at"
      )
      .order("name", { ascending: true });
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
