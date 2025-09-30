"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function CreatorDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [questionType, setQuestionType] = useState("practice"); // 'practice' or 'quiz'
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Load courses from API
  const loadCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      } else {
        console.error("Failed to load courses");
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className={styles.dashboard}>
      {/* Navigation Sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <h1>OchemPath</h1>
        </div>

        <div className={styles.nav}>
          <h3>Navigation</h3>
          <ul>
            <li className={activeView === "overview" ? styles.active : ""}>
              <button onClick={() => setActiveView("overview")}>
                Overview
              </button>
            </li>
            <li className={activeView === "courses" ? styles.active : ""}>
              <button onClick={() => setActiveView("courses")}>Courses</button>
            </li>
            <li>
              <button>Chapters</button>
            </li>
            <li>
              <button>Questions</button>
            </li>
            <li>
              <button>Users</button>
            </li>
            <li>
              <button>Assignments</button>
            </li>
            <li>
              <button>Analytics</button>
            </li>
            <li>
              <button>Settings</button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {selectedCourse && selectedChapter ? (
              <h1>Chapter {selectedChapter.position} • Question Builder</h1>
            ) : selectedCourse ? (
              <h1>{selectedCourse.title} — Course Manager</h1>
            ) : (
              <h1>Courses</h1>
            )}
          </div>
          <div className={styles.headerRight}>
            <button className={styles.dashboardLink}>Dashboard</button>
            <span>•</span>
            <button className={styles.adminLink}>Admin</button>
          </div>
        </header>

        {/* Content based on active view */}
        {activeView === "overview" ||
        activeView === "courses" ||
        activeView === "course" ? (
          selectedCourse && selectedChapter ? (
            <QuestionBuilder
              course={selectedCourse}
              chapter={selectedChapter}
              questionType={questionType}
              onBack={() => setSelectedChapter(null)}
            />
          ) : selectedCourse ? (
            <CourseManager
              course={selectedCourse}
              onBack={() => {
                setSelectedCourse(null);
                setActiveView("overview");
                loadCourses(); // Refresh courses data to update chapter counts
              }}
              onSelectChapter={(chapter, type) => {
                setSelectedChapter(chapter);
                setQuestionType(type);
              }}
            />
          ) : (
            <CoursesOverview
              courses={courses}
              loading={coursesLoading}
              onSelectCourse={(course) => {
                setSelectedCourse(course);
                setActiveView("course");
              }}
            />
          )
        ) : null}
      </main>
    </div>
  );
}

