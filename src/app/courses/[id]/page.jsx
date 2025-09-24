import React from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { getCourseById, getAllCourseIds } from '@/utils/courses';

export async function generateStaticParams() {
  const ids = getAllCourseIds();
  return ids.map((id) => ({ id }));
}

export default function CoursePage({ params }) {
  const id = Number(params.id ?? 0);
  const course = getCourseById(id);
  if (!course) return <div className={styles.notFound}>Course not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image src={course.logo} alt="logo" fill={true} style={{objectFit:'contain'}} />
        </div>
        <div className={styles.meta}>
          <h1 className={styles.title}>{course.name}</h1>
          <p className={styles.desc}>{course.description}</p>
          <Link href="/courses" className={styles.back}>← Back to courses</Link>
        </div>
      </div>

      <div className={styles.chapters}>
        {course.chapters.length === 0 && (
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
          </section>
        ))}
      </div>
    </div>
  );
}
