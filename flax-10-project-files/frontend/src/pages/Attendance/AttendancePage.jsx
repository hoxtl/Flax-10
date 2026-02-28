import styles from "./AttendancePage.module.css";

export default function AttendancePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Attendance</h1>
      <p className={styles.subtitle}>Track your attendance for lectures, small groups, and labs.</p>
    </div>
  );
}