function CoursesOverview({ courses, loading, onSelectCourse }) {
  const [courseStats, setCourseStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Load chapter counts for each course
  useEffect(() => {
    const loadCourseStats = async () => {
      if (courses.length === 0) return;

      setStatsLoading(true);
      const stats = {};

      try {
        // Fetch chapter counts for all courses
        await Promise.all(
          courses.map(async (course) => {
            try {
              const response = await fetch(
                `/api/admin/chapters?course_id=${course.id}`
              );
              if (response.ok) {
                const chapters = await response.json();
                stats[course.id] = {
                  chapters: chapters.length,
                  students: 0, // TODO: Add student count later
                };
              }
            } catch (error) {
              console.error(
                `Error loading stats for course ${course.id}:`,
                error
              );
              stats[course.id] = { chapters: 0, students: 0 };
            }
          })
        );

        setCourseStats(stats);
      } catch (error) {
        console.error("Error loading course stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadCourseStats();
  }, [courses]);

  return (
    <div className={styles.coursesOverview}>
      <div className={styles.coursesHeader}>
        <input
          type="text"
          placeholder="Search courses..."
          className={styles.searchInput}
        />
        <button className={styles.newCourseBtn}>New Course</button>
      </div>

      <div className={styles.coursesTable}>
        <div className={styles.tableHeader}>
          <div>Course</div>
          <div>Chapters</div>
          <div>Students</div>
          <div>Updated</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#8b949e" }}
          >
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#8b949e" }}
          >
            No courses found. Click "New Course" to create your first course.
          </div>
        ) : (
          courses.map((course) => {
            const updatedDate = new Date(
              course.created_at
            ).toLocaleDateString();
            const stats = courseStats[course.id] || {
              chapters: "-",
              students: "-",
            };

            return (
              <div key={course.id} className={styles.tableRow}>
                <div className={styles.courseTitle}>{course.title}</div>
                <div>{statsLoading ? "..." : stats.chapters}</div>
                <div>{statsLoading ? "..." : stats.students}</div>
                <div>{updatedDate}</div>
                <div className={styles.actions}>
                  <button
                    className={styles.manageBtn}
                    onClick={() => onSelectCourse(course)}
                  >
                    Manage
                  </button>
                  <button className={styles.openBtn}>Open</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CourseManager({ course, onBack, onSelectChapter }) {
  const [activeTab, setActiveTab] = useState("details");
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editing, setEditing] = useState(false);

  // Practice questions state
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const [chapterForm, setChapterForm] = useState({
    title: "",
    description: "",
    video_url: "",
    position: 1,
  });

  const [questionForm, setQuestionForm] = useState({
    text: "",
    type: "multiple_choice",
    points: 2,
    position: 1,
    image_url: "",
    published: false,
    choices: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false }
    ]
  });

  useEffect(() => {
    if (course?.id) {
      loadChapters();
    }
  }, [course?.id]);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/chapters?course_id=${course.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setChapters(data);
        if (data.length > 0 && !selectedChapter) {
          selectChapter(data[0]);
        }
      } else {
        console.error("Failed to load chapters");
      }
    } catch (error) {
      console.error("Error loading chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectChapter = (chapter) => {
    console.log("Selected chapter:", chapter);
    console.log("Chapter published status:", chapter.published);
    setSelectedChapter(chapter);
    setChapterForm({
      title: chapter.title || "",
      description: chapter.description || "",
      video_url: chapter.video_url || "",
      position: chapter.position || 1,
    });
    setEditing(false);
  };

  const startNewChapter = () => {
    setSelectedChapter(null);
    setChapterForm({
      title: "",
      description: "",
      video_url: "",
      position: chapters.length + 1,
    });
    setEditing(true);
  };

  const startEditChapter = () => {
    setEditing(true);
  };

  const saveChapter = async () => {
    try {
      const chapterData = {
        ...chapterForm,
        course_id: course.id,
      };

      let response;
      if (selectedChapter) {
        // Update existing chapter
        response = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chapterData),
        });
      } else {
        // Create new chapter
        response = await fetch("/api/admin/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chapterData),
        });
      }

      if (response.ok) {
        const savedChapter = await response.json();
        await loadChapters();
        setSelectedChapter(savedChapter);
        setEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save chapter");
      }
    } catch (error) {
      console.error("Error saving chapter:", error);
      alert("Failed to save chapter");
    }
  };

  const deleteChapter = async (chapter) => {
    if (
      !confirm(
        `Are you sure you want to delete "${chapter.title}"? This will also delete all related quizzes and questions.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadChapters();
        if (selectedChapter?.id === chapter.id) {
          const remainingChapters = chapters.filter((c) => c.id !== chapter.id);
          if (remainingChapters.length > 0) {
            selectChapter(remainingChapters[0]);
          } else {
            setSelectedChapter(null);
            startNewChapter();
          }
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete chapter");
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      alert("Failed to delete chapter");
    }
  };

  const publishChapter = async (chapter) => {
    console.log("Publishing chapter:", chapter.id, chapter.title);
    try {
      const url = `/api/admin/chapters/${chapter.id}/publish`;
      console.log("Publish URL:", url);
      
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });

      console.log("Publish response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Publish result:", result);
        await loadChapters();
        alert("Chapter published successfully!");
      } else {
        const errorText = await response.text();
        console.error("Publish error:", errorText);
        try {
          const error = JSON.parse(errorText);
          alert(error.error || "Failed to publish chapter");
        } catch {
          alert("Failed to publish chapter: " + errorText);
        }
      }
    } catch (error) {
      console.error("Error publishing chapter:", error);
      alert("Failed to publish chapter: " + error.message);
    }
  };

  const unpublishChapter = async (chapter) => {
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: false }),
      });

      if (response.ok) {
        await loadChapters();
        alert("Chapter unpublished successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to unpublish chapter");
      }
    } catch (error) {
      console.error("Error unpublishing chapter:", error);
      alert("Failed to unpublish chapter");
    }
  };

  const cancelEdit = () => {
    if (selectedChapter) {
      selectChapter(selectedChapter);
    } else {
      if (chapters.length > 0) {
        selectChapter(chapters[0]);
      }
    }
    setEditing(false);
  };

  // Practice Questions Functions
  const loadPracticeQuestions = async () => {
    if (!selectedChapter?.id) return;
    
    setQuestionsLoading(true);
    try {
      const response = await fetch(`/api/admin/questions?chapter_id=${selectedChapter.id}&is_practice=true`);
      if (response.ok) {
        const data = await response.json();
        setPracticeQuestions(data);
        if (data.length > 0 && !selectedQuestion) {
          selectQuestion(data[0]);
        }
      } else {
        console.error("Failed to load practice questions");
      }
    } catch (error) {
      console.error("Error loading practice questions:", error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const selectQuestion = (question) => {
    console.log("Selected question:", question);
    setSelectedQuestion(question);
    setQuestionForm({
      text: question.text || "",
      type: question.type || "multiple_choice",
      points: question.points || 2,
      position: question.position || 1,
      image_url: question.image_url || "",
      published: question.published || false,
      choices: question.choices || [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false }
      ]
    });
    setEditingQuestion(false);
  };

  const startNewQuestion = () => {
    setSelectedQuestion(null);
    setQuestionForm({
      text: "",
      type: "multiple_choice",
      points: 2,
      position: practiceQuestions.length + 1,
      image_url: "",
      choices: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false }
      ]
    });
    setEditingQuestion(true);
  };

  const startEditQuestion = () => {
    setEditingQuestion(true);
  };

  const saveQuestion = async () => {
    // Check if at least one answer is marked as correct
    const hasCorrectAnswer = questionForm.choices.some(choice => choice.is_correct);
    if (!hasCorrectAnswer) {
      setValidationMessage("Please select at least one correct answer before saving.");
      setTimeout(() => setValidationMessage(""), 4000);
      return;
    }

    try {
      const questionData = {
        ...questionForm,
        chapter_id: selectedChapter.id,
        is_practice: true
      };

      let response;
      if (selectedQuestion) {
        // Update existing question
        response = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        });
      } else {
        // Create new question
        response = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        });
      }

      if (response.ok) {
        const savedQuestion = await response.json();
        await loadPracticeQuestions();
        setSelectedQuestion(savedQuestion);
        setEditingQuestion(false);
        setSuccessMessage("Question saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setSuccessMessage(`Error: ${error.error || "Failed to save question"}`);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error saving question:", error);
      setSuccessMessage("Failed to save question");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const toggleQuestionPublish = async (question) => {
    try {
      const response = await fetch(`/api/admin/questions/${question.id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !question.published }),
      });

      if (response.ok) {
        setSuccessMessage(`Question ${!question.published ? 'published' : 'unpublished'} successfully!`);
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPracticeQuestions();
      } else {
        const error = await response.json();
        setSuccessMessage(`Error: ${error.error || "Failed to update question"}`);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating question:", error);
      setSuccessMessage("Failed to update question");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const publishAllDrafts = async () => {
    const draftQuestions = practiceQuestions.filter(q => !q.published);
    
    if (draftQuestions.length === 0) {
      setValidationMessage("No draft questions to publish.");
      setTimeout(() => setValidationMessage(""), 3000);
      return;
    }

    try {
      const publishPromises = draftQuestions.map(question => 
        fetch(`/api/admin/questions/${question.id}/publish`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: true }),
        })
      );

      const results = await Promise.all(publishPromises);
      const successful = results.filter(r => r.ok).length;
      const failed = results.length - successful;

      if (failed === 0) {
        setSuccessMessage(`Successfully published all ${successful} draft questions!`);
      } else {
        setSuccessMessage(`Published ${successful} questions, ${failed} failed.`);
      }
      
      setTimeout(() => setSuccessMessage(""), 4000);
      await loadPracticeQuestions();
    } catch (error) {
      console.error("Error publishing drafts:", error);
      setSuccessMessage("Failed to publish draft questions");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const duplicateQuestion = async (question) => {
    const duplicatedQuestion = {
      ...question,
      text: `${question.text} (Copy)`,
      position: practiceQuestions.length + 1,
      choices: question.choices?.map(choice => ({ ...choice })) || [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false }
      ]
    };
    delete duplicatedQuestion.id; // Remove ID so it creates a new question
    
    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...duplicatedQuestion,
          chapter_id: selectedChapter.id,
          is_practice: true
        }),
      });

      if (response.ok) {
        setSuccessMessage("Question duplicated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPracticeQuestions();
      } else {
        const error = await response.json();
        setSuccessMessage(`Error: ${error.error || "Failed to duplicate question"}`);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error duplicating question:", error);
      setSuccessMessage("Failed to duplicate question");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const deleteQuestion = async (question) => {
    if (!confirm(`Are you sure you want to delete "${question.text}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadPracticeQuestions();
        if (selectedQuestion?.id === question.id) {
          const remainingQuestions = practiceQuestions.filter((q) => q.id !== question.id);
          if (remainingQuestions.length > 0) {
            selectQuestion(remainingQuestions[0]);
          } else {
            setSelectedQuestion(null);
            startNewQuestion();
          }
        }
        setSuccessMessage("Question deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        const error = await response.json();
        setSuccessMessage(`Error: ${error.error || "Failed to delete question"}`);
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      setSuccessMessage("Failed to delete question");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const cancelQuestionEdit = () => {
    if (selectedQuestion) {
      selectQuestion(selectedQuestion);
    } else {
      if (practiceQuestions.length > 0) {
        selectQuestion(practiceQuestions[0]);
      }
    }
    setEditingQuestion(false);
  };

  // Load practice questions when chapter or practice tab is selected
  useEffect(() => {
    if (activeTab === "practice" && selectedChapter?.id) {
      loadPracticeQuestions();
    }
  }, [activeTab, selectedChapter?.id]);

  return (
    <div className={styles.courseManager}>
      {/* Course Header with Back Button */}
      <div className={styles.courseHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          {activeTab === "practice" && selectedChapter 
            ? `← Back to Chapter ${selectedChapter.position}` 
            : "← Back to Courses"}
        </button>
        <h2>{course.title} — Course Manager</h2>
      </div>

      <div className={`${styles.courseLayout} ${activeTab === "practice" ? styles.practiceMode : ""}`}>
        {/* Chapters Sidebar - Hidden in Practice Tab */}
        {activeTab !== "practice" && (
        <div className={styles.chaptersSidebar}>
          <div className={styles.chaptersHeader}>
            <h3>Chapters</h3>
            <button className={styles.addChapterBtn} onClick={startNewChapter}>
              + Add Chapter
            </button>
          </div>

          <div className={styles.chaptersList}>
            {loading ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#8b949e",
                }}
              >
                Loading chapters...
              </div>
            ) : chapters.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#8b949e",
                }}
              >
                No chapters yet. Click "+ Add Chapter" to get started.
              </div>
            ) : (
              chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`${styles.chapterItem} ${
                    selectedChapter?.id === chapter.id ? styles.active : ""
                  }`}
                  onClick={() => selectChapter(chapter)}
                >
                  <div className={styles.chapterInfo}>
                    <div className={styles.chapterTitle}>
                      {chapter.position}. {chapter.title}
                      {!chapter.published && (
                        <span className={styles.draftBadge}>DRAFT</span>
                      )}
                    </div>
                    <div className={styles.chapterMeta}>
                      {chapter.video_url ? "Video" : "No video"} • Practice •
                      Quiz
                      {!chapter.published && " • Unpublished"}
                    </div>
                  </div>
                  <div className={styles.chapterActions}>
                    <button className={styles.dragHandle}>⋮⋮</button>
                    <button
                      className={styles.editBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectChapter(chapter);
                        startEditChapter();
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.moreBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChapter(chapter);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* Main Content */}
        <div className={styles.courseContent}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "details" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "practice" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("practice")}
            >
              Practice
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "quiz" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("quiz")}
            >
              Quiz
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "settings" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>

          {activeTab === "details" && (
            <div className={styles.detailsForm}>
              <div className={styles.formGroup}>
                <label>Chapter title</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, title: e.target.value })
                  }
                  placeholder="e.g., Structure & Bonding"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Short description</label>
                <textarea
                  value={chapterForm.description}
                  onChange={(e) =>
                    setChapterForm({
                      ...chapterForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="One or two lines to describe the chapter."
                />
              </div>

              <div className={styles.formGroup}>
                <label>YouTube link</label>
                <input
                  type="text"
                  value={chapterForm.video_url}
                  onChange={(e) =>
                    setChapterForm({
                      ...chapterForm,
                      video_url: e.target.value,
                    })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="number"
                    value={chapterForm.position}
                    onChange={(e) =>
                      setChapterForm({
                        ...chapterForm,
                        position: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={styles.createPracticeBtn}
                  onClick={() => onSelectChapter(chapters[0], "practice")}
                >
                  Create Practice set
                </button>
                <button
                  className={styles.createQuizBtn}
                  onClick={() => onSelectChapter(chapters[0], "quiz")}
                >
                  Create Quiz
                </button>
              </div>
            </div>
          )}

          {activeTab === "practice" && (
            <div className={styles.practiceContent}>
              {/* Success Message */}
              {successMessage && (
                <div className={styles.successMessage}>
                  {successMessage}
                </div>
              )}
              
              {/* Validation Message */}
              {validationMessage && (
                <div className={styles.validationMessage}>
                  {validationMessage}
                </div>
              )}
              {/* Questions Sidebar */}
              <div className={styles.questionsSidebar}>
                <div className={styles.questionsHeader}>
                  <h3>Practice Questions</h3>
                  <div className={styles.questionHeaderActions}>
                    {practiceQuestions.filter(q => !q.published).length > 1 && (
                      <button 
                        className={styles.publishAllBtn} 
                        onClick={publishAllDrafts}
                        title={`Publish ${practiceQuestions.filter(q => !q.published).length} draft questions`}
                      >
                        Publish All Drafts ({practiceQuestions.filter(q => !q.published).length})
                      </button>
                    )}
                    <button className={styles.addQuestionBtn} onClick={startNewQuestion}>
                      + Add Question
                    </button>
                  </div>
                </div>

                <div className={styles.questionsList}>
                  {questionsLoading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#8b949e" }}>
                      Loading questions...
                    </div>
                  ) : practiceQuestions.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#8b949e" }}>
                      No practice questions yet. Click "+ Add Question" to get started.
                    </div>
                  ) : (
                    practiceQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className={`${styles.questionItem} ${
                          selectedQuestion?.id === question.id ? styles.active : ""
                        }`}
                        onClick={() => selectQuestion(question)}
                      >
                        <div className={styles.questionContent}>
                          <div className={styles.questionHeader}>
                            <span className={styles.questionNumber}>Q{index + 1}</span>
                            <span className={styles.questionType}>{question.type?.toUpperCase()}</span>
                            <span className={styles.questionPoints}>• {question.points} pts</span>
                            {!question.published && (
                              <span className={styles.draftTag}>DRAFT</span>
                            )}
                          </div>
                          
                          <div className={styles.questionText}>
                            {question.text && question.text.length > 50 
                              ? `${question.text.substring(0, 50)}...` 
                              : question.text || "Prompt preview..."}
                          </div>
                          
                          <div className={styles.pointsDisplay}>
                            Points: {question.points}
                          </div>
                          
                          <div className={styles.questionButtons}>
                            <button 
                              className={styles.duplicateBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateQuestion(question);
                              }}
                            >
                              Duplicate
                            </button>
                            <button 
                              className={`${styles.publishBtn} ${question.published ? styles.unpublish : styles.publish}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuestionPublish(question);
                              }}
                            >
                              {question.published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button className={styles.moveBtn}>Move ↑↓</button>
                          </div>
                        </div>
                        
                        <div className={styles.questionMenu}>
                          <button className={styles.moreBtn}>⋯</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Question Form */}
              <div className={styles.questionForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Type</label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Points</label>
                    <input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Position</label>
                    <input
                      type="number"
                      value={questionForm.position}
                      onChange={(e) => setQuestionForm({ ...questionForm, position: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Prompt</label>
                  <textarea
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                    placeholder="Enter your question here..."
                    rows="3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Image (optional)</label>
                  <div className={styles.imageUpload}>
                    <input
                      type="text"
                      value={questionForm.image_url}
                      onChange={(e) => setQuestionForm({ ...questionForm, image_url: e.target.value })}
                      placeholder="Image URL or upload an image"
                    />
                    <button className={styles.uploadBtn}>Upload</button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Answer choices</label>
                  <div className={styles.choicesGrid}>
                    {questionForm.choices.map((choice, index) => (
                      <div key={index} className={styles.choiceRow}>
                        <div className={styles.choiceLabel}>
                          {String.fromCharCode(65 + index)})
                        </div>
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => {
                            const newChoices = [...questionForm.choices];
                            newChoices[index] = { ...choice, text: e.target.value };
                            setQuestionForm({ ...questionForm, choices: newChoices });
                          }}
                          placeholder="Choice text"
                        />
                        <button
                          className={`${styles.correctBtn} ${choice.is_correct ? styles.correct : ""}`}
                          onClick={() => {
                            const newChoices = [...questionForm.choices];
                            newChoices[index] = { ...choice, is_correct: !choice.is_correct };
                            setQuestionForm({ ...questionForm, choices: newChoices });
                          }}
                        >
                          Mark correct
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.questionFormActions}>
                  <button className={styles.deleteQuestionBtn}>Delete</button>
                  <button className={styles.saveDraftBtn} onClick={cancelQuestionEdit}>
                    Save draft
                  </button>
                  <button 
                    className={styles.saveQuestionBtn} 
                    onClick={saveQuestion}
                    disabled={!questionForm.text.trim()}
                  >
                    {editingQuestion ? (selectedQuestion ? "Save question" : "Save question") : "Save question"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Draft Warning */}
          {selectedChapter && !selectedChapter.published && (
            <div className={styles.draftWarning}>
              ⚠️ This chapter is saved as a draft and is not visible to students yet. 
              Click "Publish Chapter" to make it live.
            </div>
          )}

          <div className={styles.formActions}>
            <button className={styles.discardBtn} onClick={cancelEdit}>
              Discard
            </button>
            <button
              className={styles.saveBtn}
              onClick={saveChapter}
              disabled={!chapterForm.title.trim()}
            >
              {editing ? "Save Draft" : "Save as Draft"}
            </button>
            {selectedChapter && (
              <>
                {!selectedChapter.published ? (
                  <button
                    className={styles.publishBtn}
                    onClick={() => publishChapter(selectedChapter)}
                    disabled={!selectedChapter.title}
                  >
                    Publish Chapter
                  </button>
                ) : (
                  <button
                    className={styles.unpublishBtn}
                    onClick={() => unpublishChapter(selectedChapter)}
                  >
                    Unpublish Chapter
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.courseActions}>
        <button 
          className={styles.saveDraftBtn}
          onClick={() => alert('All chapters are automatically saved as drafts. Use individual chapter publish buttons to make them live.')}
        >
          All Saved as Drafts
        </button>
        <button 
          className={styles.publishBtn}
          onClick={() => {
            const unpublishedChapters = chapters.filter(ch => !ch.published);
            if (unpublishedChapters.length === 0) {
              alert('All chapters are already published!');
              return;
            }
            if (confirm(`Publish ${unpublishedChapters.length} unpublished chapters?`)) {
              unpublishedChapters.forEach(chapter => publishChapter(chapter));
            }
          }}
        >
          Publish All Chapters
        </button>
      </div>
    </div>
  );
}

function QuestionBuilder({ course, chapter, questionType, onBack }) {
  const [questions, setQuestions] = useState([
    { id: 1, type: "MCQ", points: 2, title: "Debug question 1" },
    { id: 2, type: "MCQ", points: 2, title: "Debug question 2" },
    { id: 3, type: "MCQ", points: 2, title: "Debug question 3" },
    { id: 4, type: "MCQ", points: 2, title: "Debug question 4" },
    { id: 5, type: "MCQ", points: 2, title: "Debug question 5" },
    { id: 6, type: "MCQ", points: 2, title: "Debug question 6" },
  ]);

  const [activeQuestion, setActiveQuestion] = useState(questions[1]); // Default to question 2
  const [questionForm, setQuestionForm] = useState({
    type: "Multiple Choice",
    points: 2,
    position: 2,
    prompt: "Which hybridization best describes carbon in ethene (C2H4)?",
    image: null,
    choices: [
      { id: "A", text: "Choice text", correct: false },
      { id: "B", text: "Choice text", correct: false },
      { id: "C", text: "Choice text", correct: true },
      { id: "D", text: "Choice text", correct: false },
    ],
  });

  const [activeTab, setActiveTab] = useState("practice");

  return (
    <div className={styles.questionBuilder}>
      <div className={styles.questionLayout}>
        {/* Questions Sidebar */}
        <div className={styles.questionsSidebar}>
          <div className={styles.questionsHeader}>
            <div className={styles.tabToggle}>
              <button
                className={`${styles.tabBtn} ${
                  activeTab === "practice" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("practice")}
              >
                Practice Questions
              </button>
              <button
                className={`${styles.tabBtn} ${
                  activeTab === "quiz" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("quiz")}
              >
                Quiz Questions
              </button>
            </div>
          </div>

          <div className={styles.questionsContent}>
            <h4>Questions</h4>
            <button className={styles.addQuestionBtn}>+ Add Question</button>

            <div className={styles.questionsList}>
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`${styles.questionItem} ${
                    activeQuestion?.id === question.id ? styles.active : ""
                  }`}
                  onClick={() => setActiveQuestion(question)}
                >
                  <div className={styles.questionNumber}>
                    {index + 1}. {question.type} • {question.points} pts
                  </div>
                  <div className={styles.questionTitle}>{question.title}</div>
                  <button className={styles.questionMenu}>⋯</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question Editor */}
        <div className={styles.questionEditor}>
          <div className={styles.editorHeader}>
            <h2>Edit Question {activeQuestion?.id}</h2>
            <div className={styles.editorMeta}>
              <div className={styles.metaItem}>
                <label>Type</label>
                <select value={questionForm.type}>
                  <option>Multiple Choice</option>
                </select>
              </div>
              <div className={styles.metaItem}>
                <label>Points</label>
                <input type="number" value={questionForm.points} />
              </div>
              <div className={styles.metaItem}>
                <label>Position</label>
                <input type="number" value={questionForm.position} />
              </div>
            </div>
          </div>

          <div className={styles.editorContent}>
            <div className={styles.formGroup}>
              <label>Prompt</label>
              <textarea
                value={questionForm.prompt}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, prompt: e.target.value })
                }
                placeholder="Which hybridization best describes carbon in ethene (C2H4)?"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Image (optional)</label>
              <div className={styles.imageUpload}>
                <div className={styles.uploadArea}>
                  <div className={styles.uploadPlaceholder}>
                    Drop image here
                  </div>
                </div>
                <button className={styles.uploadBtn}>Upload</button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Answer choices</label>
              <div className={styles.choicesGrid}>
                {questionForm.choices.map((choice) => (
                  <div key={choice.id} className={styles.choiceItem}>
                    <span className={styles.choiceLabel}>{choice.id})</span>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => {
                        const newChoices = questionForm.choices.map((c) =>
                          c.id === choice.id
                            ? { ...c, text: e.target.value }
                            : c
                        );
                        setQuestionForm({
                          ...questionForm,
                          choices: newChoices,
                        });
                      }}
                    />
                    <button
                      className={`${styles.correctBtn} ${
                        choice.correct ? styles.correct : ""
                      }`}
                      onClick={() => {
                        const newChoices = questionForm.choices.map((c) => ({
                          ...c,
                          correct: c.id === choice.id ? !c.correct : false,
                        }));
                        setQuestionForm({
                          ...questionForm,
                          choices: newChoices,
                        });
                      }}
                    >
                      Mark correct
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.editorActions}>
            <button className={styles.deleteBtn}>Delete</button>
            <button className={styles.saveDraftBtn}>Save draft</button>
            <button className={styles.saveQuestionBtn}>Save question</button>
          </div>
        </div>
      </div>
    </div>
  );
}
