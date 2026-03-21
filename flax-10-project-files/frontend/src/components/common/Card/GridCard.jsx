/*
 * Simple card wrapper for grid layouts.
 */

import styles from "./GridCard.module.css";

/** Card container used in grid layouts with optional click handler. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export default function GridCard({ children, className = "", style, onClick }) {
  return (
    <div className={`${styles.card} ${className}`.trim()} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
