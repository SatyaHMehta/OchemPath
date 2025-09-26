"use client";

import Image from "next/image";
import styles from "./page.module.css";
import Button from "@/components/button/Button";

const SUPABASE_LOGO_URL =
  "https://zajechrlsivmlyywhgwp.supabase.co/storage/v1/object/public/course-images/OchemLogo.jpg";

const SUPABASE_PUBLIC_LOGO =
  "https://zajechrlsivmlyywhgwp.supabase.co/storage/v1/object/public/course-images/OchemLogo.jpg";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.item}>
        <h1 className={styles.title}>Learn Organic Chemistry the Easy Way!</h1>
        <p className={styles.description}>
          Learn organic chemistry with many practice quizes to test your
          understaning! Keep track of your improvement and revisit the questions
          you got wrong!
        </p>
        <Button url="/courses" text="See Our Courses!" />
      </div>
      <div className={styles.item}>
        <Image
          className={styles.logo}
          src={SUPABASE_LOGO_URL}
          alt="OchemPath logo"
          width={240}
          height={240}
        />
      </div>
    </div>
  );
}
