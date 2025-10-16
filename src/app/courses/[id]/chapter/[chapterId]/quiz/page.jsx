"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function QuizPage({ params }) {
  const { id, chapterId } = params;
  const [quiz, setQuiz] = useState(null); // quiz object with questions
  const [answers, setAnswers] = useState({}); // question_id -> choice_id
  const [checked, setChecked] = useState(false); // when quiz submitted
  const [showReview, setShowReview] = useState(false); // review overlay toggle
  const [result, setResult] = useState(null); // { success?, error? }
  const [loading, setLoading] = useState(true); // loading state
  const [zoomImage, setZoomImage] = useState(null); // image zoom src
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // First try to fetch explicit chapter (non-practice) quizzes
        let res = await fetch(
          `/api/chapters/${chapterId}/quizzes?practice=false`
        );
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        // Fallback to any quiz if no chapter quiz found
        if (!Array.isArray(data) || data.length === 0) {
          res = await fetch(`/api/chapters/${chapterId}/quizzes`);
          if (res.ok) {
            data = await res.json();
          }
        }
        const q = Array.isArray(data) && data.length ? data[0] : null;
        setQuiz(q);
      } catch (e) {
        console.warn("Quiz load failed", e);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterId]);

  const select = (qid, choiceId) => {
    if (checked) return; // lock after submission
    setAnswers((s) => ({ ...s, [qid]: choiceId }));
  };

  const submit = async () => {
    if (!quiz) return setResult({ error: "No quiz available" });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user_id = sessionData?.session?.user?.id || null;
      if (!user_id) {
        setResult({
          error:
            "You must be logged in to submit a quiz. Please sign in and try again.",
        });
        return;
      }
      const body = {
        quiz_id: quiz.id,
        user_id,
        answers: Object.entries(answers).map(([question_id, choice_id]) => ({
          question_id,
          choice_id,
        })),
        finished_at: new Date().toISOString(),
      };
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Submission error:", err);
        return setResult({ error: "Submission failed" });
      }
      const data = await res.json();

      const gradeRes = await fetch("/api/grade", {
        method: "POST",
        body: JSON.stringify({ submission_id: data.submission.id }),
        headers: { "content-type": "application/json" },
      });
      const gradeData = await gradeRes.json();
      if (!gradeRes.ok) {
        console.error("Grading failed:", gradeData.error);
        return setResult({ error: "Grading failed: " + gradeData.error });
      }

      setResult({ success: true });
      setChecked(true);
    } catch (e) {
      console.error(e);
      setResult({ error: "Submission failed" });
    }
  };

  if (loading) return <div className={styles.loadingWrap}>Loading…</div>;
  if (!quiz)
    return (
      <div className={styles.loadingWrap}>No quiz found for this chapter.</div>
    );

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / Math.max(1, total)) * 100;

  const score = () => {
    if (!checked) return null;
    let correct = 0;
    questions.forEach((q) => {
      const chosen = answers[q.id];
      if (!chosen) return;
      const choice = (q.choices || []).find((c) => c.id === chosen);
      if (choice?.is_correct) correct += 1;
    });
    return { correct, total };
  };
  const scoreObj = score();
  const scorePct = scoreObj
    ? (scoreObj.correct / Math.max(1, scoreObj.total)) * 100
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{quiz.title || "Chapter Quiz"}</h1>
          <div className={styles.scoreBox}>
            {checked ? (
              <div className={styles.scoreText}>
                Score:{" "}
                <strong>
                  {scoreObj.correct} / {scoreObj.total}
                </strong>
              </div>
            ) : (
              <div className={styles.scoreText}>
                Answered: {answeredCount} / {total}
              </div>
            )}
            <div className={styles.progressBar}>
              <div
                className={styles.progress}
                style={{ width: `${checked ? scorePct : progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <section className={styles.quizSection}>
          <ol className={styles.questionsList}>
            {questions.map((q, idx) => (
              <li key={q.id} className={styles.questionCard} data-qid={q.id}>
                <div className={styles.qIndex}>Question {idx + 1}</div>
                {q.image_url && (
                  <div className={styles.qImage}>
                    <img
                      src={q.image_url}
                      alt={`question-${idx + 1}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setZoomImage(q.image_url)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setZoomImage(q.image_url);
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className={styles.qText}>{q.text}</div>
                <div className={styles.optionsGrid}>
                  {(q.choices || []).map((c, cIdx) => {
                    const chosen = answers[q.id] === c.id;
                    const isCorrect = checked && c.is_correct;
                    const isWrong = checked && chosen && !c.is_correct;
                    const cls = [styles.optButton];
                    if (chosen) cls.push(styles.optSelected);
                    if (isCorrect) cls.push(styles.optCorrect);
                    if (isWrong) cls.push(styles.optWrong);
                    const choiceImg = c.image_url;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={cls.join(" ")}
                        onClick={() => select(q.id, c.id)}
                      >
                        <span className={styles.optLabel}>
                          {String.fromCharCode(65 + cIdx)}) {c.text}
                        </span>
                        {choiceImg && (
                          <div className={styles.optImage}>
                            <img
                              src={choiceImg}
                              alt={`choice-${cIdx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomImage(choiceImg);
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
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
                    {(q.choices || []).some(
                      (c) => c.is_correct && c.id === answers[q.id]
                    ) ? (
                      <span className={styles.feedbackCorrect}>Correct.</span>
                    ) : answers[q.id] ? (
                      <span className={styles.feedbackWrong}>Not quite.</span>
                    ) : (
                      <span className={styles.feedbackWrong}>
                        No answer selected.
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className={styles.actionsRow}>
            <button
              className={styles.secondary}
              onClick={() => {
                setAnswers({});
                setChecked(false);
                setResult(null);
              }}
            >
              Reset
            </button>
            <button
              className={styles.ghost}
              onClick={() => setShowReview(true)}
              disabled={checked}
            >
              Review & Submit
            </button>
          </div>
          {result?.error && <div className={styles.error}>{result.error}</div>}
          {result?.success && (
            <div className={styles.result}>Submitted & graded.</div>
          )}
        </section>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarHeader}>Chapter Quiz</div>
          <div className={styles.sidebarSub}>{quiz.title}</div>
          <div className={styles.dotsRow}>
            {questions.map((q) => (
              <div
                key={q.id}
                className={`${styles.dot} ${
                  answers[q.id] ? styles.answeredDot : ""
                }`}
              ></div>
            ))}
          </div>
        </div>
      </aside>

      {showReview && !checked && (
        <div className={styles.reviewOverlay}>
          <div className={styles.reviewCard}>
            <h3>Review & Submit</h3>
            <div className={styles.progressBar}>
              <div
                className={styles.progress}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className={styles.questionsOverview}>
              {questions.map((q, i) => (
                <div key={q.id} className={styles.reviewRow}>
                  <div className={styles.qNumSmall}>{i + 1}</div>
                  <div className={styles.qTextSmall}>{q.text}</div>
                  <div>
                    {answers[q.id] ? (
                      <span className={styles.badgeGreen}>Answered</span>
                    ) : (
                      <span className={styles.badgeRed}>Unanswered</span>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setShowReview(false);
                        document
                          .querySelector(`[data-qid='${q.id}']`)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                    >
                      Go to
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.reviewActions}>
              <button
                className={styles.ghost}
                onClick={() => setShowReview(false)}
              >
                Back
              </button>
              <button
                className={styles.primary}
                onClick={submit}
                disabled={answeredCount === 0}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

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
