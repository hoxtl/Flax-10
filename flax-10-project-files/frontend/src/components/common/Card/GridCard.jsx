/*
 * Simple card wrapper for grid layouts.
 */

import styles from "./GridCard.module.css";

/** Card container used in grid layouts with optional click handler. */
export default function GridCard({ children, className = "", style, onClick }) {
  return (
    <div className={`${styles.card} ${className}`.trim()} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
