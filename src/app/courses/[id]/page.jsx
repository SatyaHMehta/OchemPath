import React from "react";
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
  } catch (err) {
    console.warn("generateStaticParams supabase error", err?.message || err);
  }
  // If DB lookup failed or returned nothing, return empty params (no pre-rendered pages)
  return [];
}

async function fetchCourseFromDb(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select(
        "id, title, description, image_url, chapters(id, position, title, video_url)"
      )
      .eq("id", id)
      .single();
    if (error) throw error;

    const rawChapters = data.chapters || [];
    const chapters = rawChapters.map((ch, idx) => {
      const videos = ch.video_url
        ? [{ id: ch.video_url, title: ch.title }]
        : [
            {
              id: pickYouTubeId(`${data.id}-${ch.id || idx}`),
              title: ch.title || "Lecture",
            },
          ];
      return {
        id: ch.id,
        title: ch.title,
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
    console.warn("fetchCourseFromDb error", err?.message || err);
    return null;
  }
}

export default async function CoursePage({ params }) {
  const id = String(params.id ?? "");

  // Try DB first
  let course = await fetchCourseFromDb(id);

  // If not in DB, don't fall back to static data; show not found.

  if (!course) return <div className={styles.notFound}>Course not found</div>;

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
            <div className={styles.chapterActions}>
              <Link
                href={`/courses/${course.id}/chapter/${ch.id}/practice`}
                className={styles.chapterButton}
              >
                {`Ch ${
                  ch.position || course.chapters.indexOf(ch) + 1
                } Practice Questions`}
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
