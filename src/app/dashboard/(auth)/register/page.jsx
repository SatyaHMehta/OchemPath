"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const { data, error } = await supabase.from("universities").select("id, name").order("name");
        if (error) throw error;
        setUniversities(data || []);
      } catch (e) {
        console.warn("Could not load universities", e?.message || e);
      }
    };
    loadUniversities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setError(error.message);

    // If signup succeeded, create a profile row (default role: student)
    try {
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          role: "student",
          display_name: `${firstName || ""} ${lastName || ""}`.trim() || email.split("@")[0],
          first_name: firstName || null,
          last_name: lastName || null,
          dob: dob || null,
          university_id: universityId || null,
        });
      }
    } catch (profileErr) {
      // Non-fatal: profile creation failed
      console.warn("profile create error", profileErr);
    }

    // After signup, push to dashboard (or email-confirmation page)
    router.push("/dashboard");
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
  <h2 className={styles.title}>Create account</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

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

          <div className={styles.row}>
            <label className={styles.label}>
              Date of birth
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={styles.input}
              />
            </label>

            <label className={styles.label}>
              University
              <select
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className={styles.select}
              >
                <option value="">Select your university</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button className={styles.button} disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>

      <div className={styles.right}>
        <img
          src="/images/chemistry-right.svg"
          alt="Organic chemistry illustration"
          className={styles.hero}
        />
      </div>
    </div>
  );
};

export default Register;
