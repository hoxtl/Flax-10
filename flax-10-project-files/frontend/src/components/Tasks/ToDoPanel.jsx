import { useState } from "react";
import styles from "./ToDoPanel.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

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

        updated.sort((a, b) => {
        if (a.done === b.done) return a.id - b.id;
        return a.done - b.done; 
        });

        return updated;
    });
};

  return (
    <div className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      
      <div className={styles.list}>
        <AnimatePresence>
            {items.map((item) => (
            <motion.label
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
                <span className={item.done ? styles.done : ""}>{item.title}</span>
            </motion.label>
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
