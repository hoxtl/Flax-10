import { useState } from "react";
import styles from "./ToDoPanel.module.css";
import { Reorder, AnimatePresence } from "framer-motion";

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  // inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const addItem = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    setItems((prev) => [...prev, { id: Date.now(), title: t, done: false }]);
    setText("");
  };

  const toggleDone = (id) => {
    setItems((prev) => {
      const updated = prev.map((x) =>
        x.id === id ? { ...x, done: !x.done } : x
      );

      // not-done first, done last, stable by id
      updated.sort((a, b) => {
        if (a.done === b.done) return a.id - b.id;
        return a.done - b.done; // false(0) before true(1)
      });

      return updated;
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.title);
  };

  const saveEdit = (id) => {
    const t = editText.trim();

    // if empty, cancel (don’t delete)
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

  return (
    <div className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      <div className={styles.list}>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={styles.row}
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
            </motion.div>
          ))}
        </AnimatePresence>
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
