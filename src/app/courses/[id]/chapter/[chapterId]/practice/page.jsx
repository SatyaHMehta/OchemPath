"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function PracticePage({ params }) {
  const { id, chapterId } = params;
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);

  // client-side fetch for courses (keeps this file simple)
  useEffect(() => {
    async function load() {
      try {
        const base =
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          "http://localhost:3000";
        const url = new URL("/api/courses", base);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = await res.json();
        const c = data.find((x) => String(x.id) === String(id));
        setCourse(c || null);
        setChapter(c?.chapters?.find((ch) => String(ch.id) === String(chapterId)) || null);
      } catch (e) {
        console.warn("Failed loading course", e);
      }
    }
    load();
  }, [id, chapterId]);

  // Placeholder practice questions with a correct index for demo
  const [questions] = useState([
    {
      id: 1,
      text: "Identify the aromatic ring shown (ignore substituents).",
      options: ["Cyclohexane", "Benzene", "Phenol", "Pyridine"],
      correctIndex: 1,
      image: null,
    },
    {
      id: 2,
      text: "Which hybridization most describes the carbon atoms in ethene?",
      options: ["sp^3", "sp^2", "sp", "It depends on resonance"],
      correctIndex: 1,
    },
    {
      id: 3,
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

  const [answers, setAnswers] = useState({}); // qid -> chosenIndex
  const [checked, setChecked] = useState(false);

  if (!course)
    return <div className={styles.notFound}>Loading course information…</div>;

  const select = (qid, optIndex) => {
    if (checked) return; // lock after check
    setAnswers((s) => ({ ...s, [qid]: optIndex }));
  };

  const resetAll = () => {
    setAnswers({});
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
  };

  const score = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    return { correct, total: questions.length };
  };

  const progress = (score().correct / Math.max(1, score().total)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>
            {course.name} — {chapter?.title ?? "Chapter"}
          </h1>
          <div className={styles.scoreBox}>
            <div className={styles.scoreText}>
              Score so far: <strong>{`${score().correct} / ${score().total}`}</strong>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <section className={styles.practice}>
          <ol className={styles.questionsList}>
            {questions.map((q) => (
              <li key={q.id} className={styles.questionCard}>
                <div className={styles.qTop}>
                  <div className={styles.qIndex}>Question {q.id}</div>
                  <div className={styles.qText}>{q.text}</div>
                </div>

                {q.image && (
                  <div className={styles.qImage}>
                    <img src={q.image} alt="question" />
                  </div>
                )}

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
              </li>
            ))}
          </ol>

          <div className={styles.actionsRow}>
            <button className={styles.primary} onClick={() => (window.location.href = `/courses/${id}/chapter/${chapterId}/quiz`)}>
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
          <div className={styles.sidebarSub}>Chapter 1 • Practice</div>
          <div className={styles.dotsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={styles.dot} />
            ))}
          </div>
        </div>

        <div className={styles.tipsCard}>
          <h4>Tips for this Chapter</h4>
          <ul>
            <li>Review s, p, and hybrid orbitals (sp, sp2, sp3).</li>
            <li>Memorize common aromatic systems (benzene, pyridine).</li>
            <li>Relate electronegativity to bond polarity and dipoles.</li>
            <li>Practice identifying sigma vs pi bonds in drawings.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
