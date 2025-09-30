import React from "react";
import styles from "./page.module.css";
import Course from "@/components/course/Course";
import supabaseAdmin from "@/lib/supabaseServer";

async function fetchCourses() {
  try {
    console.log('[COURSES] Fetching courses directly from database...');
    
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('id, name, description, cover');

    if (error) {
      console.error('[COURSES] Database error:', error);
      return [];
    }

    console.log('[COURSES] Successfully fetched courses:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('[COURSES] Unexpected error:', error);
    return [];
  }
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
