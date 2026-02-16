import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import ToDoPanel from "./ToDoPanel";
import styles from "./FloatingTasks.module.css";

const OPEN_KEY = "flax_todo_open_v1";

function loadOpenState() {
  try {
    const raw = localStorage.getItem(OPEN_KEY);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
}

function saveOpenState(open) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  } catch {}
}

function FloatingTasksPortal({ open, setOpen, fabRef }) {
  return (
    <>
      <button
        ref={fabRef}
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close to-do" : "Open to-do"}
        title={open ? "Close to-do" : "Open to-do"}
      >
        To-do
      </button>
      <ToDoPanel open={open} onClose={() => setOpen(false)} fabRef={fabRef} />
    </>
  );
}

export default function FloatingTasks() {
  const fabRef = useRef(null);
  const [open, setOpen] = useState(loadOpenState);
  useEffect(() => saveOpenState(open), [open]);
  return createPortal(
    <FloatingTasksPortal open={open} setOpen={setOpen} fabRef={fabRef} />,
    document.body
  );
}