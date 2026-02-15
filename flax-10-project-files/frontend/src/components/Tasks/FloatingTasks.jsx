import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ToDoPanel from "./ToDoPanel";
import styles from "./FloatingTasks.module.css";

const OPEN_KEY = "flax_todo_open_v1";

export default function FloatingTasks() {
  const [open, setOpen] = useState(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open));
    } catch {}
  }, [open]);

  return createPortal(
    <>
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close to-do" : "Open to-do"}
        title={open ? "Close to-do" : "Open to-do"}
      >
        To-do
      </button>

      <ToDoPanel open={open} onClose={() => setOpen(false)} />
    </>,
    document.body
  );
}
