import { useState } from "react";
import styles from "./ToDoPanel.module.css";

export default function ToDoPanel() {
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
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.list}>
        {items.map((item) => (
          <label key={item.id} className={styles.row}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleDone(item.id)}
            />
            <span className={item.done ? styles.done : ""}>
              {item.title}
            </span>
          </label>
        ))}
      </div>

      <form onSubmit={addItem} className={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New task"
        />
      </form>
    </div>
  );
}
