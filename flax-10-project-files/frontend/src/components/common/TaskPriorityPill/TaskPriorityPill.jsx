/*
 * Shared task priority pill styled to match the main Tasks surfaces.
 */

import styles from "./TaskPriorityPill.module.css";

const PRIORITY_META = {
  urgent: { label: "Urgent", marks: "!!!" },
  high: { label: "High", marks: "!!" },
  medium: { label: "Medium", marks: "!" },
  low: { label: "Low", marks: "" },
};

export default function TaskPriorityPill({ priority = "medium", className = "" }) {
  const key = String(priority || "medium").toLowerCase();
  const meta = PRIORITY_META[key] || PRIORITY_META.medium;
  return (
    <span className={[styles.pill, styles[key] || styles.medium, className].filter(Boolean).join(" ")}>
      {meta.marks ? <span className={styles.marks} aria-hidden="true">{meta.marks}</span> : null}
      <span className={styles.label}>{meta.label}</span>
    </span>
  );
}
