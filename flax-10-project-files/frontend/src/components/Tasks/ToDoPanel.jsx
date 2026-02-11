import { useState } from "react";
import styles from "./ToDoPanel.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function ToDoPanel({ open = true }) {
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);

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
    updated.sort((a, b) => {
        if (a.done === b.done) return a.id - b.id;
        return a.done - b.done; 
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
