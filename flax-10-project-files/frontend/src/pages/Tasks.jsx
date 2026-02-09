import { useEffect, useMemo, useState } from "react";
import styles from "./Tasks.module.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function getGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Night owl";
}

const QUOTES = [
  "Never stop exploring.",
  "Make it count.",
  "Stay curious.",
  "One task at a time.",
  "Small steps daily.",
  "Keep going.",
  "Start, then improve.",
  "Progress over perfection.",
];

function getDailyQuote(d = new Date()) {
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return QUOTES[hash % QUOTES.length];
}

export default function Tasks({ user }) {
  const name = user?.name?.split(" ")[0] || "Guest";
  const greeting = useMemo(() => getGreeting(), []);
  const quote = useMemo(() => getDailyQuote(), []);

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Tasks drawer
  const [open, setOpen] = useState(false);

  // Checklist state
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
    <div className={styles.momentumPage}>
      {/* Center content */}
      <div className={styles.center}>
        <div className={styles.time}>{formatTime(now)}</div>
        <div className={styles.quote}>{quote}</div>
        <div className={styles.greeting}>
          {greeting}, {name}.
        </div>
      </div>

      {/* Bottom-right Tasks button */}
      <button className={styles.tasksBtn} onClick={() => setOpen(true)}>
        Tasks
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitle}>Today</div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

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
        </>
      )}
    </div>
  );
}
