import React from "react";
import styles from "./page.module.css";
import Course from "@/components/course/Course";
import supabaseAdmin from "@/lib/supabaseServer";

async function fetchCourses() {
  try {
    console.log('[COURSES] Fetching courses directly from database...');
    
    // Use the correct column names based on the API: title and image_url
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('id, title, description, image_url')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[COURSES] Database error:', error);
      return [];
    }

    // Map to the format expected by the Course component
    const courses = (data || []).map(course => ({
      id: course.id,
      name: course.title,           // Course component expects 'name'
      description: course.description || '',
      cover: course.image_url       // Course component expects 'cover'
    }));

    console.log('[COURSES] Successfully fetched courses:', courses.length);
    console.log('[COURSES] Course data:', courses);
    return courses;
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
