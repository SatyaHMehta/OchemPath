import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getClientForRequest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: cookies().get("sb-access-token")?.value
          ? `Bearer ${cookies().get("sb-access-token")?.value}`
          : undefined,
      },
    },
  });
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const qpUser = url.searchParams.get("userId");
    // Resolve current user via a client using cookie session
    const client = getClientForRequest();
    const { data: sess } = await client.auth.getUser();
    const userId = qpUser || sess?.user?.id;

    if (!userId) return NextResponse.json({ debug: "No user", activity: [] });

    // Try different query approaches
    const approach1 = await supabaseAdmin
      .from("submissions")
      .select(`id, created_at, finished_at, score, quiz_id`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const approach2 = await supabaseAdmin
      .from("submissions")
      .select(`*`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const approach3 = await supabaseAdmin
      .from("submissions")
      .select(`id, created_at, finished_at, score, quiz_id, quizzes(id, title)`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      userId,
      approach1: { data: approach1.data, error: approach1.error?.message },
      approach2: { data: approach2.data, error: approach2.error?.message },
      approach3: { data: approach3.data, error: approach3.error?.message },
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
