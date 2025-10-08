"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

// Mock users with generic names (fallback only)
const MOCK_USERS = [
  {
    id: "u1",
    name: "User #1",
    email: "user1@example.com",
    initials: "U1",
    role: "student",
    university: "UCLA",
    courses: 3,
    attempts: 14,
    avgScore: 0.88,
    practiceCoverage: 0.72,
    lastActive: "2d ago",
    status: "active",
    activity: [
      {
        kind: "practice",
        title: "Practice • Chapter 1",
        meta: "Answered: 8 / 10 • 10m",
        when: "2d ago",
      },
    ],
  },
  {
    id: "u2",
    name: "User #2",
    email: "user2@example.com",
    initials: "U2",
    role: "student",
    university: "UT Austin",
    courses: 2,
    attempts: 17,
    avgScore: 0.76,
    practiceCoverage: 0.58,
    lastActive: "1d ago",
    status: "active",
    activity: [],
  },
  {
    id: "u3",
    name: "Professor #1",
    email: "prof1@example.com",
    initials: "P1",
    role: "professor",
    university: "UC Berkeley",
    courses: 4,
    attempts: 14,
    avgScore: 0.62,
    practiceCoverage: 0.4,
    lastActive: "4h ago",
    status: "active",
    activity: [
      {
        kind: "admin",
        title: "Published Chapter 2",
        meta: "12 questions",
        when: "4h ago",
      },
    ],
  },
  {
    id: "u4",
    name: "User #3",
    email: "user3@example.com",
    initials: "U3",
    role: "student",
    university: "MIT",
    courses: 1,
    attempts: 19,
    avgScore: 0.7,
    practiceCoverage: 0.66,
    lastActive: "3d ago",
    status: "inactive",
    activity: [],
  },
  {
    id: "u5",
    name: "TA #1",
    email: "ta1@example.com",
    initials: "TA",
    role: "ta",
    university: "Stanford",
    courses: 3,
    attempts: 3,
    avgScore: 0.92,
    practiceCoverage: 0.31,
    lastActive: "5d ago",
    status: "active",
    activity: [
      {
        kind: "admin",
        title: "Approved questions",
        meta: "5 items",
        when: "5d ago",
      },
    ],
  },
  {
    id: "u6",
    name: "User #4",
    email: "user4@example.com",
    initials: "U4",
    role: "student",
    university: "Harvard",
    courses: 3,
    attempts: 7,
    avgScore: 0.63,
    practiceCoverage: 0.36,
    lastActive: "6d ago",
    status: "active",
    activity: [],
  },
  {
    id: "u7",
    name: "User #5",
    email: "user5@example.com",
    initials: "U5",
    role: "student",
    university: "UWashington",
    courses: 1,
    attempts: 11,
    avgScore: 0.63,
    practiceCoverage: 0.42,
    lastActive: "8d ago",
    status: "active",
    activity: [],
  },
  {
    id: "u8",
    name: "Professor #2",
    email: "prof2@example.com",
    initials: "P2",
    role: "professor",
    university: "UChicago",
    courses: 3,
    attempts: 5,
    avgScore: 0.69,
    practiceCoverage: 0.45,
    lastActive: "1d ago",
    status: "active",
    activity: [
      {
        kind: "admin",
        title: "Created course sections",
        meta: "3 sections",
        when: "1d ago",
      },
    ],
  },
  {
    id: "u9",
    name: "User #6",
    email: "user6@example.com",
    initials: "U6",
    role: "student",
    university: "NYU",
    courses: 3,
    attempts: 15,
    avgScore: 0.93,
    practiceCoverage: 0.84,
    lastActive: "2d ago",
    status: "active",
    activity: [
      {
        kind: "quiz",
        title: "Quiz • Chapter 6",
        meta: "Score: 9/10",
        when: "2d ago",
      },
    ],
  },
  {
    id: "u10",
    name: "GuestUser #1",
    email: "guest1@example.com",
    initials: "G1",
    role: "guest",
    university: "—",
    courses: 0,
    attempts: 0,
    avgScore: 0.5,
    practiceCoverage: 0.1,
    lastActive: "9d ago",
    status: "inactive",
    activity: [],
  },
  {
    id: "u11",
    name: "Admin #1",
    email: "admin1@example.com",
    initials: "A1",
    role: "admin",
    university: "—",
    courses: 0,
    attempts: 0,
    avgScore: 1,
    practiceCoverage: 0,
    lastActive: "now",
    status: "active",
    activity: [
      {
        kind: "admin",
        title: "Added new professor",
        meta: "Professor #2",
        when: "now",
      },
    ],
  },
  {
    id: "u12",
    name: "GuestUser #2",
    email: "guest2@example.com",
    initials: "G2",
    role: "guest",
    university: "—",
    courses: 0,
    attempts: 0,
    avgScore: 0,
    practiceCoverage: 0,
    lastActive: "3h ago",
    status: "inactive",
    activity: [],
  },
];

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const initials = (first + last).toUpperCase();
  return initials || name[0]?.toUpperCase() || "U";
}

