import styles from "./Badge.module.css";

export default function Badge({ children, className = "", tone = "default", pill = true, ...props }) {
  const classes = `${styles.badge} ${styles[tone]} ${pill ? styles.pill : ""} ${className}`.trim();
  return <span className={classes} {...props}>{children}</span>;
}
