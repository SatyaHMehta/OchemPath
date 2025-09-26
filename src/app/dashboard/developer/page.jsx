"use client";

import React, { useEffect, useState } from "react";
import styles from "../page.module.css";

export default function DeveloperDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
  });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const res = await fetch("/api/admin/courses");
    const data = await res.json();
    setCourses(data || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/admin/courses/${editing}`, {
        method: "PUT",
        body: JSON.stringify(form),
        headers: { "content-type": "application/json" },
      });
    } else {
      await fetch("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify(form),
        headers: { "content-type": "application/json" },
      });
    }
    setForm({ title: "", description: "", image_url: "" });
    setEditing(null);
    await loadCourses();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    await loadCourses();
  }

  function startEdit(c) {
    setEditing(c.id);
    setForm({
      title: c.title || "",
      description: c.description || "",
      image_url: c.image_url || "",
    });
  }

  return (
    <div className={styles.container}>
      <h2>Developer Dashboard — Courses</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className={styles.input}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className={styles.input}
          placeholder="Image URL"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <button className={styles.button} type="submit">
          {editing ? "Save" : "Create"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ title: "", description: "", image_url: "" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div>
          {courses.map((c) => (
            <div
              key={c.id}
              style={{ border: "1px solid #ddd", padding: 12, margin: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{c.title}</strong>
                <div>
                  <button onClick={() => startEdit(c)}>Edit</button>
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </div>
              </div>
              <div>{c.description}</div>
              <div>
                <h4>Chapters</h4>
                <ChapterList courseId={c.id} onChange={loadCourses} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterList({ courseId, onChange }) {
  const [chapters, setChapters] = useState([]);
  const [form, setForm] = useState({ position: "", title: "", video_url: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/chapters?course_id=" + courseId);
    const data = await res.json();
    setChapters(data || []);
  }

  async function createChapter(e) {
    e.preventDefault();
    const payload = {
      course_id: courseId,
      position: Number(form.position || chapters.length + 1),
      title: form.title,
      video_url: form.video_url,
    };
    await fetch("/api/admin/chapters", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    });
    setForm({ position: "", title: "", video_url: "" });
    await load();
    onChange?.();
  }

  async function delChapter(id) {
    if (!confirm("Delete chapter?")) return;
    await fetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
    await load();
    onChange?.();
  }

  return (
    <div>
      <ul>
        {chapters.map((ch) => (
          <li key={ch.id}>
            {ch.position}. {ch.title} — {ch.video_url}
            <button onClick={() => delChapter(ch.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <form onSubmit={createChapter}>
        <input
          placeholder="position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        />
        <input
          placeholder="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          placeholder="video_url"
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
        />
        <button type="submit">Add chapter</button>
      </form>
    </div>
  );
}
