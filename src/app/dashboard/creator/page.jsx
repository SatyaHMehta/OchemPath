"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UsersPage from "./users/page";
import styles from "./page.module.css";
import ImageUpload from "@/components/ImageUpload/ImageUpload";

export default function CreatorDashboard() {
  const router = useRouter();
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
            <li className={activeView === "users" ? styles.active : ""}>
              <button onClick={() => setActiveView("users")}>Users</button>
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
              <>
                <button
                  className={styles.backBtn}
                  onClick={() => setSelectedChapter(null)}
                >
                  ← Back to Chapter {selectedChapter.position}
                </button>
                <h1>Chapter {selectedChapter.position} • Question Builder</h1>
              </>
            ) : selectedCourse ? (
              <>
                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setSelectedCourse(null);
                    setActiveView("overview");
                    loadCourses();
                  }}
                >
                  ← Back to Courses
                </button>
                <h1>{selectedCourse.title} — Course Manager</h1>
              </>
            ) : (
              <h1>{activeView === "users" ? "Users" : "Courses"}</h1>
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
          selectedCourse ? (
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

        {activeView === "users" && (
          <div className={styles.coursesOverview}>
            {/* Reuse existing content area spacing/styles */}
            <UsersPage />
          </div>
        )}
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
  const [editing, setEditing] = useState(false); // Track if editing chapter

  // Practice questions state
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Quiz questions parallel state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizQuestionsLoading, setQuizQuestionsLoading] = useState(false);
  const [quizSelectedQuestion, setQuizSelectedQuestion] = useState(null);
  const [quizEditingQuestion, setQuizEditingQuestion] = useState(false);
  const [quizSuccessMessage, setQuizSuccessMessage] = useState("");
  const [quizValidationMessage, setQuizValidationMessage] = useState("");
  const [quizHasUnsavedChanges, setQuizHasUnsavedChanges] = useState(false);
  const [quizQuestionForm, setQuizQuestionForm] = useState({
    text: "",
    type: "multiple_choice",
    points: 2,
    position: 1,
    image_url: "",
    published: true,
    choices: [
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
    ],
  });

  const [chapterForm, setChapterForm] = useState({
    title: "",
    description: "",
    video_url: "",
    position: 1,
  });
  const [editingChapter, setEditingChapter] = useState(false);
  const [hasChapterUnsavedChanges, setHasChapterUnsavedChanges] =
    useState(false);
  const [chapterErrors, setChapterErrors] = useState({});

  const [questionForm, setQuestionForm] = useState({
    text: "",
    type: "multiple_choice",
    points: 2,
    position: 1,
    image_url: "",
    published: true, // Default new questions to published
    choices: [
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
      { text: "", is_correct: false, image_url: "" },
    ],
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
    setSelectedChapter(chapter);
    setChapterForm({
      title: chapter.title || "",
      description: chapter.description || "",
      video_url: chapter.video_url || "",
      position: chapter.position || 1,
    });
    setEditingChapter(false);
    setHasChapterUnsavedChanges(false);
  };

  const startNewChapter = () => {
    setSelectedChapter(null);
    setChapterForm({
      title: "",
      description: "",
      video_url: "",
      position: chapters.length + 1,
    });
    setEditingChapter(true);
    setHasChapterUnsavedChanges(false);
  };

  const startEditChapter = () => {
    if (!selectedChapter) return;
    setEditingChapter(true);
  };

  const saveChapter = async () => {
    // Prevent unnecessary save if nothing changed for existing chapter
    if (selectedChapter && !hasChapterUnsavedChanges) {
      return; // silently ignore; button will be disabled anyway
    }
    // Validate fields first; allow empty fields to show errors instead of silently disabling button
    const errors = {};
    if (!chapterForm.title.trim()) errors.title = "Title is required";
    if (!chapterForm.description.trim())
      errors.description = "Description is required";
    const posNum = parseInt(chapterForm.position, 10);
    if (isNaN(posNum) || posNum <= 0)
      errors.position = "Position must be a positive number";
    // Require YouTube link (previously optional) and validate basic format
    if (!chapterForm.video_url || !chapterForm.video_url.trim()) {
      errors.video_url = "YouTube link is required";
    } else if (!/^https?:\/\//i.test(chapterForm.video_url.trim())) {
      errors.video_url = "Must be a valid URL (starts with http/https)";
    }
    setChapterErrors(errors);
    if (Object.keys(errors).length > 0) {
      return; // Do not proceed if validation fails
    }
    try {
      const chapterData = {
        ...chapterForm,
        course_id: course.id,
      };

      let response;
      if (selectedChapter) {
        // If original is published, create/update draft instead of overwriting
        const isPublishedOriginal =
          selectedChapter.published && !selectedChapter.draft_of;
        response = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...chapterData,
            draft: isPublishedOriginal, // tell API to create/update draft
          }),
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
        await loadChapters(); // load will collapse originals/drafts
        // If this was a draft edit, savedChapter may be draft (draft_of present)
        setSelectedChapter(savedChapter);
        setSelectedChapter(savedChapter); // Update selected chapter
        setEditingChapter(false);
        setHasChapterUnsavedChanges(false);
        setChapterErrors({});
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
    try {
      const url = `/api/admin/chapters/${chapter.id}/publish`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });

      if (response.ok) {
        const result = await response.json();
        // Reload chapters to collapse drafts and get promoted original
        await loadChapters();
        // If a draft was promoted, result will be original row; select it
        if (result && result.id) {
          setSelectedChapter(result); // Update selected chapter
        }
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
      const response = await fetch(
        `/api/admin/chapters/${chapter.id}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: false }),
        }
      );

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

  // Single draft discard helper (was missing -> caused onClick reference error)
  const discardChapterDraft = async (draftChapter) => {
    if (!draftChapter?.draft_of) return;
    if (
      !confirm("Discard this draft and keep the currently published chapter?")
    )
      return;
    try {
      const res = await fetch(`/api/admin/chapters/${draftChapter.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to discard draft");
        return;
      }
      await loadChapters();
      // Re-select original if present
      const original = chapters.find((c) => c.id === draftChapter.draft_of);
      if (original) selectChapter(original);
    } catch (e) {
      console.error("Discard draft error", e);
      alert("Failed to discard draft");
    }
  };

  // Bulk chapter draft actions (re-added after refactor)
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkPublishChapterDrafts = async () => {
    if (bulkBusy) return;
    const draftCount = chapters.filter((c) => c.draft_of).length;
    if (draftCount === 0) return;
    if (
      !confirm(
        `Publish ${draftCount} chapter draft change${
          draftCount === 1 ? "" : "s"
        }?`
      )
    )
      return;
    setBulkBusy(true);
    try {
      const resp = await fetch(
        `/api/admin/chapters/publish?course_id=${course.id}`,
        { method: "PATCH" }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.error || "Bulk publish failed");
      } else {
        await loadChapters();
        // If a draft was selected, select its original now
        if (selectedChapter?.draft_of) {
          const original = chapters.find(
            (c) => c.id === selectedChapter.draft_of
          );
          if (original) selectChapter(original);
        }
      }
    } catch (e) {
      console.error("Bulk publish error", e);
      alert("Failed to publish drafts");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDiscardChapterDrafts = async () => {
    if (bulkBusy) return;
    const draftCount = chapters.filter((c) => c.draft_of).length;
    if (draftCount === 0) return;
    if (
      !confirm(
        `Discard ALL ${draftCount} chapter draft change${
          draftCount === 1 ? "" : "s"
        }? This cannot be undone.`
      )
    )
      return;
    setBulkBusy(true);
    try {
      const resp = await fetch(
        `/api/admin/chapters/drafts?course_id=${course.id}`,
        { method: "DELETE" }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.error || "Bulk discard failed");
      } else {
        await loadChapters();
        if (selectedChapter?.draft_of) {
          const original = chapters.find(
            (c) => c.id === selectedChapter.draft_of
          );
          if (original) selectChapter(original);
          else setSelectedChapter(null);
        }
      }
    } catch (e) {
      console.error("Bulk discard error", e);
      alert("Failed to discard drafts");
    } finally {
      setBulkBusy(false);
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
    setEditingChapter(false);
    setHasChapterUnsavedChanges(false);
  };

  // Track unsaved changes relative to selected chapter
  useEffect(() => {
    if (!selectedChapter) {
      setHasChapterUnsavedChanges(false);
      return;
    }
    const dirty =
      (chapterForm.title || "") !== (selectedChapter.title || "") ||
      (chapterForm.description || "") !== (selectedChapter.description || "") ||
      (chapterForm.video_url || "") !== (selectedChapter.video_url || "") ||
      (chapterForm.position || 1) !== (selectedChapter.position || 1);
    setHasChapterUnsavedChanges(dirty);
  }, [chapterForm, selectedChapter]);

  // Practice Questions Functions
  const loadPracticeQuestions = async () => {
    if (!selectedChapter?.id) return;

    setQuestionsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/questions?chapter_id=${selectedChapter.id}&is_practice=true`
      );
      if (response.ok) {
        const data = await response.json();

        // Collapse originals when a draft exists: keep only draft version.
        // Build map: originalId -> draft
        const draftsByOriginal = new Map();
        for (const q of data) {
          if (q.draft_of) {
            draftsByOriginal.set(q.draft_of, q);
          }
        }

        const collapsed = [];
        for (const q of data) {
          if (q.draft_of) {
            // It's already a draft; will be added when iterated here
            collapsed.push(q);
          } else {
            // Original: only include if no draft present
            if (!draftsByOriginal.has(q.id)) {
              collapsed.push(q);
            }
          }
        }

        // Preserve ordering: sort by position (existing logic downstream also sorts but keep list sensible)
        collapsed.sort((a, b) => (a.position || 0) - (b.position || 0));

        setPracticeQuestions(collapsed);
        if (collapsed.length > 0) {
          // If currently selected question got replaced by its draft, select that draft
          if (selectedQuestion) {
            if (selectedQuestion.draft_of) {
              // Selected is already a draft; keep
              selectQuestion(
                collapsed.find((q) => q.id === selectedQuestion.id) ||
                  collapsed[0]
              );
            } else {
              // Selected was an original; check if a draft now exists
              const draft = collapsed.find(
                (q) => q.draft_of === selectedQuestion.id
              );
              if (draft) {
                selectQuestion(draft);
              } else {
                // Still original present
                const originalStill = collapsed.find(
                  (q) => q.id === selectedQuestion.id
                );
                selectQuestion(originalStill || collapsed[0]);
              }
            }
          } else {
            selectQuestion(collapsed[0]);
          }
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
    setSelectedQuestion(question);
    // Only load form data in view mode - don't allow editing until Edit button is clicked
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
        { text: "", is_correct: false },
      ],
    });
    setEditingQuestion(false); // Start in view mode
    setHasUnsavedChanges(false); // Clear unsaved changes when switching questions
  };

  const startEditingQuestion = (question) => {
    // First select the question if not already selected
    if (selectedQuestion?.id !== question.id) {
      selectQuestion(question);
    }
    // Then enter edit mode
    setEditingQuestion(true);
    setHasUnsavedChanges(false); // No changes yet when starting to edit
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
        { text: "", is_correct: false },
      ],
    });
    setEditingQuestion(true);
  };

  const startEditQuestion = () => {
    setEditingQuestion(true);
  };

  const saveQuestion = async () => {
    // Check if at least one answer is marked as correct
    const hasCorrectAnswer = questionForm.choices.some(
      (choice) => choice.is_correct
    );
    if (!hasCorrectAnswer) {
      setValidationMessage(
        "Please select at least one correct answer before saving."
      );
      setTimeout(() => setValidationMessage(""), 4000);
      return;
    }

    try {
      let response;

      if (selectedQuestion && !selectedQuestion.draft_of) {
        // Editing an original published question - create a draft copy
        const draftData = {
          ...questionForm,
          chapter_id: selectedChapter.id,
          is_practice: true,
          published: false, // Drafts are unpublished
          draft_of: selectedQuestion.id, // Link to original
        };

        // Check if a draft already exists for this question
        const existingDraftResponse = await fetch(
          `/api/admin/questions?draft_of=${selectedQuestion.id}`
        );

        if (existingDraftResponse.ok) {
          const existingDrafts = await existingDraftResponse.json();
          if (existingDrafts.length > 0) {
            // Update existing draft
            response = await fetch(
              `/api/admin/questions/${existingDrafts[0].id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draftData),
              }
            );
          } else {
            // Create new draft
            response = await fetch("/api/admin/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draftData),
            });
          }
        } else {
          // Create new draft (fallback)
          response = await fetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draftData),
          });
        }
      } else if (selectedQuestion && selectedQuestion.draft_of) {
        // Editing an existing draft - update the draft
        const draftData = {
          ...questionForm,
          chapter_id: selectedChapter.id,
          is_practice: true,
          published: false, // Keep as draft
          draft_of: selectedQuestion.draft_of, // Maintain link to original
        };

        response = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftData),
        });
      } else {
        // Creating a new question - save as published
        const questionData = {
          ...questionForm,
          chapter_id: selectedChapter.id,
          is_practice: true,
          published: true, // New questions are published
          draft_of: null, // Not a draft
        };

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
        setHasUnsavedChanges(false);
        const statusMessage =
          selectedQuestion && !selectedQuestion.published
            ? "Question saved as draft!"
            : "Question saved successfully!";
        setSuccessMessage(statusMessage);
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
      const response = await fetch(
        `/api/admin/questions/${question.id}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !question.published }),
        }
      );

      if (response.ok) {
        setSuccessMessage(
          `Question ${
            !question.published ? "published" : "unpublished"
          } successfully!`
        );
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPracticeQuestions();
      } else {
        const error = await response.json();
        setSuccessMessage(
          `Error: ${error.error || "Failed to update question"}`
        );
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error updating question:", error);
      setSuccessMessage("Failed to update question");
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  const publishAllDrafts = async () => {
    // Treat any unpublished question as a draft (includes linked drafts and standalone duplicates)
    const draftQuestions = practiceQuestions.filter((q) => !q.published);

    if (draftQuestions.length === 0) {
      setValidationMessage("No draft questions to publish.");
      setTimeout(() => setValidationMessage(""), 3000);
      return;
    }

    try {
      const publishPromises = draftQuestions.map((question) =>
        fetch(`/api/admin/questions/${question.id}/publish`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: true }),
        })
      );

      const results = await Promise.all(publishPromises);
      const successful = results.filter((r) => r.ok).length;
      const failed = results.length - successful;

      if (failed === 0) {
        setSuccessMessage(
          `Successfully published all ${successful} draft questions!`
        );
      } else {
        setSuccessMessage(
          `Published ${successful} questions, ${failed} failed.`
        );
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
      choices: question.choices?.map((choice) => ({ ...choice })) || [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    };
    delete duplicatedQuestion.id; // Remove ID so it creates a new question

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...duplicatedQuestion,
          chapter_id: selectedChapter.id,
          is_practice: true,
          published: false, // Create as draft/unpublished
        }),
      });

      if (response.ok) {
        setSuccessMessage("Question duplicated as draft - ready to publish!");
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadPracticeQuestions();
      } else {
        const error = await response.json();
        setSuccessMessage(
          `Error: ${error.error || "Failed to duplicate question"}`
        );
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
          const remainingQuestions = practiceQuestions.filter(
            (q) => q.id !== question.id
          );
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
        setSuccessMessage(
          `Error: ${error.error || "Failed to delete question"}`
        );
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
    setHasUnsavedChanges(false);
  };

  const discardAllDrafts = async () => {
    const draftQuestions = practiceQuestions.filter((q) => !q.published); // Only unpublished

    if (draftQuestions.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to discard ALL draft changes? This will delete ${draftQuestions.length} draft(s) and revert to the original published questions.`
      )
    ) {
      return;
    }

    try {
      // Delete each unpublished question individually (handles both linked drafts and standalone unpublished questions)
      const deleteResults = await Promise.all(
        draftQuestions.map((q) =>
          fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" })
        )
      );

      const failedDeletes = deleteResults.filter((res) => !res.ok);
      const successfulDeletes = deleteResults.filter((res) => res.ok);

      // Reload the questions to show updated state
      await loadPracticeQuestions();
      setSelectedQuestion(null);
      setEditingQuestion(false);
      setHasUnsavedChanges(false);

      if (failedDeletes.length > 0) {
        setSuccessMessage(
          `Discarded ${successfulDeletes.length} draft question(s). Failed to delete ${failedDeletes.length}.`
        );
      } else {
        setSuccessMessage(
          `Discarded ${successfulDeletes.length} draft question(s).`
        );
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error discarding drafts:", error);
      alert("Failed to discard drafts. Please refresh the page and try again.");
    }
  };

  // Discard a single practice question draft
  const discardPracticeDraft = async (draftQuestion) => {
    if (draftQuestion?.published) return; // not a draft

    const isLinkedDraft = !!draftQuestion?.draft_of;
    const confirmMessage = isLinkedDraft
      ? "Discard this draft change and keep the published version?"
      : "Discard this unpublished question permanently?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/questions/${draftQuestion.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to discard draft");
        return;
      }
      await loadPracticeQuestions();
      if (selectedQuestion?.id === draftQuestion.id) {
        if (isLinkedDraft) {
          // After deletion, reselect original if still in list
          const original = practiceQuestions.find(
            (q) => q.id === draftQuestion.draft_of
          );
          if (original) selectQuestion(original);
          else setSelectedQuestion(null);
        } else {
          // For standalone drafts, just clear selection
          setSelectedQuestion(null);
        }
      }
    } catch (e) {
      console.error("Discard practice draft error", e);
      alert("Failed to discard draft");
    }
  };

  // Load practice questions when chapter or practice tab is selected
  useEffect(() => {
    if (activeTab === "practice" && selectedChapter?.id) {
      loadPracticeQuestions();
    }
  }, [activeTab, selectedChapter?.id]);

  // Load quiz questions when quiz tab is selected
  useEffect(() => {
    if (activeTab === "quiz" && selectedChapter?.id) {
      loadQuizQuestions();
    }
  }, [activeTab, selectedChapter?.id]);

  // ---------------- Quiz Question Logic (mirrors practice) ----------------
  const loadQuizQuestions = async () => {
    if (!selectedChapter?.id) return;
    setQuizQuestionsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/questions?chapter_id=${selectedChapter.id}&is_practice=false`
      );
      if (response.ok) {
        const data = await response.json();
        const draftsByOriginal = new Map();
        for (const q of data) {
          if (q.draft_of) draftsByOriginal.set(q.draft_of, q);
        }
        const collapsed = [];
        for (const q of data) {
          if (q.draft_of) collapsed.push(q);
          else if (!draftsByOriginal.has(q.id)) collapsed.push(q);
        }
        collapsed.sort((a, b) => (a.position || 0) - (b.position || 0));
        setQuizQuestions(collapsed);
        if (collapsed.length > 0) {
          if (quizSelectedQuestion) {
            if (quizSelectedQuestion.draft_of) {
              setQuizSelectedQuestion(
                collapsed.find((q) => q.id === quizSelectedQuestion.id) ||
                  collapsed[0]
              );
            } else {
              const draft = collapsed.find(
                (q) => q.draft_of === quizSelectedQuestion.id
              );
              if (draft) setQuizSelectedQuestion(draft);
              else {
                const orig = collapsed.find(
                  (q) => q.id === quizSelectedQuestion.id
                );
                setQuizSelectedQuestion(orig || collapsed[0]);
              }
            }
          } else {
            setQuizSelectedQuestion(collapsed[0]);
          }
        }
      }
    } catch (e) {
      console.error("Error loading quiz questions", e);
    } finally {
      setQuizQuestionsLoading(false);
    }
  };

  const selectQuizQuestion = (question) => {
    setQuizSelectedQuestion(question);
    setQuizQuestionForm({
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
        { text: "", is_correct: false },
      ],
    });
    setQuizEditingQuestion(false);
    setQuizHasUnsavedChanges(false);
  };

  const startEditingQuizQuestion = (question) => {
    if (quizSelectedQuestion?.id !== question.id) selectQuizQuestion(question);
    setQuizEditingQuestion(true);
    setQuizHasUnsavedChanges(false);
  };

  const startNewQuizQuestion = () => {
    setQuizSelectedQuestion(null);
    setQuizQuestionForm({
      text: "",
      type: "multiple_choice",
      points: 2,
      position: quizQuestions.length + 1,
      image_url: "",
      choices: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    });
    setQuizEditingQuestion(true);
  };

  const saveQuizQuestion = async () => {
    const hasCorrect = quizQuestionForm.choices.some((c) => c.is_correct);
    if (!hasCorrect) {
      setQuizValidationMessage(
        "Please select at least one correct answer before saving."
      );
      setTimeout(() => setQuizValidationMessage(""), 4000);
      return;
    }
    try {
      let response;
      if (quizSelectedQuestion && !quizSelectedQuestion.draft_of) {
        const draftData = {
          ...quizQuestionForm,
          chapter_id: selectedChapter.id,
          is_practice: false,
          published: false,
          draft_of: quizSelectedQuestion.id,
        };
        const existingDraftResp = await fetch(
          `/api/admin/questions?draft_of=${quizSelectedQuestion.id}`
        );
        if (existingDraftResp.ok) {
          const drafts = await existingDraftResp.json();
          if (drafts.length > 0) {
            response = await fetch(`/api/admin/questions/${drafts[0].id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draftData),
            });
          } else {
            response = await fetch("/api/admin/questions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draftData),
            });
          }
        } else {
          response = await fetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draftData),
          });
        }
      } else if (quizSelectedQuestion && quizSelectedQuestion.draft_of) {
        const draftData = {
          ...quizQuestionForm,
          chapter_id: selectedChapter.id,
          is_practice: false,
          published: false,
          draft_of: quizSelectedQuestion.draft_of,
        };
        response = await fetch(
          `/api/admin/questions/${quizSelectedQuestion.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(draftData),
          }
        );
      } else {
        const questionData = {
          ...quizQuestionForm,
          chapter_id: selectedChapter.id,
          is_practice: false,
          published: true,
          draft_of: null,
        };
        response = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionData),
        });
      }
      if (response.ok) {
        const saved = await response.json();
        await loadQuizQuestions();
        setQuizSelectedQuestion(saved);
        setQuizEditingQuestion(false);
        setQuizHasUnsavedChanges(false);
        setQuizSuccessMessage("Question saved successfully");
        setTimeout(() => setQuizSuccessMessage(""), 3000);
      } else {
        const err = await response.json();
        setQuizSuccessMessage(
          `Error: ${err.error || "Failed to save question"}`
        );
        setTimeout(() => setQuizSuccessMessage(""), 4000);
      }
    } catch (e) {
      console.error("Error saving quiz question", e);
      setQuizSuccessMessage("Failed to save question");
      setTimeout(() => setQuizSuccessMessage(""), 4000);
    }
  };

  const toggleQuizQuestionPublish = async (question) => {
    try {
      const response = await fetch(
        `/api/admin/questions/${question.id}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !question.published }),
        }
      );
      if (response.ok) {
        setQuizSuccessMessage(
          `Question ${
            !question.published ? "published" : "unpublished"
          } successfully!`
        );
        setTimeout(() => setQuizSuccessMessage(""), 3000);
        await loadQuizQuestions();
      } else {
        const err = await response.json();
        setQuizSuccessMessage(
          `Error: ${err.error || "Failed to update question"}`
        );
        setTimeout(() => setQuizSuccessMessage(""), 4000);
      }
    } catch (e) {
      console.error("Toggle publish quiz question error", e);
      setQuizSuccessMessage("Failed to update question");
      setTimeout(() => setQuizSuccessMessage(""), 4000);
    }
  };

  const publishAllQuizDrafts = async () => {
    const drafts = quizQuestions.filter((q) => !q.published);
    if (drafts.length === 0) {
      setQuizValidationMessage("No draft questions to publish.");
      setTimeout(() => setQuizValidationMessage(""), 3000);
      return;
    }
    try {
      const results = await Promise.all(
        drafts.map((q) =>
          fetch(`/api/admin/questions/${q.id}/publish`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: true }),
          })
        )
      );
      const ok = results.filter((r) => r.ok).length;
      setQuizSuccessMessage(
        `Published ${ok}/${results.length} draft questions.`
      );
      setTimeout(() => setQuizSuccessMessage(""), 4000);
      await loadQuizQuestions();
    } catch (e) {
      console.error("Publish quiz drafts error", e);
      setQuizSuccessMessage("Failed to publish drafts");
      setTimeout(() => setQuizSuccessMessage(""), 4000);
    }
  };

  const discardAllQuizDrafts = async () => {
    const drafts = quizQuestions.filter((q) => !q.published);
    if (drafts.length === 0) return;
    if (
      !confirm(
        `Discard all ${drafts.length} draft change${
          drafts.length === 1 ? "" : "s"
        }?`
      )
    )
      return;
    try {
      // Delete each unpublished question individually (handles both linked drafts and standalone unpublished questions)
      const deleteResults = await Promise.all(
        drafts.map((q) =>
          fetch(`/api/admin/questions/${q.id}`, { method: "DELETE" })
        )
      );

      const failedDeletes = deleteResults.filter((res) => !res.ok);
      const successfulDeletes = deleteResults.filter((res) => res.ok);

      await loadQuizQuestions();
      setQuizSelectedQuestion(null);
      setQuizEditingQuestion(false);
      setQuizHasUnsavedChanges(false);

      if (failedDeletes.length > 0) {
        setQuizSuccessMessage(
          `Discarded ${successfulDeletes.length} draft question(s). Failed to delete ${failedDeletes.length}.`
        );
      } else {
        setQuizSuccessMessage(
          `Discarded ${successfulDeletes.length} draft question(s).`
        );
      }
      setTimeout(() => setQuizSuccessMessage(""), 3000);
    } catch (e) {
      console.error("Discard quiz drafts error", e);
      alert("Failed to discard drafts");
    }
  };

  // Discard single quiz question draft
  const discardQuizDraft = async (draftQuestion) => {
    if (draftQuestion?.published) return; // not a draft

    const isLinkedDraft = !!draftQuestion?.draft_of;
    const confirmMessage = isLinkedDraft
      ? "Discard this draft change and keep the published version?"
      : "Discard this unpublished question permanently?";

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/questions/${draftQuestion.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to discard draft");
        return;
      }
      await loadQuizQuestions();
      if (quizSelectedQuestion?.id === draftQuestion.id) {
        if (isLinkedDraft) {
          const original = quizQuestions.find(
            (q) => q.id === draftQuestion.draft_of
          );
          if (original) selectQuizQuestion(original);
          else setQuizSelectedQuestion(null);
        } else {
          // For standalone drafts, just clear selection
          setQuizSelectedQuestion(null);
        }
      }
    } catch (e) {
      console.error("Discard quiz draft error", e);
      alert("Failed to discard draft");
    }
  };

  const duplicateQuizQuestion = async (question) => {
    const dup = {
      ...question,
      text: `${question.text} (Copy)`,
      position: quizQuestions.length + 1,
      choices: question.choices?.map((c) => ({ ...c })) || [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    };
    delete dup.id;
    try {
      const resp = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dup,
          chapter_id: selectedChapter.id,
          is_practice: false,
          published: false,
        }),
      });
      if (resp.ok) {
        setQuizSuccessMessage(
          "Question duplicated as draft - ready to publish!"
        );
        setTimeout(() => setQuizSuccessMessage(""), 3000);
        await loadQuizQuestions();
      } else {
        const err = await resp.json();
        setQuizSuccessMessage(`Error: ${err.error || "Failed to duplicate"}`);
        setTimeout(() => setQuizSuccessMessage(""), 4000);
      }
    } catch (e) {
      console.error("Duplicate quiz question error", e);
      setQuizSuccessMessage("Failed to duplicate");
      setTimeout(() => setQuizSuccessMessage(""), 4000);
    }
  };

  const deleteQuizQuestion = async (question) => {
    if (!confirm(`Delete "${question.text}"?`)) return;
    try {
      const resp = await fetch(`/api/admin/questions/${question.id}`, {
        method: "DELETE",
      });
      if (resp.ok) {
        await loadQuizQuestions();
        if (quizSelectedQuestion?.id === question.id) {
          const remaining = quizQuestions.filter((q) => q.id !== question.id);
          if (remaining.length > 0) setQuizSelectedQuestion(remaining[0]);
          else {
            setQuizSelectedQuestion(null);
            startNewQuizQuestion();
          }
        }
        setQuizSuccessMessage("Question deleted");
        setTimeout(() => setQuizSuccessMessage(""), 3000);
      } else {
        const err = await resp.json();
        setQuizSuccessMessage(`Error: ${err.error || "Failed to delete"}`);
        setTimeout(() => setQuizSuccessMessage(""), 4000);
      }
    } catch (e) {
      console.error("Delete quiz question error", e);
      setQuizSuccessMessage("Failed to delete question");
      setTimeout(() => setQuizSuccessMessage(""), 4000);
    }
  };

  const cancelQuizQuestionEdit = () => {
    if (quizSelectedQuestion) {
      selectQuizQuestion(quizSelectedQuestion);
    } else if (quizQuestions.length > 0) {
      selectQuizQuestion(quizQuestions[0]);
    }
    setQuizEditingQuestion(false);
    setQuizHasUnsavedChanges(false);
  };

  return (
    <div className={styles.courseManager}>
      <div
        className={`${styles.courseLayout} ${
          activeTab === "practice" || activeTab === "quiz"
            ? styles.practiceMode
            : ""
        }`}
      >
        {/* Chapters Sidebar - Hidden in Practice Tab */}
        {activeTab !== "practice" && activeTab !== "quiz" && (
          <div className={styles.chaptersSidebar}>
            <div className={styles.chaptersHeader}>
              <h3>Chapters</h3>
              <button
                className={styles.addChapterBtn}
                onClick={startNewChapter}
              >
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
                (() => {
                  const draftCount = chapters.filter((c) => c.draft_of).length;
                  return (
                    <>
                      {draftCount > 0 && (
                        <div className={styles.chapterBulkActions}>
                          <button
                            className={styles.bulkPublishBtn}
                            disabled={bulkBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              bulkPublishChapterDrafts();
                            }}
                            title={
                              bulkBusy
                                ? "Working..."
                                : "Publish all chapter draft changes"
                            }
                          >
                            {bulkBusy
                              ? "Publishing…"
                              : `Publish Draft Changes (${draftCount})`}
                          </button>
                          <button
                            className={styles.bulkDiscardBtn}
                            disabled={bulkBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              bulkDiscardChapterDrafts();
                            }}
                            title={
                              bulkBusy
                                ? "Working..."
                                : "Discard all chapter draft changes"
                            }
                          >
                            {bulkBusy
                              ? "Discarding…"
                              : `Discard Draft Changes (${draftCount})`}
                          </button>
                        </div>
                      )}
                      {chapters.map((chapter) => {
                        const isDraft = !!chapter.draft_of;
                        const isUnpublishedOriginal =
                          !chapter.published && !isDraft;
                        return (
                          <div
                            key={chapter.id}
                            className={`${styles.chapterItem} ${
                              selectedChapter?.id === chapter.id
                                ? styles.active
                                : ""
                            }`}
                            onClick={() => selectChapter(chapter)}
                          >
                            <div className={styles.chapterTop}>
                              <div className={styles.chapterTitleLine}>
                                <span className={styles.chapterLabel}>
                                  Chapter {chapter.position}:
                                </span>
                                <span className={styles.chapterTitleText}>
                                  {chapter.title}
                                </span>
                              </div>
                              <div className={styles.chapterButtons}>
                                <button
                                  className={styles.editTinyBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectChapter(chapter);
                                    startEditChapter();
                                  }}
                                >
                                  Edit
                                </button>
                                {isDraft && (
                                  <>
                                    <button
                                      className={styles.publishTinyBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        publishChapter(chapter);
                                      }}
                                    >
                                      Publish
                                    </button>
                                    <button
                                      className={styles.discardTinyBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        discardChapterDraft(chapter);
                                      }}
                                    >
                                      Discard
                                    </button>
                                  </>
                                )}
                                {isUnpublishedOriginal && (
                                  <button
                                    className={styles.publishTinyBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      publishChapter(chapter);
                                    }}
                                  >
                                    Publish
                                  </button>
                                )}
                                <button
                                  className={styles.deleteTinyBtn}
                                  title="Delete chapter"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteChapter(chapter);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            <div className={styles.chapterMetaLine}>
                              <span>
                                {chapter.video_url ? "Video" : "No video"}
                              </span>
                              <span>• Practice</span>
                              <span>• Quiz</span>
                            </div>
                            {(isDraft || isUnpublishedOriginal) && (
                              <div className={styles.chapterStatusLine}>
                                {isDraft && (
                                  <span className={styles.statusDraft}>
                                    Draft changes pending publish
                                  </span>
                                )}
                                {isUnpublishedOriginal && (
                                  <span className={styles.statusUnpublished}>
                                    Unpublished chapter
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()
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
              Practice{" "}
              <span className={styles.questionCount}>
                ({practiceQuestions.length})
              </span>
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "quiz" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("quiz")}
            >
              Quiz{" "}
              <span className={styles.questionCount}>
                ({quizQuestions.length})
              </span>
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
            <div
              className={`${styles.detailsForm} ${
                editingChapter ? styles.editMode : styles.viewMode
              }`}
            >
              <div className={styles.formGroup}>
                <label>Chapter title</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  disabled={!editingChapter}
                  onChange={(e) =>
                    setChapterForm({ ...chapterForm, title: e.target.value })
                  }
                  placeholder="e.g., Structure & Bonding"
                />
                {chapterErrors.title && (
                  <div className={styles.fieldError}>{chapterErrors.title}</div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Short description</label>
                <textarea
                  value={chapterForm.description}
                  disabled={!editingChapter}
                  onChange={(e) =>
                    setChapterForm({
                      ...chapterForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="One or two lines to describe the chapter."
                />
                {chapterErrors.description && (
                  <div className={styles.fieldError}>
                    {chapterErrors.description}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>YouTube link</label>
                <input
                  type="text"
                  value={chapterForm.video_url}
                  disabled={!editingChapter}
                  onChange={(e) =>
                    setChapterForm({
                      ...chapterForm,
                      video_url: e.target.value,
                    })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
                {chapterErrors.video_url && (
                  <div className={styles.fieldError}>
                    {chapterErrors.video_url}
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <input
                    type="number"
                    value={chapterForm.position}
                    disabled={!editingChapter}
                    onChange={(e) =>
                      setChapterForm({
                        ...chapterForm,
                        position: e.target.value,
                      })
                    }
                  />
                  {chapterErrors.position && (
                    <div className={styles.fieldError}>
                      {chapterErrors.position}
                    </div>
                  )}
                </div>
              </div>
              {!editingChapter && selectedChapter && (
                <div className={styles.inlineEditBar}>
                  <button className={styles.editBtn} onClick={startEditChapter}>
                    Edit Chapter
                  </button>
                </div>
              )}
              {editingChapter && (
                <div className={styles.inlineEditBar}>
                  <button className={styles.cancelBtn} onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button
                    className={styles.saveBtn}
                    onClick={saveChapter}
                    disabled={
                      !editingChapter ||
                      (selectedChapter && !hasChapterUnsavedChanges)
                    }
                    title={
                      selectedChapter && !hasChapterUnsavedChanges
                        ? "No changes to save"
                        : ""
                    }
                  >
                    Save Changes
                  </button>
                  {hasChapterUnsavedChanges && (
                    <span className={styles.modifiedTag}>UNSAVED</span>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "practice" && (
            <div className={styles.practiceContent}>
              {/* Success Message */}
              {successMessage && (
                <div className={styles.successMessage}>{successMessage}</div>
              )}

              {/* Questions Sidebar */}
              <div className={styles.questionsSidebar}>
                <div className={styles.questionsHeader}>
                  <h3>Practice Quiz</h3>
                  <div className={styles.questionHeaderActions}>
                    {practiceQuestions.filter((q) => !q.published).length >
                      1 && (
                      <button
                        className={styles.publishAllBtn}
                        onClick={publishAllDrafts}
                        title={`Publish ${
                          practiceQuestions.filter((q) => !q.published).length
                        } draft questions`}
                      >
                        Publish All Drafts (
                        {practiceQuestions.filter((q) => !q.published).length})
                      </button>
                    )}

                    <button
                      className={styles.addQuestionBtn}
                      onClick={startNewQuestion}
                    >
                      + Add Question
                    </button>
                  </div>
                </div>

                {/* Draft Changes Controls */}
                {practiceQuestions.filter((q) => !q.published).length > 1 && (
                  <div className={styles.sessionActionsContainer}>
                    <button
                      className={styles.discardAllBtn}
                      onClick={discardAllDrafts}
                    >
                      🗑️ Discard All Draft Changes (
                      {practiceQuestions.filter((q) => !q.published).length})
                    </button>
                  </div>
                )}

                <div className={styles.questionsList}>
                  {questionsLoading ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#8b949e",
                      }}
                    >
                      Loading questions...
                    </div>
                  ) : practiceQuestions.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#8b949e",
                      }}
                    >
                      No practice quiz questions yet. Click "+ Add Question" to
                      get started.
                    </div>
                  ) : (
                    [...practiceQuestions]
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((question, index) => (
                        <div
                          key={question.id}
                          className={`${styles.questionItem} ${
                            selectedQuestion?.id === question.id
                              ? styles.active
                              : ""
                          }`}
                          onClick={() => selectQuestion(question)}
                        >
                          <div className={styles.questionContent}>
                            <div className={styles.questionHeader}>
                              <span className={styles.questionNumber}>
                                Q{index + 1}
                              </span>
                              <span className={styles.questionType}>
                                {question.type?.toUpperCase()}
                              </span>
                              <span className={styles.questionPoints}>
                                • {question.points} pts
                              </span>
                              {!question.published && (
                                <span className={styles.draftTag}>DRAFT</span>
                              )}
                              {(selectedQuestion?.id === question.id
                                ? questionForm.image_url
                                : question.image_url) && (
                                <span
                                  className={styles.imageTag}
                                  title="Has image"
                                >
                                  IMG
                                </span>
                              )}
                              {hasUnsavedChanges &&
                                selectedQuestion?.id === question.id && (
                                  <span
                                    className={styles.modifiedTag}
                                    title="Has unsaved changes"
                                  >
                                    UNSAVED
                                  </span>
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
                                className={`${styles.editBtn} ${
                                  editingQuestion &&
                                  selectedQuestion?.id === question.id
                                    ? styles.cancelBtn
                                    : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    editingQuestion &&
                                    selectedQuestion?.id === question.id
                                  ) {
                                    // Cancel editing mode
                                    setEditingQuestion(false);
                                    setHasUnsavedChanges(false);
                                    if (selectedQuestion) {
                                      selectQuestion(selectedQuestion); // Reset to original data
                                    }
                                  } else {
                                    startEditingQuestion(question);
                                  }
                                }}
                              >
                                {editingQuestion &&
                                selectedQuestion?.id === question.id
                                  ? "Cancel"
                                  : "Edit"}
                              </button>
                              <button
                                className={`${styles.publishBtn} ${
                                  question.published
                                    ? styles.unpublish
                                    : styles.publish
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleQuestionPublish(question);
                                }}
                              >
                                {question.published ? "Unpublish" : "Publish"}
                              </button>
                              {!question.published && (
                                <button
                                  className={styles.discardTinyBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    discardPracticeDraft(question);
                                  }}
                                >
                                  Discard
                                </button>
                              )}
                              {/* <button className={styles.moveBtn}>Move ↑↓</button> */}
                            </div>
                          </div>

                          <div className={styles.questionMenu}>
                            <button
                              className={styles.deleteBtn}
                              title="Delete question"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuestion(question);
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

              {/* Question Form */}
              <div
                className={`${styles.questionForm} ${
                  editingQuestion ? styles.editing : ""
                }`}
              >
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Type</label>
                    <select
                      value={questionForm.type}
                      disabled={!editingQuestion}
                      onChange={(e) => {
                        if (!editingQuestion) return;
                        const newType = e.target.value;
                        const newChoices =
                          newType === "true_false"
                            ? [
                                {
                                  text: "True",
                                  is_correct: false,
                                  image_url: "",
                                },
                                {
                                  text: "False",
                                  is_correct: false,
                                  image_url: "",
                                },
                              ]
                            : [
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                              ];
                        setQuestionForm({
                          ...questionForm,
                          type: newType,
                          choices: newChoices,
                        });
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Points</label>
                    <input
                      type="number"
                      value={questionForm.points}
                      readOnly={!editingQuestion}
                      disabled={!editingQuestion}
                      onChange={(e) => {
                        if (!editingQuestion) return;
                        setQuestionForm({
                          ...questionForm,
                          points: parseInt(e.target.value),
                        });
                        setHasUnsavedChanges(true);
                      }}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Position</label>
                    <input
                      type="number"
                      value={questionForm.position}
                      readOnly={!editingQuestion}
                      disabled={!editingQuestion}
                      onChange={(e) => {
                        if (!editingQuestion) return;
                        setQuestionForm({
                          ...questionForm,
                          position: parseInt(e.target.value),
                        });
                        setHasUnsavedChanges(true);
                      }}
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Prompt</label>
                  <textarea
                    value={questionForm.text}
                    readOnly={!editingQuestion}
                    disabled={!editingQuestion}
                    onChange={(e) => {
                      if (!editingQuestion) return;
                      setQuestionForm({
                        ...questionForm,
                        text: e.target.value,
                      });
                      setHasUnsavedChanges(true);
                    }}
                    placeholder={
                      editingQuestion
                        ? "Enter your question here..."
                        : "Question text (read-only)"
                    }
                    rows="3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Question Image (optional)</label>
                  <ImageUpload
                    currentImageUrl={questionForm.image_url || ""}
                    onImageChange={(url) => {
                      if (!editingQuestion) return;
                      setQuestionForm({ ...questionForm, image_url: url });
                      setHasUnsavedChanges(true);
                    }}
                    folder="questions"
                    prefix="practice_question"
                    placeholder={
                      editingQuestion
                        ? "Drop image here or click to upload"
                        : "Question image (view only)"
                    }
                    disabled={!editingQuestion}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    {questionForm.type === "true_false"
                      ? "Select correct answer"
                      : "Answer choices"}
                  </label>
                  {/* Validation Message */}
                  {validationMessage && (
                    <div
                      className={styles.validationMessage}
                      style={{ marginTop: "8px", marginBottom: "12px" }}
                    >
                      {validationMessage}
                    </div>
                  )}
                  <div className={styles.choicesGrid}>
                    {questionForm.choices.map((choice, index) => (
                      <div key={index} className={styles.choiceItem}>
                        <div className={styles.choiceHeader}>
                          <span className={styles.choiceLabel}>
                            {String.fromCharCode(65 + index)})
                          </span>
                          <button
                            className={`${styles.correctBtn} ${
                              choice.is_correct ? styles.correct : ""
                            }`}
                            onClick={() => {
                              const newChoices = [...questionForm.choices];
                              if (questionForm.type === "true_false") {
                                // For True/False, only one answer can be correct
                                newChoices.forEach((c, i) => {
                                  c.is_correct = i === index;
                                });
                              } else {
                                // For Multiple Choice, toggle this choice
                                newChoices[index] = {
                                  ...choice,
                                  is_correct: !choice.is_correct,
                                };
                              }
                              setQuestionForm({
                                ...questionForm,
                                choices: newChoices,
                              });
                              setHasUnsavedChanges(true);
                            }}
                          >
                            {choice.is_correct ? "✓ Correct" : "Mark correct"}
                          </button>
                        </div>

                        <div className={styles.choiceContent}>
                          <div className={styles.choiceText}>
                            <label>Answer Text</label>
                            <input
                              type="text"
                              value={choice.text}
                              placeholder={
                                editingQuestion
                                  ? `Choice ${String.fromCharCode(
                                      65 + index
                                    )} text`
                                  : "Choice text (read-only)"
                              }
                              readOnly={
                                questionForm.type === "true_false" ||
                                !editingQuestion
                              }
                              disabled={!editingQuestion}
                              onChange={(e) => {
                                if (
                                  questionForm.type === "true_false" ||
                                  !editingQuestion
                                )
                                  return;
                                const newChoices = [...questionForm.choices];
                                newChoices[index] = {
                                  ...choice,
                                  text: e.target.value,
                                };
                                setQuestionForm({
                                  ...questionForm,
                                  choices: newChoices,
                                });
                                setHasUnsavedChanges(true);
                              }}
                            />
                          </div>

                          {questionForm.type !== "true_false" && (
                            <div className={styles.choiceImage}>
                              <label>Choice Image (optional)</label>
                              <ImageUpload
                                currentImageUrl={choice.image_url || ""}
                                onImageChange={(url) => {
                                  if (!editingQuestion) return;
                                  const newChoices = [...questionForm.choices];
                                  newChoices[index] = {
                                    ...choice,
                                    image_url: url,
                                  };
                                  setQuestionForm({
                                    ...questionForm,
                                    choices: newChoices,
                                  });
                                  setHasUnsavedChanges(true);
                                }}
                                folder="choices"
                                prefix={`choice_${String.fromCharCode(
                                  65 + index
                                )}`}
                                placeholder={
                                  editingQuestion
                                    ? "Add image for this choice"
                                    : "Choice image (view only)"
                                }
                                className="compact"
                                disabled={!editingQuestion}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {editingQuestion && (
                  <div className={styles.questionFormActions}>
                    <button
                      className={styles.saveDraftBtn}
                      onClick={cancelQuestionEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveQuestionBtn}
                      onClick={saveQuestion}
                      disabled={
                        !questionForm.text.trim() ||
                        (selectedQuestion && !hasUnsavedChanges)
                      }
                      title={
                        selectedQuestion && !hasUnsavedChanges
                          ? "No changes to save"
                          : ""
                      }
                    >
                      {editingQuestion
                        ? selectedQuestion
                          ? hasUnsavedChanges
                            ? "Save Changes"
                            : "Save Question"
                          : "Save Question"
                        : "Save Question"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className={styles.practiceContent}>
              {quizSuccessMessage && (
                <div className={styles.successMessage}>
                  {quizSuccessMessage}
                </div>
              )}
              <div className={styles.questionsSidebar}>
                <div className={styles.questionsHeader}>
                  <h3>Chapter Quiz</h3>
                  <div className={styles.questionHeaderActions}>
                    {quizQuestions.filter((q) => !q.published).length > 1 && (
                      <button
                        className={styles.publishAllBtn}
                        onClick={publishAllQuizDrafts}
                        title={`Publish ${
                          quizQuestions.filter((q) => !q.published).length
                        } draft questions`}
                      >
                        Publish All Drafts (
                        {quizQuestions.filter((q) => !q.published).length})
                      </button>
                    )}
                    <button
                      className={styles.addQuestionBtn}
                      onClick={startNewQuizQuestion}
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
                {quizQuestions.filter((q) => !q.published).length > 1 && (
                  <div className={styles.sessionActionsContainer}>
                    <button
                      className={styles.discardAllBtn}
                      onClick={discardAllQuizDrafts}
                    >
                      🗑️ Discard All Draft Changes (
                      {quizQuestions.filter((q) => !q.published).length})
                    </button>
                  </div>
                )}
                <div className={styles.questionsList}>
                  {quizQuestionsLoading ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#8b949e",
                      }}
                    >
                      Loading questions...
                    </div>
                  ) : quizQuestions.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#8b949e",
                      }}
                    >
                      No quiz questions yet. Click "+ Add Question" to get
                      started.
                    </div>
                  ) : (
                    [...quizQuestions]
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                      .map((question, index) => (
                        <div
                          key={question.id}
                          className={`${styles.questionItem} ${
                            quizSelectedQuestion?.id === question.id
                              ? styles.active
                              : ""
                          }`}
                          onClick={() => selectQuizQuestion(question)}
                        >
                          <div className={styles.questionContent}>
                            <div className={styles.questionHeader}>
                              <span className={styles.questionNumber}>
                                Q{index + 1}
                              </span>
                              <span className={styles.questionType}>
                                {question.type?.toUpperCase()}
                              </span>
                              <span className={styles.questionPoints}>
                                • {question.points} pts
                              </span>
                              {!question.published && (
                                <span className={styles.draftTag}>DRAFT</span>
                              )}
                              {(quizSelectedQuestion?.id === question.id
                                ? quizQuestionForm.image_url
                                : question.image_url) && (
                                <span
                                  className={styles.imageTag}
                                  title="Has image"
                                >
                                  IMG
                                </span>
                              )}
                              {quizHasUnsavedChanges &&
                                quizSelectedQuestion?.id === question.id && (
                                  <span
                                    className={styles.modifiedTag}
                                    title="Has unsaved changes"
                                  >
                                    UNSAVED
                                  </span>
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
                                  duplicateQuizQuestion(question);
                                }}
                              >
                                Duplicate
                              </button>
                              <button
                                className={`${styles.editBtn} ${
                                  quizEditingQuestion &&
                                  quizSelectedQuestion?.id === question.id
                                    ? styles.cancelBtn
                                    : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    quizEditingQuestion &&
                                    quizSelectedQuestion?.id === question.id
                                  ) {
                                    setQuizEditingQuestion(false);
                                    setQuizHasUnsavedChanges(false);
                                    if (quizSelectedQuestion)
                                      selectQuizQuestion(quizSelectedQuestion);
                                  } else {
                                    startEditingQuizQuestion(question);
                                  }
                                }}
                              >
                                {quizEditingQuestion &&
                                quizSelectedQuestion?.id === question.id
                                  ? "Cancel"
                                  : "Edit"}
                              </button>
                              <button
                                className={`${styles.publishBtn} ${
                                  question.published
                                    ? styles.unpublish
                                    : styles.publish
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleQuizQuestionPublish(question);
                                }}
                              >
                                {question.published ? "Unpublish" : "Publish"}
                              </button>
                              {!question.published && (
                                <button
                                  className={styles.discardTinyBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    discardQuizDraft(question);
                                  }}
                                >
                                  Discard
                                </button>
                              )}
                            </div>
                          </div>
                          <div className={styles.questionMenu}>
                            <button
                              className={styles.deleteBtn}
                              title="Delete question"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuizQuestion(question);
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
              <div
                className={`${styles.questionForm} ${
                  quizEditingQuestion ? styles.editing : ""
                }`}
              >
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Type</label>
                    <select
                      value={quizQuestionForm.type}
                      disabled={!quizEditingQuestion}
                      onChange={(e) => {
                        if (!quizEditingQuestion) return;
                        const newType = e.target.value;
                        const newChoices =
                          newType === "true_false"
                            ? [
                                {
                                  text: "True",
                                  is_correct: false,
                                  image_url: "",
                                },
                                {
                                  text: "False",
                                  is_correct: false,
                                  image_url: "",
                                },
                              ]
                            : [
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                                { text: "", is_correct: false, image_url: "" },
                              ];
                        setQuizQuestionForm({
                          ...quizQuestionForm,
                          type: newType,
                          choices: newChoices,
                        });
                        setQuizHasUnsavedChanges(true);
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Points</label>
                    <input
                      type="number"
                      value={quizQuestionForm.points}
                      readOnly={!quizEditingQuestion}
                      disabled={!quizEditingQuestion}
                      onChange={(e) => {
                        if (!quizEditingQuestion) return;
                        setQuizQuestionForm({
                          ...quizQuestionForm,
                          points: parseInt(e.target.value),
                        });
                        setQuizHasUnsavedChanges(true);
                      }}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Position</label>
                    <input
                      type="number"
                      value={quizQuestionForm.position}
                      readOnly={!quizEditingQuestion}
                      disabled={!quizEditingQuestion}
                      onChange={(e) => {
                        if (!quizEditingQuestion) return;
                        setQuizQuestionForm({
                          ...quizQuestionForm,
                          position: parseInt(e.target.value),
                        });
                        setQuizHasUnsavedChanges(true);
                      }}
                      min="1"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Prompt</label>
                  <textarea
                    value={quizQuestionForm.text}
                    readOnly={!quizEditingQuestion}
                    disabled={!quizEditingQuestion}
                    onChange={(e) => {
                      if (!quizEditingQuestion) return;
                      setQuizQuestionForm({
                        ...quizQuestionForm,
                        text: e.target.value,
                      });
                      setQuizHasUnsavedChanges(true);
                    }}
                    placeholder={
                      quizEditingQuestion
                        ? "Enter your question here..."
                        : "Question text (read-only)"
                    }
                    rows="3"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Question Image (optional)</label>
                  <ImageUpload
                    currentImageUrl={quizQuestionForm.image_url || ""}
                    onImageChange={(url) => {
                      if (!quizEditingQuestion) return;
                      setQuizQuestionForm({
                        ...quizQuestionForm,
                        image_url: url,
                      });
                      setQuizHasUnsavedChanges(true);
                    }}
                    folder="questions"
                    prefix="quiz_question"
                    placeholder={
                      quizEditingQuestion
                        ? "Drop image here or click to upload"
                        : "Question image (view only)"
                    }
                    disabled={!quizEditingQuestion}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    {quizQuestionForm.type === "true_false"
                      ? "Select correct answer"
                      : "Answer choices"}
                  </label>
                  {quizValidationMessage && (
                    <div
                      className={styles.validationMessage}
                      style={{ marginTop: "8px", marginBottom: "12px" }}
                    >
                      {quizValidationMessage}
                    </div>
                  )}
                  <div className={styles.choicesGrid}>
                    {quizQuestionForm.choices.map((choice, index) => (
                      <div key={index} className={styles.choiceItem}>
                        <div className={styles.choiceHeader}>
                          <span className={styles.choiceLabel}>
                            {String.fromCharCode(65 + index)})
                          </span>
                          <button
                            className={`${styles.correctBtn} ${
                              choice.is_correct ? styles.correct : ""
                            }`}
                            onClick={() => {
                              const newChoices = [...quizQuestionForm.choices];
                              if (quizQuestionForm.type === "true_false") {
                                newChoices.forEach(
                                  (c, i) => (c.is_correct = i === index)
                                );
                              } else {
                                newChoices[index] = {
                                  ...choice,
                                  is_correct: !choice.is_correct,
                                };
                              }
                              setQuizQuestionForm({
                                ...quizQuestionForm,
                                choices: newChoices,
                              });
                              setQuizHasUnsavedChanges(true);
                            }}
                          >
                            {choice.is_correct ? "✓ Correct" : "Mark correct"}
                          </button>
                        </div>
                        <div className={styles.choiceContent}>
                          <div className={styles.choiceText}>
                            <label>Answer Text</label>
                            <input
                              type="text"
                              value={choice.text}
                              placeholder={
                                quizEditingQuestion
                                  ? `Choice ${String.fromCharCode(
                                      65 + index
                                    )} text`
                                  : "Choice text (read-only)"
                              }
                              readOnly={
                                quizQuestionForm.type === "true_false" ||
                                !quizEditingQuestion
                              }
                              disabled={!quizEditingQuestion}
                              onChange={(e) => {
                                if (
                                  quizQuestionForm.type === "true_false" ||
                                  !quizEditingQuestion
                                )
                                  return;
                                const newChoices = [
                                  ...quizQuestionForm.choices,
                                ];
                                newChoices[index] = {
                                  ...choice,
                                  text: e.target.value,
                                };
                                setQuizQuestionForm({
                                  ...quizQuestionForm,
                                  choices: newChoices,
                                });
                                setQuizHasUnsavedChanges(true);
                              }}
                            />
                          </div>
                          {quizQuestionForm.type !== "true_false" && (
                            <div className={styles.choiceImage}>
                              <label>Choice Image (optional)</label>
                              <ImageUpload
                                currentImageUrl={choice.image_url || ""}
                                onImageChange={(url) => {
                                  if (!quizEditingQuestion) return;
                                  const newChoices = [
                                    ...quizQuestionForm.choices,
                                  ];
                                  newChoices[index] = {
                                    ...choice,
                                    image_url: url,
                                  };
                                  setQuizQuestionForm({
                                    ...quizQuestionForm,
                                    choices: newChoices,
                                  });
                                  setQuizHasUnsavedChanges(true);
                                }}
                                folder="choices"
                                prefix={`quiz_choice_${String.fromCharCode(
                                  65 + index
                                )}`}
                                placeholder={
                                  quizEditingQuestion
                                    ? "Add image for this choice"
                                    : "Choice image (view only)"
                                }
                                className="compact"
                                disabled={!quizEditingQuestion}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {quizEditingQuestion && (
                  <div className={styles.questionFormActions}>
                    <button
                      className={styles.saveDraftBtn}
                      onClick={cancelQuizQuestionEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveQuestionBtn}
                      onClick={saveQuizQuestion}
                      disabled={
                        !quizQuestionForm.text.trim() ||
                        (quizSelectedQuestion && !quizHasUnsavedChanges)
                      }
                      title={
                        quizSelectedQuestion && !quizHasUnsavedChanges
                          ? "No changes to save"
                          : ""
                      }
                    >
                      {quizEditingQuestion
                        ? quizSelectedQuestion
                          ? quizHasUnsavedChanges
                            ? "Save Changes"
                            : "Save Question"
                          : "Save Question"
                        : "Save Question"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Draft Warning */}
          {selectedChapter &&
            !selectedChapter.published &&
            !selectedChapter.draft_of && (
              <div className={styles.draftWarning}>
                ⚠️ This chapter is saved as a draft and is not visible to
                students yet. Click "Publish Chapter" to make it live.
              </div>
            )}
          {selectedChapter && selectedChapter.draft_of && (
            <div className={styles.draftWarning}>
              ✏️ You are viewing draft changes for a published chapter. Publish
              to apply these changes or Discard to revert.
            </div>
          )}

          {/* Legacy chapter action bar removed in favor of inline edit controls */}
        </div>
      </div>

      <div className={styles.courseActions}>
        <button
          className={styles.saveDraftBtn}
          onClick={() =>
            alert(
              "All chapters are automatically saved as drafts. Use individual chapter publish buttons to make them live."
            )
          }
        >
          All Saved as Drafts
        </button>
        <button
          className={styles.publishBtn}
          onClick={() => {
            const unpublishedChapters = chapters.filter((ch) => !ch.published);
            if (unpublishedChapters.length === 0) {
              alert("All chapters are already published!");
              return;
            }
            if (
              confirm(
                `Publish ${unpublishedChapters.length} unpublished chapters?`
              )
            ) {
              unpublishedChapters.forEach((chapter) => publishChapter(chapter));
            }
          }}
        >
          Publish All Chapters
        </button>
      </div>
    </div>
  );
}

// Legacy QuestionBuilder component removed as part of cleanup
