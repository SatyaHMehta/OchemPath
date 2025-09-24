import React from "react";
import styles from "./footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.left}>
        <div className={styles.brand}>Ochem Quiz</div>
        <div className={styles.copy}>© {new Date().getFullYear()} Ochem Quiz</div>
      </div>
      <div className={styles.links}>
        <a href="/" aria-label="Home">Home</a>
        <a href="/courses" aria-label="Courses">Courses</a>
        <a href="mailto:info@example.com" aria-label="Contact">Contact</a>
      </div>
    </footer>
  );
};

export default Footer;
