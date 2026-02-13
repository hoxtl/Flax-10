import { useEffect, useMemo, useState } from "react";
import styles from "./ToDoPanel.module.css";
import { Reorder, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "flax_todo_items_v2";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDue(dueStr) {
  if (!dueStr) return null;
  const [y, m, d] = String(dueStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function isOverdue(dueStr) {
  const due = parseDue(dueStr);
  if (!due) return false;
  return due < startOfToday();
}

function normalizeLoaded(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      id: typeof x.id === "number" ? x.id : Date.now() + Math.random(),
      title: typeof x.title === "string" ? x.title : "",
      done: !!x.done,
      priority: x.priority === "P1" || x.priority === "P2" || x.priority === "P3" ? x.priority : "P2",
      due: typeof x.due === "string" && x.due.trim() ? x.due : "",
    }))
    .filter((x) => x.title.trim().length > 0);
}

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");

  const [newPriority, setNewPriority] = useState("P2");
  const [newDue, setNewDue] = useState(""); 

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeLoaded(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
    }
  }, [items]);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("P2");
  const [editDue, setEditDue] = useState("");

  const addItem = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: t,
        done: false,
        priority: newPriority,
        due: newDue,
      },
    ]);

    setText("");
    setNewPriority("P2");
    setNewDue("");
  };

  const toggleDone = (id) => {
    setItems((prev) => {
      const updated = prev.map((x) =>
        x.id === id ? { ...x, done: !x.done } : x
      );

      // Move checked items to bottom
      const active = updated.filter((x) => !x.done);
      const done = updated.filter((x) => x.done);
      return [...active, ...done];
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.title);
    setEditPriority(item.priority || "P2");
    setEditDue(item.due || "");
  };

  const saveEdit = (id) => {
    const t = editText.trim();
    if (!t) {
      setEditingId(null);
      setEditText("");
      setEditPriority("P2");
      setEditDue("");
      return;
    }

    setItems((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, title: t, priority: editPriority, due: editDue }
          : x
      )
    );

    setEditingId(null);
    setEditText("");
    setEditPriority("P2");
    setEditDue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditPriority("P2");
    setEditDue("");
  };

  const formatDueLabel = (dueStr) => {
    const dt = parseDue(dueStr);
    if (!dt) return "";
    // Simple readable: 13 Feb
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  };

  return (
    <div className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      <div className={styles.list}>
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className={styles.reorderGroup}
        >
          <AnimatePresence>
            {items.map((item) => {
              const overdue = !item.done && isOverdue(item.due);
              const dueLabel = formatDueLabel(item.due);

              return (
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

                  <div className={styles.taskBody}>
                    {editingId === item.id ? (
                      <>
                        <input
                          className={styles.editInput}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onBlur={() => saveEdit(item.id)}
                        />

                        <div className={styles.metaEditRow}>
                          <select
                            className={styles.metaSelect}
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value)}
                          >
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                          </select>

                          <input
                            className={styles.metaDate}
                            type="date"
                            value={editDue}
                            onChange={(e) => setEditDue(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <span
                          className={item.done ? styles.done : ""}
                          onDoubleClick={() => startEdit(item)}
                          title="Double-click to edit"
                        >
                          {item.title}
                        </span>

                        <div className={styles.metaRow}>
                          <span className={styles.badge}>{item.priority || "P2"}</span>

                          {dueLabel ? (
                            <span
                              className={`${styles.badge} ${overdue ? styles.overdue : ""}`}
                              title={item.due}
                            >
                              {dueLabel}
                            </span>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      <form onSubmit={addItem} className={styles.inputRow}>
        <div className={styles.inputTopRow}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="New Task"
          />
        </div>

        <div className={styles.metaAddRow}>
          <select
            className={styles.metaSelect}
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            aria-label="Priority"
          >
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>

          <input
            className={styles.metaDate}
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            aria-label="Due date"
          />
        </div>
      </form>
    </div>
  );
}