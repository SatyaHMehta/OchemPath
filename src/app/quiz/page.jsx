"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

function toFraction(correctAnswers, totalQuestions) {
  if (totalQuestions === 0) return "0/1";
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(correctAnswers, totalQuestions);
  return `${correctAnswers / divisor}/${totalQuestions / divisor}`;
}

const IRATQuiz = () => {
  // Sample quiz questions and answers
  const questions = [
    {
      id: 1,
      options: ["A", "B", "C", "D", "E"],
      correctAnswer: "B",
    },
    {
      id: 2,
      options: ["A", "B", "C", "D", "E"],
      correctAnswer: "A",
    },
    {
      id: 3,
      options: ["A", "B", "C", "D", "E"],
      correctAnswer: "A",
    },
    {
      id: 4,
      options: ["A", "B", "C", "D", "E"],
      correctAnswer: "A",
    },
    // Add more questions as needed
  ];

  // State to manage selected answers and score
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Function to handle selecting an answer
  const handleSelectAnswer = (questionId, selectedOption) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: selectedOption,
    });
  };

  // Function to submit the quiz
  const handleSubmitQuiz = () => {
    // Calculate score
    let totalQuestions = questions.length;
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    // Display score
    let resultFraction = toFraction(correctAnswers, totalQuestions);
    let percentage = (correctAnswers / totalQuestions) * 100;
    let message = "";
    if (percentage === 100) {
      message = "Perfect!";
    } else if (percentage >= 90 && percentage <= 99) {
      message = "Amazing job!";
    } else if (percentage >= 70 && percentage <= 89) {
      message = "Good job! You almost had it!";
    } else if (percentage >= 51 && percentage <= 69) {
      message = "Not bad! Prepare a little better next time!";
    } else {
      message = "Prepare better next time!";
    }

    // Set score state
    if (resultFraction === "0/1") {
      setScore({
        result: 0,
        message: message,
      });
    } else if (resultFraction === "1/1") {
      setScore({
        message: message,
      });
    } else {
      setScore({
        result: resultFraction,
        message: message,
      });
    }

    // Set submitted state to true
    setSubmitted(true);
  };

  return (
    <div className={styles.container}>
      <h1>iRAT Quiz</h1>
      {!submitted && (
        <form className={styles.form}>
          {questions.map((question) => (
            <div key={question.id} className={styles.question}>
              <p>Question {question.id}</p>
              <div className={styles.options}>
                {question.options.map((option) => (
                  <label key={option} className={styles.option}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      onChange={() => handleSelectAnswer(question.id, option)}
                      checked={selectedAnswers[question.id] === option}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmitQuiz}
          >
            Submit
          </button>
        </form>
      )}
      {score && Object.keys(score).length > 0 && (
        <div className={styles.result}>
          <h2>Result</h2>
          <p>{score.message}</p>
          <p>{score.result}</p>
        </div>
      )}
    </div>
  );
};

export default IRATQuiz;
