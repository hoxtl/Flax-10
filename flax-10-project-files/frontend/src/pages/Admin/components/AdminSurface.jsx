/*
 * Shared admin surface components.
 */

import { motion } from "framer-motion";
import styles from "../styles";
import { fadeUp } from "../utils/adminMotion";

export function SectionCard({ children }) {
  return <div className={styles.card}>{children}</div>;
}

export function CardHeader({ children, title, count }) {
  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>{title}{count !== undefined ? <span className={styles.count}> ({count})</span> : null}</h2>
      {children}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className={styles.spinnerWrap}>
      <motion.div className={styles.spinner} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }} />
    </div>
  );
}

export function EmptyMessage({ children }) {
  return <motion.p className={styles.empty} {...fadeUp}>{children}</motion.p>;
}

export function ErrorMessage({ message }) {
  return message ? <p className={styles.errorMsg}>{message}</p> : null;
}
