import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getAuthClientFromCookies() {
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

// GET: list submissions (admin/service) — for debug only
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("*, answers(*)")
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create a submission and its answers. Expect server to call grading endpoint separately.
export async function POST(req) {
  try {
    const body = await req.json();
    // expected: { quiz_id, user_id, answers: [{question_id, choice_id, text_answer}], finished_at }
    const { quiz_id, user_id: bodyUserId, answers = [], finished_at } = body;

    // Resolve current user from cookie if present (OAuth flows)
    const client = getAuthClientFromCookies();
    const { data: auth } = await client.auth.getUser();
    const effectiveUserId = auth?.user?.id || bodyUserId || null;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in to submit a quiz." },
        { status: 401 }
      );
    }

    const { data: submission, error: subErr } = await supabaseAdmin
      .from("submissions")
      .insert([{ quiz_id, user_id: effectiveUserId, finished_at }])
      .select()
      .single();
    if (subErr)
      return NextResponse.json({ error: subErr.message }, { status: 400 });

    // Insert answers
    const answersToInsert = answers.map((a) => ({
      submission_id: submission.id,
      question_id: a.question_id,
      choice_id: a.choice_id || null,
      text_answer: a.text_answer || null,
    }));

    const { error: ansErr } = await supabaseAdmin
      .from("answers")
      .insert(answersToInsert);
    if (ansErr)
      return NextResponse.json({ error: ansErr.message }, { status: 400 });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
