"use client";

import { useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabaseClient";
import styles from "./university-select.module.css";

export default function UniversitySelect({ value, onChange, required }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("universities")
          .select("id, name")
          .order("name");
        if (error) throw error;
        if (!cancelled) setList(data || []);
      } catch (e) {
        console.warn("universities load failed", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((u) => u.name.toLowerCase().includes(q));
  }, [list, query]);

  const current = list.find((u) => String(u.id) === String(value));

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>
        University
        <div className={styles.combobox} data-open={open ? "" : undefined}>
          <button
            type="button"
            className={styles.trigger}
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {current ? current.name : "Select your university"}
          </button>
          {open && (
            <div className={styles.popover} role="listbox">
              <input
                className={styles.search}
                placeholder="Search universities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <div className={styles.list}>
                {loading ? (
                  <div className={styles.empty}>Loading…</div>
                ) : filtered.length ? (
                  filtered.map((u) => (
                    <button
                      key={u.id}
                      className={styles.item}
                      onClick={() => {
                        onChange?.(String(u.id));
                        setOpen(false);
                      }}
                    >
                      {u.name}
                    </button>
                  ))
                ) : (
                  <div className={styles.empty}>No results</div>
                )}
              </div>
            </div>
          )}
        </div>
        {required && !value ? (
          <div className={styles.hint}>University is required</div>
        ) : null}
      </label>
    </div>
  );
}
