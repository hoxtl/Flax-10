import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ToDoPanel from "./ToDoPanel";
import styles from "./FloatingTasks.module.css";

const OPEN_KEY = "flax_tasks_open_v1";

export default function FloatingTasks() {
  const [open, setOpen] = useState(() => {
    const raw = localStorage.getItem(OPEN_KEY);
    return raw ? JSON.parse(raw) : false;
  });

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  }, [open]);

  return createPortal(
    <>
      <button
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open tasks"
        title="Tasks"
      >
        To-do
      </button>

      <ToDoPanel open={open} />
    </>,
    document.body
  );
}