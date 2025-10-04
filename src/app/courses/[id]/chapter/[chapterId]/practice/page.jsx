"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function PracticePage({ params }) {
  const { id, chapterId } = params || {};
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [questions, setQuestions] = useState(null); // null = loading, [] = loaded but empty
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoadError(null);
      try {
        // Optional: fetch course metadata so header shows names (non-fatal)
        try {
          const base =
            process.env.NEXT_PUBLIC_BASE_URL ||
            process.env.NEXTAUTH_URL ||
            "http://localhost:3000";
          const coursesRes = await fetch(
            new URL("/api/courses", base).toString()
          );
          if (coursesRes.ok) {
            const data = await coursesRes.json();
            const c = Array.isArray(data)
              ? data.find((x) => String(x.id) === String(id))
              : null;
            setCourse(c || null);
            setChapter(
              c?.chapters?.find((ch) => String(ch.id) === String(chapterId)) ||
                null
            );
          }
        } catch (e) {
          // ignore metadata failures
          console.warn("Failed loading course metadata", e);
        }

        // Load practice quiz first
        let quizzes = [];
        let res = await fetch(
          `/api/chapters/${chapterId}/quizzes?practice=true`
        );
        if (res.ok) {
          quizzes = await res.json();
        } else {
          const text = await res.text().catch(() => null);
          console.warn(
            "Practice fetch failed",
            res.status,
            res.statusText,
            text
          );
        }

        // If no practice quizzes, fall back to any quiz for the chapter
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
          res = await fetch(`/api/chapters/${chapterId}/quizzes`);
          if (res.ok) {
            quizzes = await res.json();
          } else {
            const text = await res.text().catch(() => null);
            console.warn("Chapter quizzes fetch failed", res.status, text);
          }
        }

        const quiz =
          Array.isArray(quizzes) && quizzes.length ? quizzes[0] : null;
        if (quiz && Array.isArray(quiz.questions)) {
          const mapped = quiz.questions.map((q) => {
            const opts = (q.choices || []).map((c) => ({
              text: c.text,
              image: c.image_url || null,
            }));
            const correctIndex = (q.choices || []).findIndex(
              (c) => c.is_correct
            );
            return {
              id: q.id,
              text: q.text,
              options: opts.length
                ? opts
                : [
                    { text: "True", image: null },
                    { text: "False", image: null },
                  ],
              correctIndex: correctIndex >= 0 ? correctIndex : null,
              image: q.image_url || null,
            };
          });
          setQuestions(mapped);
          setLoadError(null);
          return;
        }

        // no quiz found -> empty list and error message for debugging
        console.warn(
          "No practice or chapter quizzes found for chapter",
          chapterId
        );
        setLoadError("No practice or chapter quizzes found for this chapter");
        setQuestions([]);
      } catch (e) {
        console.warn("Failed loading quizzes", e);
        setLoadError(String(e));
        setQuestions([]);
      }
    }

    // reset transient UI state and load
    setAnswers({});
    setChecked(false);
    setQuestions(null);
    load();
  }, [id, chapterId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setZoomImage(null);
    }
    if (zoomImage) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomImage]);

  if (questions === null)
    return <div className={styles.notFound}>Loading…</div>;
  if (Array.isArray(questions) && questions.length === 0)
    return (
      <div className={styles.notFound}>
        <h3>No practice quiz found</h3>
        <p>{loadError ?? "There is no practice quiz for this chapter yet."}</p>
      </div>
    );

  const select = (qid, optIndex) => {
    if (checked) return;
    setAnswers((s) => ({ ...s, [qid]: optIndex }));
  };

  const resetAll = () => {
    setAnswers({});
    setChecked(false);
  };
  const check = () => setChecked(true);

  const total = (questions || []).length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / Math.max(1, total)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>
            {course?.name ?? "Course"} — {chapter?.title ?? "Chapter"}
          </h1>
          <div className={styles.scoreBox}>
            <div className={styles.scoreText}>
              Answered: <strong>{answeredCount} / {total}</strong>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progress}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <section className={styles.practice}>
          <div className={styles.scrollArea}>
          <ol className={styles.questionsList}>
            {(questions || []).map((q) => (
              <li key={q.id} className={styles.questionCard}>
                <div className={styles.qIndex}>Question</div>

                {q.image && (
                  <div className={styles.qImage}>
                    <img
                      src={q.image}
                      alt={`question-${q.id}`}
                      role="button"
                      tabIndex={0}
                      crossOrigin="anonymous"
                      onClick={() => setZoomImage(q.image)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setZoomImage(q.image);
                      }}
                      onError={(e) => {
                        console.error("Image failed to load:", q.image);
                        e.target.style.display = "none"; // Hide broken image
                      }}
                    />
                  </div>
                )}

                <div>
                  <div className={styles.qText}>{q.text}</div>
                  <div className={styles.optionsGrid}>
                    {q.options.map((opt, idx) => {
                      const chosen = answers[q.id] === idx;
                      const isCorrect = q.correctIndex === idx;
                      const showCorrect = checked && isCorrect;
                      const showWrong = checked && chosen && !isCorrect;
                      const cls = [styles.optButton];
                      if (chosen) cls.push(styles.optSelected);
                      if (showCorrect) cls.push(styles.optCorrect);
                      if (showWrong) cls.push(styles.optWrong);

                      const optionText =
                        typeof opt === "string" ? opt : opt.text;
                      const optionImage =
                        typeof opt === "object" ? opt.image : null;

                      return (
                        <button
                          key={idx}
                          className={cls.join(" ")}
                          onClick={() => select(q.id, idx)}
                          type="button"
                        >
                          <span className={styles.optLabel}>{optionText}</span>
                          {optionImage && (
                            <div className={styles.optImage}>
                              <img
                                src={optionImage}
                                alt={`Option ${String.fromCharCode(65 + idx)}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomImage(optionImage);
                                }}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {checked && (
                    <div className={styles.feedback}>
                      {answers[q.id] === q.correctIndex ? (
                        <span className={styles.feedbackCorrect}>Correct.</span>
                      ) : (
                        <span className={styles.feedbackWrong}>
                          Not quite. The correct answer is highlighted.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          </div>

          <div className={styles.actionsRow}>
            <button
              className={styles.primary}
              onClick={() =>
                (window.location.href = `/courses/${id}/chapter/${chapterId}/quiz`)
              }
            >
              Chapter Quiz
            </button>
            <button className={styles.secondary} onClick={resetAll}>
              Reset All
            </button>
            <button className={styles.ghost} onClick={check} disabled={checked}>
              Check Answers
            </button>
          </div>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarHeader}>Organic Chemistry</div>
          <div className={styles.sidebarSub}>Practice</div>
        </div>
        <div className={styles.tipsCard}>
          <h4>Tips</h4>
          <ul>
            <li>Review hybridization.</li>
            <li>Practice aromatic recognition.</li>
          </ul>
        </div>
      </aside>

      {zoomImage && (
        <div
          className={styles.zoomOverlay}
          onClick={() => setZoomImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={zoomImage} alt="Zoomed" className={styles.zoomImg} />
        </div>
      )}
    </div>
  );
}
