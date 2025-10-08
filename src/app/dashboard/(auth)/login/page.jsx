"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    try {
      const user = data?.user;
      if (user?.id) {
        await supabase
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch (e) {
      console.warn("Could not update last_login", e?.message || e);
    }
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h2 className={styles.title}>Welcome back</h2>
        <p style={{ color: "#bfeee2", marginBottom: "1rem" }}>
          Pick up where you left off — sharpen your organic chemistry skills
          with quick practice quizzes and track your progress.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <button
            type="button"
            className={styles.button}
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/dashboard` },
                });
                if (error) setError(error.message);
              } catch (e) {
                setError(e?.message || "Google sign-in failed");
              }
            }}
            style={{ marginBottom: 10 }}
          >
            Continue with Google
          </button>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button className={styles.button} disabled={loading}>
            {loading ? "Loading..." : "Log in"}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>

      <div className={styles.right}>
        <img
          src="/images/chemistry-right.svg"
          alt="Chemistry"
          className={styles.hero}
        />
      </div>
    </div>
  );
};

export default Login;
