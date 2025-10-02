import React from "react";

// Force this route to render dynamically so newly published chapter changes
// (including promoted drafts) are reflected immediately without a rebuild.
// Using both dynamic + no-store to cover Supabase SDK (non-Next fetch) calls.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0; // explicit: no ISR caching
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/button/Button";
import supabaseAdmin from "@/lib/supabaseServer";

// Deterministic mock YouTube id picker for placeholder videos
function pickYouTubeId(seed) {
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

// Try to generate static params from DB; fall back to static ids
export async function generateStaticParams() {
  try {
    const { data, error } = await supabaseAdmin.from("courses").select("id");
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((r) => ({ id: String(r.id) }));
    }
  } catch (err) {}
  // If DB lookup failed or returned nothing, return empty params (no pre-rendered pages)
  return [];
}

async function fetchCourseFromDb(id) {
  try {
    // Test database connection first
    const connectionTest = await supabaseAdmin
      .from("courses")
      .select("count")
      .limit(1);

    if (connectionTest.error) {
      throw new Error(
        `Database connection failed: ${connectionTest.error.message}`
      );
    }

    // First get the course info
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("id, title, description, image_url")
      .eq("id", id)
      .single();

    if (courseError) {
      throw courseError;
    }

    if (!courseData) {
      throw new Error("Course not found");
    }

    // Test chapters table structure first
    const chaptersTest = await supabaseAdmin
      .from("chapters")
      .select("*")
      .limit(1);

    if (chaptersTest.error) {
      throw new Error(
        `Cannot access chapters table: ${chaptersTest.error.message}`
      );
    }

    // Then get published chapters separately
    const { data: chaptersData, error: chaptersError } = await supabaseAdmin
      .from("chapters")
      .select("id, position, title, description, video_url, published")
      .eq("course_id", id)
      .eq("published", true) // Only show published chapters
      .order("position", { ascending: true });

    if (chaptersError) {
      // If published column doesn't exist, try without the published filter
      if (
        chaptersError.code === "PGRST116" ||
        chaptersError.message?.includes("published")
      ) {
        const { data: allChaptersData, error: allChaptersError } =
          await supabaseAdmin
            .from("chapters")
            .select("id, position, title, description, video_url")
            .eq("course_id", id)
            .order("position", { ascending: true });

        if (allChaptersError) {
          throw allChaptersError;
        }

        const data = {
          ...courseData,
          chapters: allChaptersData || [],
        };

        return buildCourseResponse(data);
      }
      throw chaptersError;
    }

    const data = {
      ...courseData,
      chapters: chaptersData || [],
    };

    return buildCourseResponse(data);
  } catch (err) {
    // Return safe fallback data instead of null to prevent crashes
    return {
      id: id,
      name: "Course Loading Error",
      description:
        "There was an error loading this course. Please check the console for details.",
      logo: null,
      chapters: [],
    };
  }
}

function buildCourseResponse(data) {
  try {
    const rawChapters = data.chapters || [];
    const chapters = rawChapters.map((ch, idx) => {
      // Extract YouTube video ID from URL if it exists
      let videoId = null;
      if (ch.video_url) {
        const urlMatch = ch.video_url.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
        );
        videoId = urlMatch
          ? urlMatch[1]
          : pickYouTubeId(`${data.id}-${ch.id || idx}`);
      } else {
        videoId = pickYouTubeId(`${data.id}-${ch.id || idx}`);
      }

      const videos = [
        {
          id: videoId,
          title: ch.title || "Lecture",
          url: ch.video_url,
        },
      ];

      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        position: ch.position,
        videos,
      };
    });

    const shaped = {
      id: data.id,
      name: data.title,
      description: data.description,
      logo: data.image_url || null,
      chapters,
    };
    return shaped;
  } catch (err) {
    // Return safe fallback instead of null
    return {
      id: data?.id || "unknown",
      name: data?.title || "Error Loading Course",
      description:
        data?.description || "There was an error processing this course data.",
      logo: data?.image_url || null,
      chapters: [],
    };
  }
}

export default async function CoursePage({ params }) {
  const id = String(params.id ?? "");

  // Try DB first
  let course = await fetchCourseFromDb(id);

  // If not in DB, don't fall back to static data; show not found.
  if (!course) {
    return <div className={styles.notFound}>Course not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {course.logo ? (
            <Image
              src={course.logo}
              alt="logo"
              fill={true}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div style={{ width: 120, height: 120 }} />
          )}
        </div>
        <div className={styles.meta}>
          <h1 className={styles.title}>{course.name}</h1>
          <p className={styles.desc}>{course.description}</p>
          <Link href="/courses" className={styles.back}>
             back to courses
          </Link>
        </div>
      </div>

      <div className={styles.chapters}>
        {(!course.chapters || course.chapters.length === 0) && (
          <div className={styles.empty}>No chapters yet.</div>
        )}
        {course.chapters.map((ch) => (
          <section key={ch.id} className={styles.chapter}>
            <h2 className={styles.chapterTitle}>{ch.title}</h2>
            {ch.description && (
              <p className={styles.chapterDescription}>{ch.description}</p>
            )}
            {ch.videos && ch.videos.length > 0 && ch.videos[0].url && (
              <div className={styles.videos}>
                {ch.videos.map((v) => (
                  <div key={v.id} className={styles.videoCard}>
                    <div className={styles.videoTitle}>{v.title}</div>
                    <div className={styles.player}>
                      <iframe
                        src={`https://www.youtube.com/embed/${v.id}`}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className={styles.videoActions}>
                      <a
                        href={`https://www.youtube.com/watch?v=${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open on YouTube
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!ch.videos || !ch.videos[0]?.url) && (
              <div className={styles.noVideo}>
                <p>No video available for this chapter yet.</p>
              </div>
            )}
            <div className={styles.chapterActions}>
              <Link
                href={`/courses/${course.id}/chapter/${ch.id}/practice`}
                className={styles.chapterButton}
              >
                {`Ch ${
                  ch.position || course.chapters.indexOf(ch) + 1
                } Practice Quiz`}
              </Link>
              <Link
                href={`/courses/${course.id}/chapter/${ch.id}/quiz`}
                className={styles.chapterButton}
              >
                {`Chapter ${
                  ch.position || course.chapters.indexOf(ch) + 1
                } Quiz`}
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
