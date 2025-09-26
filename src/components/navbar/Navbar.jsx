"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import styles from "./navbar.module.css";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session || null);
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  };

  const links = [
    { id: 1, title: "Home", url: "/" },
    { id: 2, title: "Courses", url: "/courses" },
    { id: 4, title: "Quiz", url: "/quiz" },
    { id: 3, title: "Dashboard", url: "/dashboard" },
  ];

  return (
    <div className={styles.container}>
      <Link href={"/"} className={styles.logo}>
        OchemPath
      </Link>
      <div className={styles.links}>
        {links.map((link) => (
          <Link key={link.id} href={link.url} className={styles.link}>
            {link.title}
          </Link>
        ))}

        {!session ? (
          <>
            <Link href="/dashboard/login" className={styles.button}>
              Log in
            </Link>
            <Link href="/dashboard/register" className={styles.button}>
              Sign up
            </Link>
          </>
        ) : (
          <>
            <span className={styles.user}>{session.user.email}</span>
            <button onClick={handleLogout} className={styles.button}>
              Log Out
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
