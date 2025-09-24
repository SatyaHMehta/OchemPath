"use client";

import React, { useState } from "react";
import styles from "./page.module.css";

const Dashboard = () => {
  const [numberOfQuestions, setNumberOfQuestions] = useState("");
  const [answersInput, setAnswersInput] = useState("");
  const [quizData, setQuizData] = useState(null);

  const handleNumberOfQuestionsChange = (e) => {
    setNumberOfQuestions(e.target.value);
  };

  const handleAnswersInputChange = (e) => {
    setAnswersInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Splitting the answers based on comma or space
    const answers = answersInput.replace(/\s/g, "").split(",");

    // Creating an array of questions based on the number of questions inputted
    const questions = [];
    for (let i = 1; i <= parseInt(numberOfQuestions); i++) {
      questions.push({
        id: i,
        options: ["A", "B", "C", "D", "E"],
        correctAnswer: answers[i - 1] || "A", // If answers array is shorter than numberOfQuestions, default to "A"
      });
    }

    setQuizData(questions);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h1>Make a new Quiz</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="How many Questions?"
            value={numberOfQuestions}
            onChange={handleNumberOfQuestionsChange}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Enter Answers"
            value={answersInput}
            onChange={handleAnswersInputChange}
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            Submit
          </button>
        </form>
        {quizData && (
          <div>
            <h2>Quiz Data:</h2>
            <ul>
              {quizData.map((question, index) => (
                <li key={index}>
                  <div>Question {question.id}</div>
                  <div>Options: {question.options.join(", ")}</div>
                  <div>Correct Answer: {question.correctAnswer}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
