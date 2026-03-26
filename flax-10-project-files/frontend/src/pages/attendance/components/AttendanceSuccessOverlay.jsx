/*
 * Full-screen success flash — tick or cross animation — shown after marking attendance.
 */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./AttendanceSuccessOverlay.module.css";

const BACKDROP_TRANSITION = { duration: 0.18 };
const CARD_TRANSITION = { duration: 0.28, ease: [0.23, 1, 0.32, 1] };
const ICON_TRANSITION = { type: "spring", stiffness: 340, damping: 18, delay: 0.06 };
const MESSAGE_TRANSITION = { delay: 0.2, duration: 0.28 };

function SuccessIcon({ attended, color }) {
  const Icon = attended ? CheckCircle : XCircle;
  return (
    <motion.div style={{ color }} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={ICON_TRANSITION}>
      <Icon size={56} strokeWidth={1.6} />
    </motion.div>
  );
}

function SuccessMessage({ message }) {
  return <motion.p className={styles.message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={MESSAGE_TRANSITION}>{message}</motion.p>;
}

function SuccessCard({ attended, color, message }) {
  return (
    <motion.div className={styles.card} initial={{ scale: 0.82, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: -10 }} transition={CARD_TRANSITION}>
      <SuccessIcon attended={attended} color={color} />
      <SuccessMessage message={message} />
    </motion.div>
  );
}

export default function AttendanceSuccessOverlay({ attended }) {
  const green = ["#", "22c55e"].join("");
  const red = ["#", "ef4444"].join("");
  const color = attended ? green : red;
  const message = attended ? "Attendance recorded!" : "Missed session noted.";
  return createPortal(
    <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={BACKDROP_TRANSITION}>
      <SuccessCard attended={attended} color={color} message={message} />
    </motion.div>,
    document.body
  );
}
