"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

const Professor = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [questions, setQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "multiple_choice",
    choices: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    image: null,
    imagePreview: null,
  });
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    type: "practice",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch chapters when a course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse);
    } else {
      setChapters([]);
      setSelectedChapter("");
    }
  }, [selectedCourse]);

  // Fetch quizzes when a chapter is selected
  useEffect(() => {
    if (selectedChapter) {
      fetchQuizzes(selectedChapter);
    } else {
      setQuizzes([]);
      setSelectedQuiz("");
    }
  }, [selectedChapter]);

  // Fetch questions when a quiz is selected
  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions(selectedQuiz);
    } else {
      setQuestions([]);
    }
  }, [selectedQuiz]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        setError("Failed to fetch courses");
      }
    } catch (err) {
      setError("Error fetching courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setChapters(data);
      } else {
        setError("Failed to fetch chapters");
      }
    } catch (err) {
      setError("Error fetching chapters");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async (chapterId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quizzes?chapterId=${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        setError("Failed to fetch quizzes");
      }
    } catch (err) {
      setError("Error fetching quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (quizId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/questions?quizId=${quizId}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        setError("Failed to fetch questions");
      }
    } catch (err) {
      setError("Error fetching questions");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedChapter("");
    setSelectedQuiz("");
    setQuizzes([]);
    setQuestions([]);
  };

  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value);
    setSelectedQuiz("");
    setQuestions([]);
  };

  const handleQuizChange = (e) => {
    setSelectedQuiz(e.target.value);
  };

  const handleQuestionTextChange = (e) => {
    setNewQuestion({
      ...newQuestion,
      text: e.target.value,
    });
  };

  const handleQuestionTypeChange = (e) => {
    setNewQuestion({
      ...newQuestion,
      type: e.target.value,
    });
  };

  const handleChoiceTextChange = (index, value) => {
    const updatedChoices = [...newQuestion.choices];
    updatedChoices[index].text = value;
    setNewQuestion({
      ...newQuestion,
      choices: updatedChoices,
    });
  };

  const handleCorrectChoiceChange = (index) => {
    const updatedChoices = newQuestion.choices.map((choice, i) => ({
      ...choice,
      isCorrect: i === index,
    }));
    setNewQuestion({
      ...newQuestion,
      choices: updatedChoices,
    });
  };

  const addChoice = () => {
    setNewQuestion({
      ...newQuestion,
      choices: [...newQuestion.choices, { text: "", isCorrect: false }],
    });
  };

  const removeChoice = (index) => {
    if (newQuestion.choices.length <= 2) return;
    const updatedChoices = newQuestion.choices.filter((_, i) => i !== index);
    setNewQuestion({
      ...newQuestion,
      choices: updatedChoices,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewQuestion({
          ...newQuestion,
          image: file,
          imagePreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const createQuestion = async () => {
    if (!newQuestion.text.trim()) {
      setError("Question text is required");
      return;
    }

    if (newQuestion.choices.filter((choice) => choice.text.trim()).length < 2) {
      setError("At least two choices are required");
      return;
    }

    if (!newQuestion.choices.some((choice) => choice.isCorrect)) {
      setError("At least one correct answer is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("quizId", selectedQuiz);
      formData.append("text", newQuestion.text);
      formData.append("type", newQuestion.type);

      if (newQuestion.image) {
        formData.append("image", newQuestion.image);
      }

      // Add choices
      newQuestion.choices.forEach((choice, index) => {
        if (choice.text.trim()) {
          formData.append(`choices[${index}][text]`, choice.text);
          formData.append(`choices[${index}][isCorrect]`, choice.isCorrect);
        }
      });

      const response = await fetch("/api/questions", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("Question created successfully");
        setNewQuestion({
          text: "",
          type: "multiple_choice",
          choices: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
          image: null,
          imagePreview: null,
        });
        setShowQuestionModal(false);
        fetchQuestions(selectedQuiz); // Refresh questions
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create question");
      }
    } catch (err) {
      setError("Error creating question");
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    if (!newQuiz.title.trim()) {
      setError("Quiz title is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newQuiz.title,
          description: newQuiz.description,
          course_id: selectedCourse,
          chapter_id: selectedChapter,
          type: newQuiz.type,
        }),
      });

      if (response.ok) {
        const quizData = await response.json();
        setSuccess("Quiz created successfully");
        setNewQuiz({
          title: "",
          description: "",
          type: "practice",
        });
        setShowCreateQuizModal(false);
        fetchChapters(selectedCourse); // Refresh chapters to get new quiz
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create quiz");
      }
    } catch (err) {
      setError("Error creating quiz");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Question deleted successfully");
        fetchQuestions(selectedQuiz); // Refresh questions
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete question");
      }
    } catch (err) {
      setError("Error deleting question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Professor Dashboard</h1>
        <p>
          Add and manage practice questions and quiz questions for each chapter
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.dashboardGrid}>
        <div className={styles.card}>
          <h2>Course Selection</h2>
          <div className={styles.formGroup}>
            <label htmlFor="course-select">Select Course:</label>
            <select
              id="course-select"
              className={styles.formControl}
              value={selectedCourse}
              onChange={handleCourseChange}
            >
              <option value="">-- Select a Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Chapter Selection</h2>
          <div className={styles.formGroup}>
            <label htmlFor="chapter-select">Select Chapter:</label>
            <select
              id="chapter-select"
              className={styles.formControl}
              value={selectedChapter}
              onChange={handleChapterChange}
              disabled={!selectedCourse}
            >
              <option value="">-- Select a Chapter --</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Quiz Selection</h2>
          <div className={styles.formGroup}>
            <label htmlFor="quiz-select">Select Quiz:</label>
            <select
              id="quiz-select"
              className={styles.formControl}
              value={selectedQuiz}
              onChange={handleQuizChange}
              disabled={!selectedChapter}
            >
              <option value="">-- Select a Quiz --</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => setShowCreateQuizModal(true)}
            disabled={!selectedChapter}
          >
            Create New Quiz
          </button>
        </div>

        <div className={styles.card}>
          <h2>Question Management</h2>
          <button
            className={styles.btn}
            onClick={() => setShowQuestionModal(true)}
            disabled={!selectedQuiz}
          >
            Add New Question
          </button>
          <div className={styles.questionsList}>
            <h3>Existing Questions:</h3>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : questions.length > 0 ? (
              questions.map((question) => (
                <div key={question.id} className={styles.questionItem}>
                  <h4>Question: {question.text}</h4>
                  <ul>
                    {question.choices?.map((choice, index) => (
                      <li key={index}>
                        {choice.text} {choice.is_correct && "(Correct)"}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={() => deleteQuestion(question.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p>No questions found for this quiz.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Question</h2>
              <span
                className={styles.close}
                onClick={() => setShowQuestionModal(false)}
              >
                &times;
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="question-text">Question Text:</label>
              <textarea
                id="question-text"
                className={styles.formControl}
                value={newQuestion.text}
                onChange={handleQuestionTextChange}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="question-type">Question Type:</label>
              <select
                id="question-type"
                className={styles.formControl}
                value={newQuestion.type}
                onChange={handleQuestionTypeChange}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="short_answer">Short Answer</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Choices:</label>
              <div className={styles.choicesContainer}>
                {newQuestion.choices.map((choice, index) => (
                  <div key={index} className={styles.choiceItem}>
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={choice.isCorrect}
                      onChange={() => handleCorrectChoiceChange(index)}
                    />
                    <input
                      type="text"
                      className={styles.formControl}
                      value={choice.text}
                      onChange={(e) =>
                        handleChoiceTextChange(index, e.target.value)
                      }
                      placeholder={`Choice ${index + 1}`}
                    />
                    {newQuestion.choices.length > 2 && (
                      <button
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={() => removeChoice(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className={`${styles.btn} ${styles.addChoiceBtn}`}
                onClick={addChoice}
              >
                Add Choice
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="question-image">Question Image (Optional):</label>
              <input
                type="file"
                id="question-image"
                className={styles.formControl}
                accept="image/*"
                onChange={handleImageChange}
              />
              {newQuestion.imagePreview && (
                <img
                  src={newQuestion.imagePreview}
                  alt="Question preview"
                  className={styles.imagePreview}
                />
              )}
            </div>

            <button
              className={styles.btn}
              onClick={createQuestion}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Question"}
            </button>
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateQuizModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Create New Quiz</h2>
              <span
                className={styles.close}
                onClick={() => setShowCreateQuizModal(false)}
              >
                &times;
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quiz-title">Quiz Title:</label>
              <input
                type="text"
                id="quiz-title"
                className={styles.formControl}
                value={newQuiz.title}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, title: e.target.value })
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quiz-description">Description:</label>
              <textarea
                id="quiz-description"
                className={styles.formControl}
                value={newQuiz.description}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quiz-type">Quiz Type:</label>
              <select
                id="quiz-type"
                className={styles.formControl}
                value={newQuiz.type}
                onChange={(e) =>
                  setNewQuiz({ ...newQuiz, type: e.target.value })
                }
              >
                <option value="practice">Practice Quiz</option>
                <option value="official">Official Quiz</option>
              </select>
            </div>

            <button
              className={styles.btn}
              onClick={createQuiz}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Quiz"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Professor;
