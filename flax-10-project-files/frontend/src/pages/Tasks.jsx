import { useMemo, useState } from "react";
import styles from "./Tasks.module.css";

function getGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Night owl";
}

export default function Tasks({ user }) {
  const greeting = useMemo(() => getGreeting(), []);
  const name = user?.name?.split(" ")[0] || "Guest";

  const [text, setText] = useState("");
  const [items, setItems] = useState([
    { id: 1, title: "Read lecture slides", done: false },
    { id: 2, title: "Start SEG task", done: false },
  ]);

  const addItem = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    setItems((prev) => [{ id: Date.now(), title: t, done: false }, ...prev]);
    setText("");
  };

  const toggleDone = (id) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
    );
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>
        {greeting}, {name}.
      </h2>

      <form className={styles.addRow} onSubmit={addItem}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New task..."
        />
        <button className={styles.addBtn} type="submit">
          Add
        </button>
      </form>

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
    </div>
  );
}
