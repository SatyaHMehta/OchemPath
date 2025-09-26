import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("quizzes").select("*");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const { title, course_id, created_by, description } = body;
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .insert([{ title, course_id, created_by, description }])
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
