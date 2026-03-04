import styles from "./AllTasksCompleteCard.module.css";

export default function AllTasksCompleteCard({ message, sub, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.emoji}>🎉</div>
      {message && <p className={styles.message}>{message}</p>}
      {sub && <p className={styles.sub}>{sub}</p>}
      {children && <div className={styles.cta}>{children}</div>}
    </div>
  );
}
