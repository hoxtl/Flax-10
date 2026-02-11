import { useState } from "react";
import styles from "./ToDoPanel.module.css";
import { Reorder, AnimatePresence } from "framer-motion";

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

  // Inline edit state
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

      // Move checked items to bottom of list
      const active = updated.filter((x) => !x.done);
      const done = updated.filter((x) => x.done);
      return [...active, ...done];
    });
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

    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, title: t } : x))
    );
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
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
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
