import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseServer";

// POST /api/admin/seed-mock-auth
// Creates or deletes mock student accounts user1..user5
// Body: { action: "create" | "delete" }
export async function POST(req) {
  const secret = process.env.SEED_SECRET || "";
  const hdr = req.headers.get("x-seed-secret") || "";
  if (!secret || hdr !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action = "create" } = await req.json();
  const emails = Array.from({ length: 5 }).map(
    (_, i) => `user${i + 1}@ochempath.com`
  );

  if (action === "delete") {
    const results = [];
    for (const email of emails) {
      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users?.find((u) => u.email === email);
        if (user) {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          results.push({ email, deleted: true });
        } else {
          results.push({ email, deleted: false, reason: "not found" });
        }
      } catch (e) {
        results.push({ email, error: String(e?.message || e) });
      }
    }
    return NextResponse.json({ action: "delete", results });
  }

  // CREATE action (default)
  const results = [];
  for (let i = 0; i < 5; i++) {
    const u = {
      email: `user${i + 1}@ochempath.com`,
      display: `User #${i + 1}`,
    };
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: "Password1!",
        email_confirm: true,
        user_metadata: { display_name: u.display },
      });
      if (
        error &&
        !String(error.message || "").includes("already registered")
      ) {
        results.push({ email: u.email, error: error.message });
        continue;
      }
      const userId = data?.user?.id;
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ display_name: u.display, role: "student" })
          .eq("id", userId);
      }
      results.push({ email: u.email, created: Boolean(userId) || undefined });
    } catch (e) {
      results.push({ email: u.email, error: String(e?.message || e) });
    }
  }
  return NextResponse.json({ action: "create", results });
}
