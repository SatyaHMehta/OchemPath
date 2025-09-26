import React from "react";
import styles from "./page.module.css";

async function fetchCourses() {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  const url = new URL("/api/courses", base);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function PracticePage({ params }) {
  const { id, chapterId } = params;
  const courses = await fetchCourses();
  const course = courses.find((c) => String(c.id) === String(id));
  const chapter = course?.chapters?.find(
    (ch) => String(ch.id) === String(chapterId)
  );

  // Build a few placeholder practice questions
  const practiceQuestions = [
    {
      id: 1,
      text: "Placeholder: What is the hybridization?",
      options: ["sp", "sp2", "sp3", "sp3d"],
    },
    {
      id: 2,
      text: "Placeholder: Which is most acidic?",
      options: ["A", "B", "C", "D"],
    },
    {
      id: 3,
      text: "Placeholder: Identify the functional group.",
      options: ["alcohol", "ketone", "aldehyde", "amine"],
    },
  ];

  if (!course) return <div className={styles.notFound}>Course not found</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {course.name} — {chapter?.title ?? "Chapter"}
      </h1>
      {chapter?.videos && chapter.videos.length > 0 ? (
        <div className={styles.player}>
          <iframe
            src={`https://www.youtube.com/embed/${chapter.videos[0].id}`}
            title={chapter.videos[0].title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className={styles.placeholder}>Video not uploaded yet.</div>
      )}

      <section className={styles.practice}>
        <h2>Practice Questions</h2>
        <ol>
          {practiceQuestions.map((q) => (
            <li key={q.id} className={styles.question}>
              <div className={styles.qText}>{q.text}</div>
              <div className={styles.options}>
                {q.options.map((o) => (
                  <label key={o} className={styles.option}>
                    <input type="radio" name={`q-${q.id}`} /> {o}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.actions}>
        <a
          className={styles.primary}
          href={`/courses/${id}/chapter/${chapterId}/quiz`}
        >
          Start Chapter Quiz
        </a>
      </div>
    </div>
  );
}
