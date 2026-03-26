/*
 * Page-level header with title, optional subtitle, back button, and action slot.
 */

import { motion } from "framer-motion";
import BackButton from "../back_button/BackButton.jsx";
import styles from "./PageHeader.module.css";

/** Animated page header used across all main pages. */

export default function PageHeader({ title, subtitle, details, action, onBack, compact = false }) {
  return (
    <motion.div className={`${styles.header} ${compact ? styles.headerCompact : ""}`}
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className={styles.leftGroup}>
        {onBack && <BackButton onClick={onBack} className={styles.backButton} />}
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {details ? <div className={styles.details}>{details}</div> : null}
        </div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </motion.div>
  );
}
