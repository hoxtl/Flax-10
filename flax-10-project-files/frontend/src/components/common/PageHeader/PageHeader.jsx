import { motion } from "framer-motion";
import styles from "./PageHeader.module.css";

/**
 * Shared page-level header used across all main pages.
 * Props:
 *   title    – required string, shown as the h1
 *   subtitle – optional string, shown below the title
 *   action   – optional ReactNode, floated to the right (e.g. a button or toggle)
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </motion.div>
  );
}
