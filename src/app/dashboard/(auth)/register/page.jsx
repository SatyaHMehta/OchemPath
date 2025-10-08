"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import UniversitySelect from "@/components/university-select/UniversitySelect";
import { getSiteUrl } from "@/utils/siteUrl";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState([]);
  const [role, setRole] = useState("student");
  // Student fields
  const [studentId, setStudentId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState("");
  // Professor fields
  const [profTitle, setProfTitle] = useState("");
  const [profDepartment, setProfDepartment] = useState("");
  const [profInstitution, setProfInstitution] = useState("");
  const [profWebsiteUrl, setProfWebsiteUrl] = useState("");
  const [profBio, setProfBio] = useState("");
  // Guest fields
  const [guestAccessLevel, setGuestAccessLevel] = useState("trial");
  const [guestInterests, setGuestInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Universities are now fetched inside UniversitySelect for better UX.

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setLoading(false);
      return setError("Passwords do not match");
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setError(error.message);

    // If signup succeeded, create a profile row with selected role
    try {
      const userId = data.user?.id;
      if (userId) {
        // Minimal profile update: rely on DB trigger for base row; set role/university/details now.
        await supabase
          .from("profiles")
          .update({
            role: role || "student",
            display_name:
              `${firstName || ""} ${lastName || ""}`.trim() ||
              email.split("@")[0],
            first_name: firstName || null,
            last_name: lastName || null,
            dob: dob || null,
            university_id: universityId || null,
          })
          .eq("id", userId);

        // Role-specific inserts
        try {
          if (role === "student") {
            await supabase.from("student_profiles").upsert({
              user_id: userId,
              student_id: studentId || null,
              subscription_tier: subscriptionTier || "free",
              subscription_expires_at: subscriptionExpiresAt || null,
            });
          } else if (role === "professor") {
            await supabase.from("professor_profiles").upsert({
              user_id: userId,
              title: profTitle || null,
              department: profDepartment || null,
              institution: profInstitution || null,
              website_url: profWebsiteUrl || null,
              bio: profBio || null,
            });
          } else if (role === "guest") {
            await supabase.from("guest_profiles").upsert({
              user_id: userId,
              access_level: guestAccessLevel || "trial",
              interests: guestInterests
                ? guestInterests
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : null,
            });
          }
        } catch (e) {
          console.warn("role profile create error", e?.message || e);
        }
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
          <button
            type="button"
            className={styles.button}
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${getSiteUrl()}/dashboard`,
                  },
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
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            required
          />

          <label className={styles.label}>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={styles.select}
            >
              <option value="student">Student</option>
              <option value="professor">Professor</option>
              <option value="guest">Guest</option>
            </select>
          </label>

          <div className={styles.row}>
            <label className={styles.label}>
              Date of birth
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={styles.input}
                required
              />
            </label>

            <UniversitySelect
              value={universityId}
              onChange={setUniversityId}
              required={role === "student"}
            />
          </div>

          {role === "student" && (
            <div className={styles.row}>
              <input
                type="text"
                placeholder="Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={styles.input}
                required
              />
              <label className={styles.label}>
                Subscription tier
                <select
                  value={subscriptionTier}
                  onChange={(e) => setSubscriptionTier(e.target.value)}
                  className={styles.select}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
              <label className={styles.label}>
                Subscription expires at
                <input
                  type="datetime-local"
                  value={subscriptionExpiresAt}
                  onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
                  className={styles.input}
                />
              </label>
            </div>
          )}

          {role === "professor" && (
            <div className={styles.row}>
              <input
                type="text"
                placeholder="Title"
                value={profTitle}
                onChange={(e) => setProfTitle(e.target.value)}
                className={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Department"
                value={profDepartment}
                onChange={(e) => setProfDepartment(e.target.value)}
                className={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Institution"
                value={profInstitution}
                onChange={(e) => setProfInstitution(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          )}

          {role === "professor" && (
            <div className={styles.row}>
              <input
                type="url"
                placeholder="Website URL (optional)"
                value={profWebsiteUrl}
                onChange={(e) => setProfWebsiteUrl(e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Short bio (optional)"
                value={profBio}
                onChange={(e) => setProfBio(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          {role === "guest" && (
            <div className={styles.row}>
              <label className={styles.label}>
                Access level
                <select
                  value={guestAccessLevel}
                  onChange={(e) => setGuestAccessLevel(e.target.value)}
                  className={styles.select}
                >
                  <option value="trial">Trial</option>
                  <option value="free">Free</option>
                </select>
              </label>
              <input
                type="text"
                placeholder="Interests (comma-separated)"
                value={guestInterests}
                onChange={(e) => setGuestInterests(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

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