function timeAgo(ts) {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const diff = Date.now() - d.getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const roleLabel = (r) => {
  switch (r) {
    case "student":
      return { text: "Student", cls: styles.badgeStudent };
    case "professor":
      return { text: "Professor", cls: styles.badgeProfessor };
    case "admin":
      return { text: "Admin", cls: styles.badgeAdmin };
    case "guest":
      return { text: "Guest", cls: styles.badgeGuest };
    case "ta":
      return { text: "TA", cls: styles.badgeTA };
    default:
      return { text: r, cls: styles.badge };
  }
};

const chips = [
  { key: "all", label: "All" },
  { key: "student", label: "Students" },
  { key: "professor", label: "Professors" },
  { key: "ta", label: "TAs" },
  { key: "admin", label: "Admins" },
  { key: "guest", label: "Guests" },
];

function Row({ u, selected, onToggle, onClick }) {
  const role = roleLabel(u.role);
  return (
    <div
      className={`${styles.row} ${selected ? styles.rowSelected : ""}`}
      onClick={onClick}
    >
      <div>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className={styles.nameCell}>
        <div className={styles.avatar}>{u.initials}</div>
        <div>
          <div style={{ fontWeight: 600 }}>{u.name}</div>
          <div className={styles.small}>{u.email}</div>
        </div>
      </div>
      <div>
        <span className={`${styles.badge} ${role.cls}`}>{role.text}</span>
      </div>
      <div className={styles.small}>{u.university}</div>
      <div className={styles.small}>{u.courses}</div>
      <div className={styles.small}>{u.attempts}</div>
      <div className={styles.small}>{Math.round(u.avgScore * 100)}%</div>
    </div>
  );
}

function Details({ user }) {
  if (!user) {
    return (
      <div className={styles.detail}>
        <div className={styles.small}>Select a user to see details</div>
      </div>
    );
  }
  const role = roleLabel(user.role);
  return (
    <div className={styles.detail}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className={styles.avatar}>{user.initials}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div className={styles.small}>
                {user.email} •{" "}
                <span
                  className={role.cls}
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: "1px solid transparent",
                  }}
                >
                  {role.text}
                </span>{" "}
                • {user.university}
              </div>
            </div>
          </div>
          <div
            className={
              user.status === "active"
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            {user.status === "active" ? "Active" : "Inactive"}
          </div>
        </div>
        <div className={styles.sectionBody}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Courses</div>
              <div className={styles.sectionBody}>{user.courses}</div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Attempts</div>
              <div className={styles.sectionBody}>{user.attempts}</div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Avg Score</div>
              <div className={`${styles.sectionBody} ${styles.mono}`}>
                {Math.round(user.avgScore * 100)}%
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Practice coverage</div>
              <div className={`${styles.sectionBody} ${styles.mono}`}>
                {Math.round(user.practiceCoverage * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>Activity</div>
          <div className={styles.small}>Last active: {user.lastActive}</div>
        </div>
        <div className={styles.sectionBody}>
          {user.activity?.length ? (
            user.activity.map((a, i) => (
              <div className={styles.activityItem} key={i}>
                <div>
                  <div style={{ fontWeight: 600 }}>{a.title}</div>
                  <div className={styles.small}>{a.meta}</div>
                </div>
                <div className={styles.small}>{a.when}</div>
              </div>
            ))
          ) : (
            <div className={styles.small}>No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          university: u.university ?? "—",
          courses: u.courses ?? 0,
          attempts: u.attempts ?? 0,
          avgScore:
            typeof u.avg_score === "number"
              ? u.avg_score
              : Number(u.avg_score ?? 0),
          practiceCoverage:
            typeof u.practice_coverage === "number"
              ? u.practice_coverage
              : Number(u.practice_coverage ?? 0),
          status: u.is_active ? "active" : "inactive",
          lastActive: timeAgo(u.last_active_at),
          initials: getInitials(u.name),
          activity: [],
        }));
        if (!cancelled) setUsers(mapped.length ? mapped : MOCK_USERS);
      } catch (e) {
        if (!cancelled) {
          setError(String(e.message || e));
          setUsers(MOCK_USERS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  const selected = users.find((u) => u.id === selectedIds[0]);

  const filtered = useMemo(() => {
    let list = users;
    if (filter !== "all") list = list.filter((u) => u.role === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.university.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, query]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = (checked) => {
    if (checked) setSelectedIds(filtered.map((u) => u.id));
    else setSelectedIds([]);
  };

  const deactivateSelected = () => {
    setUsers((prev) =>
      prev.map((u) =>
        selectedIds.includes(u.id) ? { ...u, status: "inactive" } : u
      )
    );
    setSelectedIds([]);
  };

  const assignToCourse = () => {
    alert(`Assigning ${selectedIds.length} user(s) to a course...`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.title}>Users</div>
            <div className={styles.subtitle}>
              Manage people across roles, universities, and courses.
              {loading ? " • Loading…" : ""}
              {error ? ` • Using fallback (error: ${error})` : ""}
            </div>
          </div>
        </div>
        <div className={styles.controls}>
          <div className={styles.search}>
            <input
              placeholder="Search name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            {chips.map((c) => (
              <button
                key={c.key}
                className={`${styles.chip} ${
                  filter === c.key ? styles.chipActive : ""
                }`}
                onClick={() => setFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Left: list */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.small}>
            {selectedIds.length
              ? `${selectedIds.length} selected`
              : `${filtered.length} users`}
          </div>
          <div>
            <label className={styles.small}>
              <input
                type="checkbox"
                checked={
                  selectedIds.length && selectedIds.length === filtered.length
                }
                onChange={(e) => selectAllVisible(e.target.checked)}
              />
              &nbsp;Select all visible
            </label>
          </div>
        </div>
        <div className={styles.tableHead}>
          <div></div>
          <div>Name</div>
          <div>Role</div>
          <div>University</div>
          <div>Courses</div>
          <div>Attempts</div>
          <div>Avg Score</div>
        </div>
        <div className={styles.list}>
          {filtered.map((u) => (
            <Row
              key={u.id}
              u={u}
              selected={selectedIds.includes(u.id)}
              onToggle={() => toggleSelect(u.id)}
              onClick={() => setSelectedIds([u.id])}
            />
          ))}
        </div>
        <div className={styles.stickyBar}>
          <div className={styles.small} style={{ flex: 1 }}>
            {selectedIds.length ? `${selectedIds.length} selected` : ""}
          </div>
          <button
            className={styles.btn}
            disabled={!selectedIds.length}
            onClick={deactivateSelected}
          >
            Deactivate
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!selectedIds.length}
            onClick={assignToCourse}
          >
            Assign to Course
          </button>
        </div>
      </div>

      {/* Right: details */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div style={{ fontWeight: 600 }}>User details</div>
          <div className={styles.small}>Status</div>
        </div>
        <Details user={selected} />
      </div>
    </div>
  );
}
