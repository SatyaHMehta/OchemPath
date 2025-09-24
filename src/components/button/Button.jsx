"use client";
import React from "react";
import Link from 'next/link';
import styles from "./button.module.css";

const Button = ({ url, text }) => {
  const handleClick = (e) => {
    // stop the click from bubbling to parent card links
    e.stopPropagation();
    // allow Link to handle navigation
  };

  return (
    <Link href={url} className={styles.container} onClick={handleClick}>
      {text}
    </Link>
  );
};

export default Button;
