"use client";
"use client";
import React from "react";
import styles from "./course.module.css";
import Image from "next/image";
import Button from "@/components/button/Button";
import { useRouter } from 'next/navigation';

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
          <Image className={styles.image} src={image} fill={true} alt={name} />
          <h1 className={styles.imageTitle}>{name}</h1>
        </div>
        <div className={styles.descriptionContainer}>
          <p className={styles.description}>{description}</p>
          {/* Sample quiz route used here; clicking the button shouldn't trigger the whole card navigation */}
          <Button url="/quiz" text="Free Quiz Trial!" />
        </div>
      </div>
    </div>
  );
};

export default Course;
