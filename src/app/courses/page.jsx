import React from "react";
import styles from "./page.module.css";
import Course from "@/components/course/course";

async function fetchCourses() {
  // Build an absolute URL for server-side fetch. Use NEXT_PUBLIC_BASE_URL if set, otherwise fallback to localhost.
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = new URL('/api/courses', base);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

const Courses = async () => {
  const coursesData = await fetchCourses();
  return (
    <div className={styles.container}>
      {coursesData.map((course) => (
        <Course
          key={course.id}
          name={course.name}
          description={course.description}
          image={course.cover}
          url={`/courses/${course.id}`}
        />
      ))}
    </div>
  );
};

export default Courses;
