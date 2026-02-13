import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ToDoPanel.module.css";
import { Reorder, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "flax_todo_items_v1";
const AUTO_CLEAR_MS = 2 * 60 * 60 * 1000;

function normalizeItem(x) {
  return {
    id: x?.id ?? crypto.randomUUID(),
    title: typeof x?.title === "string" ? x.title : "",
    done: !!x?.done,
    completedAt: typeof x?.completedAt === "number" ? x.completedAt : null,
  };
}

function sortTasks(list) {
  const active = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done);
  return [...active, ...done];
}

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");

  // Load tasks once
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw).map(normalizeItem) : [];
      return sortTasks(parsed);
    } catch {
      return [];
    }
  });

  // Persist tasks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Auto clear completed tasks after 2 hours
  useEffect(() => {
    const now = Date.now();
    const nextExpiry = items
      .filter((t) => t.done && typeof t.completedAt === "number")
      .map((t) => t.completedAt + AUTO_CLEAR_MS)
      .filter((ts) => ts > now)
      .sort((a, b) => a - b)[0];

    const hasExpired = items.some(
      (t) => t.done && typeof t.completedAt === "number" && now - t.completedAt >= AUTO_CLEAR_MS
    );

    if (hasExpired) {
      setItems((prev) =>
        sortTasks(
          prev.filter(
            (t) => !(t.done && typeof t.completedAt === "number" && now - t.completedAt >= AUTO_CLEAR_MS)
          )
        )
      );
    }

    if (!nextExpiry) return;
    const timeoutMs = Math.max(0, nextExpiry - now + 50);

    const id = window.setTimeout(() => {
      const n = Date.now();
      setItems((prev) =>
        sortTasks(
          prev.filter(
            (t) => !(t.done && typeof t.completedAt === "number" && n - t.completedAt >= AUTO_CLEAR_MS)
          )
        )
      );
    }, timeoutMs);

    return () => window.clearTimeout(id);
  }, [items]);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // 3 dots menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const addItem = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    const newItem = {
      id: crypto.randomUUID(),
      title: t,
      done: false,
      completedAt: null,
    };

    setItems((prev) => sortTasks([...prev, newItem]));
    setText("");
  };

  const toggleDone = (id) => {
    setItems((prev) => {
      const now = Date.now();
      const updated = prev.map((x) => {
        if (x.id !== id) return x;

        const nextDone = !x.done;
        return {
          ...x,
          done: nextDone,
          completedAt: nextDone ? now : null,
        };
      });

      return sortTasks(updated);
    });
  };

  const clearCompleted = () => {
    setItems((prev) => sortTasks(prev.filter((x) => !x.done)));
    setMenuOpen(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.title);
  };

  const saveEdit = (id) => {
    const t = editText.trim();
    if (!t) {
      setEditingId(null);
      setEditText("");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, title: t } : x)));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const values = useMemo(() => items, [items]);

  const anyCompleted = items.some((x) => x.done);

  return (
    <div className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <div className={styles.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Task menu"
            aria-expanded={menuOpen}
          >
            <span className={styles.dots} aria-hidden="true">•••</span>
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={clearCompleted}
                disabled={!anyCompleted}
                title={!anyCompleted ? "No completed tasks" : "Remove completed tasks"}
              >

                <span className={styles.menuIcon} aria-hidden="true">🪄</span>
                <span className={styles.menuLabel}>Clear completed tasks</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.list}>
        <Reorder.Group
          axis="y"
          values={values}
          onReorder={(newOrder) => setItems(sortTasks(newOrder))}
          className={styles.reorderGroup}
        >
          <AnimatePresence>
            {items.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className={styles.row}
                whileDrag={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleDone(item.id)}
                />

                {editingId === item.id ? (
                  <input
                    className={styles.editInput}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    onBlur={() => saveEdit(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(item.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                ) : (
                  <span
                    className={item.done ? styles.done : ""}
                    onDoubleClick={() => startEdit(item)}
                    title="Double-click to edit"
                  >
                    {item.title}
                  </span>
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      <form onSubmit={addItem} className={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New Task"
        />
      </form>
    </div>
  );
}
