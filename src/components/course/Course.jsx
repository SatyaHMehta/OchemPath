"use client";
import React from "react";
import styles from "./course.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Course = ({ name, description, image, url }) => {
  const router = useRouter();

  const goToCourse = () => router.push(url);

  return (
    <div
      className={styles.container}
      onClick={goToCourse}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") goToCourse();
      }}
    >
      <div className={styles.courseContainer}>
        <div className={styles.imageContainer}>
          {image ? (
            <Image
              className={styles.image}
              src={image}
              fill={true}
              alt={name}
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true" />
          )}
          <h1 className={styles.imageTitle}>{name}</h1>
        </div>
        <div className={styles.descriptionContainer}>
          <p className={styles.description}>{description}</p>
          {/* Removed legacy Free Quiz Trial button to /quiz */}
        </div>
      </div>
    </div>
  );
};

export default Course;
