import styles from "./SectionHeader.module.css";

export default function SectionHeader({ eyebrow, title, subtitle, action, className = "" }) {
  const classes = className ? `${styles.header} ${className}` : styles.header;

  return (
    <div className={classes}>
      <div className={styles.copy}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
