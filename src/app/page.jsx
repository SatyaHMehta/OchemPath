"use client"

import Image from "next/image";
import styles from "./page.module.css";
import ochemLogo from "/public/OchemLogo.jpg";
import Button from "@/components/button/Button";

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
        <Button url="/courses" text="See Our Courses!"/>
      </div>
      <div className={styles.item}>
        <Image className={styles.logo} src={ochemLogo}></Image>
      </div>
    </div>
  );
}
