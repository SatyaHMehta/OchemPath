"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function QuizPage({ params }) {
  const { id, chapterId } = params;
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch(`/api/chapters/${chapterId}/quizzes`);
      if (!res.ok) return setLoading(false);
      const data = await res.json();
      // pick the first quiz
      const q = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setQuiz(q);
      setLoading(false);
    };
    load();
  }, [chapterId]);

  const select = (qid, choiceId) =>
    setAnswers((s) => ({ ...s, [qid]: choiceId }));

  const submit = async () => {
    if (!quiz) return setResult({ error: "No quiz available" });
    // Try to get session to associate user
    const { data: sessionData } = await supabase.auth.getSession();
    const user_id = sessionData?.session?.user?.id || null;

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
    if (!res.ok) return setResult({ error: "Submission failed" });
    const data = await res.json();
    // Call grade endpoint
    await fetch("/api/grade", {
      method: "POST",
      body: JSON.stringify({ submission_id: data.submission.id }),
      headers: { "content-type": "application/json" },
    });
    setResult({ success: true });
  };

  if (loading) return <div className={styles.container}>Loading quiz...</div>;
  if (!quiz)
    return (
      <div className={styles.container}>No quiz found for this chapter.</div>
    );

  return (
    <div className={styles.container}>
      <h1>{quiz.title || "Chapter Quiz"}</h1>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {quiz.questions.map((q) => (
          <div key={q.id} className={styles.question}>
            <div className={styles.qText}>{q.text}</div>
            <div className={styles.options}>
              {(q.choices || []).map((c) => (
                <label key={c.id}>
                  <input
                    type="radio"
                    name={q.id}
                    onChange={() => select(q.id, c.id)}
                  />{" "}
                  {c.text}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className={styles.submit}>
          Submit
        </button>
      </form>
      {result && result.success && (
        <div className={styles.result}>Submitted and graded.</div>
      )}
      {result && result.error && (
        <div className={styles.error}>{result.error}</div>
      )}
    </div>
  );
}
