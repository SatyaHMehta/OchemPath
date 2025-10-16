"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import supabase from "@/lib/supabaseClient";

function Initials({ name }) {
  const initials = useMemo(() => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const a = parts[0]?.[0] || "";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase() || "U";
  }, [name]);
  return <div className={styles.avatar}>{initials}</div>;
}

export default function StudentDashboard() {
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userId, setUserId] = useState("");
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [progressData, setProgressData] = useState({ courses: [] });
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseStats, setCourseStats] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!mounted) return;
        if (user) {
          setUserId(user.id);
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, first_name, last_name")
            .eq("id", user.id)
            .maybeSingle();
          const bestName =
            prof?.display_name?.trim() ||
            `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim() ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "there";
          setDisplayName(bestName);
        } else {
          setDisplayName("there");
        }
      } catch {
        setDisplayName("there");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load recent activity (submissions) for the current user
  useEffect(() => {
    if (!userId) return; // Don't fetch until we have a userId
    let canceled = false;
    async function load() {
      setActivityLoading(true);
      try {
        const url = `/api/student/activity?userId=${userId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!canceled)
          setActivity(Array.isArray(json.activity) ? json.activity : []);
      } catch (err) {
        if (!canceled) setActivity([]);
      } finally {
        if (!canceled) setActivityLoading(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, [userId]);

  // Load progress data (needed for both dashboard and progress tab)
  useEffect(() => {
    if (!userId) return;
    let canceled = false;
    async function load() {
      setProgressLoading(true);
      try {
        const url = `/api/student/progress?userId=${userId}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!canceled) {
          const courses = Array.isArray(json.courses) ? json.courses : [];
          setProgressData({ courses });
          if (!selectedCourseId && courses.length)
            setSelectedCourseId(courses[0].id);
        }
      } catch {
        if (!canceled) setProgressData({ courses: [] });
      } finally {
        if (!canceled) setProgressLoading(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, [userId]);

  // Fetch course statistics (total quizzes available)
  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        const res = await fetch("/api/student/course-stats", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!canceled) {
          setCourseStats(json.courseStats || {});
        }
      } catch {
        if (!canceled) setCourseStats({});
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  // Mock data for now
  const currentCourse = {
    title: "Organic Chem I — Chapter 2",
    subtitle: "Stereochemistry: R/S and wedges/dashes",
    progress: 72,
  };
  const recent = activity;

  // Calculate course progress: (quizzes_with_80+_score / quizzes_attempted) * 100
  const calculateCourseProgress = (courseId) => {
    const course = progressData.courses.find((c) => c.id === courseId);
    if (!course || course.quizzes.length === 0) return 0;

    // Count unique quizzes where best attempt score >= 80
    const masteredQuizzes = new Set();
    for (const quiz of course.quizzes) {
      const bestScore = Math.max(...quiz.attempts.map((a) => a.score || 0));
      if (bestScore >= 80) {
        masteredQuizzes.add(quiz.id);
      }
    }

    // Progress based on quizzes attempted, not total in system
    const progress = Math.round(
      (masteredQuizzes.size / course.quizzes.length) * 100
    );
    console.log("[progress-calc]", courseId, {
      attemptedQuizzes: course.quizzes.length,
      masteredQuizzes: masteredQuizzes.size,
      allQuizzes: course.quizzes.map((q) => ({
        id: q.id,
        title: q.title,
        attempts: q.attempts.length,
        bestScore: Math.max(...q.attempts.map((a) => a.score || 0)),
      })),
      progress,
    });
    return progress;
  };

  // Get unique courses with progress data
  const coursesWithProgress = progressData.courses.map((course) => ({
    id: course.id,
    title: course.title,
    progress: calculateCourseProgress(course.id),
  }));

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>OchemPath</div>
        <nav className={styles.sideNav}>
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "courses", label: "My Courses", soon: true },
            { key: "practice", label: "Practice", soon: true },
            { key: "assignments", label: "Assignments", soon: true },
            { key: "progress", label: "Progress", soon: false },
            { key: "settings", label: "Settings", soon: true },
          ].map((t) => (
            <button
              key={t.key}
              className={[
                styles.sideItem,
                activeTab === t.key ? styles.sideItemActive : "",
              ].join(" ")}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.soon && <span className={styles.soon}>coming soon</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        {activeTab !== "dashboard" ? (
          <div className={styles.comingSoonWrap}>
            {activeTab === "progress" ? (
              <div className={styles.card} style={{ width: "100%" }}>
                <div className={styles.sectionTitle}>Progress</div>
                {progressLoading ? (
                  <div>Loading…</div>
                ) : progressData.courses.length === 0 ? (
                  <div>No quiz attempts yet.</div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "260px 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label className={styles.small}>Courses</label>
                      <select
                        className={styles.select}
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                      >
                        {progressData.courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {progressData.courses
                        .filter((c) => c.id === selectedCourseId)
                        .map((c) => (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            {c.quizzes.length === 0 ? (
                              <div>No quizzes in this course yet.</div>
                            ) : (
                              c.quizzes.map((q) => (
                                <div key={q.id} className={styles.subCard}>
                                  <div className={styles.sectionHeader}>
                                    <div style={{ fontWeight: 600 }}>
                                      {q.title}
                                    </div>
                                    <div className={styles.small}>
                                      Attempts: {q.attempts.length}
                                    </div>
                                  </div>
                                  <div className={styles.sectionBody}>
                                    {q.attempts.length === 0 ? (
                                      <div className={styles.small}>
                                        No attempts yet.
                                      </div>
                                    ) : (
                                      <div className={styles.attemptsList}>
                                        {q.attempts.map((a) => (
                                          <div
                                            key={a.id}
                                            className={styles.attemptRow}
                                          >
                                            <div className={styles.small}>
                                              {new Date(a.at).toLocaleString()}
                                            </div>
                                            <div className={styles.mono}>
                                              {typeof a.score === "number"
                                                ? `${Math.round(a.score)}%`
                                                : "—"}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.comingSoonCard}>
                <div className={styles.comingSoonTitle}>
                  {{
                    courses: "My Courses",
                    practice: "Practice",
                    assignments: "Assignments",
                    progress: "Progress",
                    settings: "Settings",
                  }[activeTab] || ""}
                </div>
                <div className={styles.comingSoonSubtitle}>
                  This section is coming soon.
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <header className={styles.header}>
              <div className={styles.welcome}>
                <Initials name={displayName} />
                <div>
                  <div
                    className={styles.welcomeTitle}
                  >{`Welcome back, ${displayName}!`}</div>
                  <div className={styles.welcomeSub}>
                    Pick up where you left off or review your progress.
                  </div>
                </div>
              </div>
            </header>

            <section className={styles.topGrid}>
              <div className={styles.card}>
                <div className={styles.courseRow}>
                  <div className={styles.mediaPlaceholder} aria-hidden="true" />
                  <div className={styles.courseMeta}>
                    <div className={styles.courseTitle}>
                      {currentCourse.title}
                    </div>
                    <div className={styles.courseSubtitle}>
                      {currentCourse.subtitle}
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressInner}
                        style={{ width: `${currentCourse.progress}%` }}
                      />
                    </div>
                    <div className={styles.actionRow}>
                      <button className={`${styles.btn} ${styles.btnPrimary}`}>
                        Resume video
                      </button>
                      <button className={styles.btn}>Practice chapter</button>
                    </div>
                    <div className={styles.nextUp}>
                      <ul>
                        <li>Checkpoint quiz • 10 Q</li>
                        <li>SN2 vs E2 quick drill • 6 Q</li>
                        <li>Rewatch: Stereochem pitfalls • 4 min</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.sectionTitle}>Progress overview</div>
                <div className={styles.streakDots}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className={styles.dot}
                      data-on={i < 10 ? "" : undefined}
                    />
                  ))}
                </div>
                <div className={styles.kvRow}>
                  <div className={styles.kvLabel}>Courses</div>
                  <div className={styles.kvBars}>
                    {coursesWithProgress.length > 0 ? (
                      coursesWithProgress.map((course) => (
                        <div key={course.id} className={styles.kvItem}>
                          <div className={styles.kvName}>
                            {course.title} — {course.progress}%
                          </div>
                          <div className={styles.kvBar}>
                            <span style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.small}>
                        No quiz attempts yet. Complete a quiz to see your
                        progress.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.sectionTitle}>Recent activity</div>
              {activityLoading ? (
                <div>Loading…</div>
              ) : recent.length ? (
                <div className={styles.activityList}>
                  {recent.map((a, i) => (
                    <div className={styles.activityRow} key={i}>
                      <div>
                        <div className={styles.activityTitle}>{a.title}</div>
                        <div className={styles.activityMeta}>{a.meta}</div>
                      </div>
                      <div className={styles.activityWhen}>
                        {new Date(a.when).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.small}>
                  No activity yet. Take a quiz to see it here.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
