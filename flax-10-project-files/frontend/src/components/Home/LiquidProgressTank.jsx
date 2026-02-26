import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./LiquidProgressTank.module.css";

/**
 * Liquid Progress Tank: circular glass container, double-wave liquid (framer-motion),
 * height = (completedTasks / totalTasks) * 100. Splash on task check, bubbling when Pomodoro running.
 * No text overlay — the water level speaks for itself (minimalist visual pulse).
 */
export function LiquidProgressTank({
  completed = 0,
  total = 0,
  goalsCrushed: goalsCrushedProp,
  isPomodoroRunning = false,
  isPaused = false,
  isGapActive = false,
  isSwirl = false,
  size,
  /** When Pomodoro is running, show at least this much sage fill so the tank colour is visible. */
  minFillWhenRunning = 40,
}) {
  const prevCompletedRef = useRef(completed);
  const [splash, setSplash] = useState(false);

  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const displayPct = Math.max(0, pct);
  const effectivePct = isPomodoroRunning ? Math.max(displayPct, minFillWhenRunning) : displayPct;

  useEffect(() => {
    if (completed > prevCompletedRef.current) {
      setSplash(true);
      const t = setTimeout(() => setSplash(false), 1200);
      prevCompletedRef.current = completed;
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  return (
    <div
      className={`${styles.wrap} ${size === 130 ? styles.size130 : size === 140 ? styles.size140 : ""} ${splash ? styles.splash : ""} ${isPomodoroRunning ? styles.bubbling : ""} ${isPaused ? styles.breathe : ""} ${isSwirl ? styles.swirl : ""}`}
      title={total ? `${completed} of ${total} tasks — ${displayPct}%` : "No tasks today"}
      role="img"
      aria-label={total ? `Progress: ${displayPct}% complete` : "No tasks today"}
    >
      <div className={styles.tank}>
        <div
          className={styles.liquidWrap}
          style={{ height: `${effectivePct}%` }}
          aria-hidden
        >
          <motion.div
            className={styles.liquid}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className={styles.wave}
            initial={false}
            animate={{
              x: [0, -12, 0],
              y: [0, 2, 0],
              scaleX: [1, 1.05, 1],
              transition: {
                repeat: Infinity,
                duration: isGapActive ? 1.4 : 2.2,
                ease: "easeInOut",
              },
            }}
          />
          <motion.div
            className={styles.wave2}
            initial={false}
            animate={{
              x: [0, 10, 0],
              y: [0, -1, 0],
              scaleX: [1, 0.98, 1],
              transition: {
                repeat: Infinity,
                duration: isGapActive ? 1.2 : 1.9,
                ease: "easeInOut",
                delay: 0.35,
              },
            }}
          />
        </div>
        {splash && (
          <>
            <motion.span
              className={styles.bubble}
              style={{ left: "30%", top: "50%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.9, scale: 0.8, y: -12 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubble}
              style={{ left: "55%", top: "55%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.9, scale: 0.8, y: -14 }}
              exit={{ opacity: 0, y: -35 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubble}
              style={{ left: "45%", top: "48%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.9, scale: 0.7, y: -10 }}
              exit={{ opacity: 0, y: -38 }}
              transition={{ duration: 0.55, delay: 0.02 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubble}
              style={{ left: "38%", top: "62%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.85, scale: 0.65, y: -11 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.52, delay: 0.08 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubble}
              style={{ left: "52%", top: "52%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.9, scale: 0.7, y: -9 }}
              exit={{ opacity: 0, y: -36 }}
              transition={{ duration: 0.58, delay: 0.04 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubble}
              style={{ left: "42%", top: "58%" }}
              initial={{ opacity: 0, scale: 0.3, y: 0 }}
              animate={{ opacity: 0.8, scale: 0.6, y: -13 }}
              exit={{ opacity: 0, y: -34 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              aria-hidden
            />
          </>
        )}
        {isPomodoroRunning && !splash && (
          <>
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "35%", top: "60%" }}
              animate={{ opacity: [0.4, 0.8, 0.4], y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "62%", top: "65%" }}
              animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 0.3 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "50%", top: "58%" }}
              animate={{ opacity: [0.35, 0.75, 0.35], y: [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "28%", top: "68%" }}
              animate={{ opacity: [0.25, 0.65, 0.25], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: 0.15 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "72%", top: "62%" }}
              animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: 1.9, delay: 0.45 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "45%", top: "70%" }}
              animate={{ opacity: [0.2, 0.6, 0.2], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.1, delay: 0.2 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "58%", top: "72%" }}
              animate={{ opacity: [0.28, 0.68, 0.28], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.3, delay: 0.5 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "40%", top: "64%" }}
              animate={{ opacity: [0.33, 0.73, 0.33], y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.7, delay: 0.75 }}
              aria-hidden
            />
            <motion.span
              className={styles.bubbleSmall}
              style={{ left: "68%", top: "58%" }}
              animate={{ opacity: [0.26, 0.66, 0.26], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.1 }}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  );
}
