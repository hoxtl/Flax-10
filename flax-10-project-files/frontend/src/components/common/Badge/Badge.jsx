/*
 * Small status badge with tone and optional pill shape.
 */

import styles from "./Badge.module.css";

/** Inline badge for status labels, counts, or tags. */
export default function Badge({ children, className = "", tone = "default", pill = true, ...props }) {
  const classes = `${styles.badge} ${styles[tone]} ${pill ? styles.pill : ""} ${className}`.trim();
  return <span className={classes} {...props}>{children}</span>;
}
