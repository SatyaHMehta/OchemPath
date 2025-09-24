"use client"

import Link from "next/link";
import React from "react";
import styles from "./navbar.module.css";

const Navbar = () => {
  const links = [
    {
      id: 1,
      title: "Home",
      url: "/",
    },
    {
      id: 2,
      title: "Courses",
      url: "/courses",
    },
    {
      id: 4,
      title: "Quiz",
      url: "/quiz",
    },
    {
      id: 3,
      title: "Dashboard",
      url: "/dashboard",
    },
  ];
  return (
    <div className={styles.container}>
      <Link href={"/"} className={styles.logo}>
        Logo
      </Link>
      <div className={styles.links}>
        {links.map((link) => (
          <Link key={link.id} href={link.url} className={styles.link}>
            {link.title}
          </Link>
        ))}
        <button
          onClick={() => {
            console.log("Logged out!");
          }}
          className={styles.button}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Navbar;
