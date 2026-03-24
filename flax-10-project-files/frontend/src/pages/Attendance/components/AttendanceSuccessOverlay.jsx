/*
 * Full-screen success flash — tick or cross animation — shown after marking attendance.
 */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./AttendanceSuccessOverlay.module.css";

export default function AttendanceSuccessOverlay({ attended }) {
  const color = attended ? "#22c55e" : "#ef4444";
  const Icon = attended ? CheckCircle : XCircle;
  const message = attended ? "Attendance recorded!" : "Missed session noted.";

  return createPortal(
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className={styles.card}
        initial={{ scale: 0.82, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        <motion.div
          style={{ color }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 18, delay: 0.06 }}
        >
          <Icon size={56} strokeWidth={1.6} />
        </motion.div>
        <motion.p
          className={styles.message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.28 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>,
    document.body
  );
}
