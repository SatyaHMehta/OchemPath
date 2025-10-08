"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import styles from "./navbar.module.css";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [session, setSession] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session || null);
      return data.session || null;
    };
    getSession().then(async (sess) => {
      if (sess?.user) {
        await syncAndLoadProfile(sess.user);
      } else {
        setDisplayName("");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session || null);
        if (session?.user) {
          syncAndLoadProfile(session.user);
        } else {
          setDisplayName("");
        }
      }
    );
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Ensure a profile row exists (for OAuth sign-ins) and load display name
  const syncAndLoadProfile = async (user) => {
    try {
      const userId = user.id;
      const { data: rows, error } = await supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, role")
        .eq("id", userId)
        .maybeSingle();

      let prof = rows || null;
      if (!prof) {
        // Create a minimal default profile for OAuth sign-ins
        const candidateName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.given_name ||
          user.email?.split("@")[0] ||
          "User";
        const up = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            role: "student",
            display_name: candidateName,
          })
          .select()
          .single();
        prof = up.data || null;
      }

      const dn =
        prof?.display_name?.trim() ||
        `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim() ||
        user.email ||
        "";
      setDisplayName(dn);
    } catch (e) {
      console.warn("load profile failed", e?.message || e);
      setDisplayName(session?.user?.email || "");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.push("/");
  };

  const links = [
    { id: 1, title: "Home", url: "/" },
    { id: 2, title: "Courses", url: "/courses" },
    { id: 3, title: "Dashboard", url: "/dashboard/creator" },
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
            <span className={styles.user}>{displayName}</span>
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
