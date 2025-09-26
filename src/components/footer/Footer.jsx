import React from "react";
import styles from "./footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.left}>
        <div className={styles.brand}>OchemPath</div>
        <div className={styles.copy}>© {new Date().getFullYear()} OchemPath</div>
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
