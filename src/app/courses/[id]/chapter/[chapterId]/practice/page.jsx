"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function PracticePage({ params }) {
  const { id, chapterId } = params || {};

  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Try to fetch course metadata (optional)
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
          // non-fatal
        }

        // Load quizzes for chapter
        const res = await fetch(`/api/chapters/${chapterId}/quizzes`);
        if (res.ok) {
          const quizzes = await res.json();
          const quiz =
            Array.isArray(quizzes) && quizzes.length ? quizzes[0] : null;
          if (quiz && Array.isArray(quiz.questions)) {
            const mapped = quiz.questions.map((q) => {
              const opts = (q.choices || []).map((c) => c.text);
              const correctIndex = (q.choices || []).findIndex(
                (c) => c.is_correct
              );
              return {
                id: q.id,
                text: q.text,
                options: opts.length ? opts : ["True", "False"],
                correctIndex: correctIndex >= 0 ? correctIndex : null,
                image: q.image || null,
              };
            });
            setQuestions(mapped);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed loading quizzes", e);
      }

      // fallback mock questions
      setQuestions([
        {
          id: "m-1",
          text: "Identify the aromatic ring shown (ignore substituents).",
          options: ["Cyclohexane", "Benzene", "Phenol", "Pyridine"],
          correctIndex: 1,
          image: "/images/chemistry-right.svg",
        },
        {
          id: "m-2",
          text: "Which hybridization most describes the carbon atoms in ethene?",
          options: ["sp^3", "sp^2", "sp", "It depends on resonance"],
          correctIndex: 1,
        },
        {
          id: "m-3",
          text: "Which statement about electronegativity and bond polarity is TRUE?",
          options: [
            "Bonds between identical atoms are always polar.",
            "Greater electronegativity difference increases bond polarity.",
            "A polar bond always makes the whole molecule polar.",
            "Electronegativity is unrelated to electron density.",
          ],
          correctIndex: 1,
        },
      ]);
    }

    setAnswers({});
    setChecked(false);
    load();
  }, [id, chapterId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setZoomImage(null);
    }
    if (zoomImage) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomImage]);

  if (!questions) return <div className={styles.notFound}>Loading…</div>;

  const select = (qid, optIndex) => {
    if (checked) return;
    setAnswers((s) => ({ ...s, [qid]: optIndex }));
  };

  const resetAll = () => {
    setAnswers({});
    setChecked(false);
  };
  const check = () => setChecked(true);

  const score = () => {
    let correct = 0;
    (questions || []).forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    return { correct, total: (questions || []).length };
  };

  const progress = (score().correct / Math.max(1, score().total)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>
            {course?.name ?? "Course"} — {chapter?.title ?? "Chapter"}
          </h1>
          <div className={styles.scoreBox}>
            <div className={styles.scoreText}>
              Score: <strong>{`${score().correct} / ${score().total}`}</strong>
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
                      onClick={() => setZoomImage(q.image)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setZoomImage(q.image);
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
                      return (
                        <button
                          key={idx}
                          className={cls.join(" ")}
                          onClick={() => select(q.id, idx)}
                          type="button"
                        >
                          <span className={styles.optLabel}>{opt}</span>
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
