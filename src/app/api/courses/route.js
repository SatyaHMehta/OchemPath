import supabaseAdmin from "@/lib/supabaseServer";

// Helper: extract a YouTube id from a url-like string or accept an id
function pickYouTubeId(seed) {
  // simple placeholder ids list
  const sampleIds = [
    "dQw4w9WgXcQ",
    "9bZkp7q19f0",
    "3JZ_D3ELwOQ",
    "Zi_XLOBDo_Y",
    "V-_O7nl0Ii0",
    "kJQP7kiw5Fk",
    "fLexgOxsZu0",
  ];
  const idx =
    Math.abs(
      String(seed)
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % sampleIds.length;
  return sampleIds[idx];
}

export async function GET() {
  try {
    // Fetch courses with nested chapters
    const { data: courses, error } = await supabaseAdmin
      .from("courses")
      .select(
        "id, title, description, image_url, created_at, chapters(id, position, title, video_url)"
      )
      .order("created_at", { ascending: true });
    if (error) throw error;

    // If no courses exist, return an empty array
    if (!courses || courses.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // For each course, ensure at least 3 chapters exist; if not, insert 3 mock chapters
    for (const course of courses) {
      const hasChapters =
        Array.isArray(course.chapters) && course.chapters.length > 0;
      if (!hasChapters) {
        const toInsert = [1, 2, 3].map((i) => ({
          course_id: course.id,
          position: i,
          title: `Chapter ${i}: Placeholder title`,
          video_url: pickYouTubeId(`${course.id}-${i}`),
        }));
        const { error: insErr } = await supabaseAdmin
          .from("chapters")
          .insert(toInsert);
        if (insErr) {
          console.warn(
            "Failed to insert mock chapters for course",
            course.id,
            insErr.message
          );
        }
      }
    }

    // Re-query to get chapters after possible inserts
    const { data: updated, error: reErr } = await supabaseAdmin
      .from("courses")
      .select(
        "id, title, description, image_url, created_at, chapters(id, position, title, video_url)"
      )
      .order("created_at", { ascending: true });
    if (reErr) throw reErr;

    // Shape response to match previous frontend expectations
    const shaped = (updated || []).map((c) => ({
      id: c.id,
      name: c.title,
      description: c.description,
      cover: c.image_url || c.cover || null,
      chapters: (c.chapters || []).map((ch) => ({
        id: ch.id,
        title: ch.title,
        position: ch.position,
        videos: ch.video_url
          ? [{ id: ch.video_url, title: ch.title || "Lecture" }]
          : [],
      })),
    }));

    return new Response(JSON.stringify(shaped), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    // If Supabase fetch fails (network, misconfigured URL), return 500
    console.warn("Supabase error in /api/courses:", err?.message || err);
    return new Response(JSON.stringify({ error: "failed to fetch courses" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
