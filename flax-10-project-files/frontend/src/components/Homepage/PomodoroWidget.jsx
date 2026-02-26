import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useTimerContext } from "../../context/TimerContext";
import { useNavigate } from "react-router-dom";
import { playZenChime } from "../../lib/sounds";
import styles from "./PomodoroWidget.module.css";

function formatTimeLeft(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Pomodoro Widget:
 * Focus: Sage glow, bold timer. Break: Gold/Flax glow, breathing pulse, swaying sprout.
 * Ghost buttons: +5m, Pause, Skip. On 0:00: Zen bowl chime + Seed Pop animation.
 */
export function PomodoroWidget({ onOpenTimer, nextItem }) {
  const navigate = useNavigate();
  const timer = useTimerContext();
  const {
    isActive,
    timeLeft,
    task,
    progress,
    setIsActive,
    mode,
    isOvertime,
    isBreakOvertime,
    setMode,
    setTimeLeft,
    completedSessions,
    workTime,
    breakTime,
  } = timer;

  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  const [seedPop, setSeedPop] = useState(false);
  const prevTimeLeftRef = useRef(timeLeft);
  const hasSession = isActive || (!!task && timeLeft > 0);

  useEffect(() => {
    if (!hasSession) return;
    const id = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }));
    }, 1000);
    return () => clearInterval(id);
  }, [hasSession]);

  /* On 0:00 play zen chime and trigger Seed Pop */
  useEffect(() => {
    if (prevTimeLeftRef.current > 0 && timeLeft === 0 && isActive) {
      playZenChime();
      setSeedPop(true);
      const t = setTimeout(() => setSeedPop(false), 700);
      return () => clearTimeout(t);
    }
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, isActive]);

  const handleAdd5Min = useCallback(() => {
    setMode("break");
    setTimeLeft(5 * 60);
    setIsActive(true);
  }, [setMode, setTimeLeft, setIsActive]);

  const handleSkip = useCallback(() => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? workTime * 60 : breakTime * 60);
  }, [setIsActive, setTimeLeft, mode, workTime, breakTime]);

  const handleOpenTimer = useCallback(() => {
    onOpenTimer?.();
    navigate("/timer");
  }, [onOpenTimer, navigate]);

  if (!hasSession) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <p className={styles.idleLabel}>Focus when you're ready</p>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleOpenTimer}
          >
            Start Pomodoro
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={handleOpenTimer}
          >
            Open Timer
          </button>
        </div>
      </div>
    );
  }

  const isBreak = mode === "break";
  const isPaused = !isActive;
  const pct = Math.min(100, Math.max(0, typeof progress === "number" ? progress : 0));

  return (
    <motion.div
      className={`${styles.wrap} ${isBreak ? styles.breakMode : styles.focusMode} ${isPaused && isBreak ? styles.breathing : ""}`}
      initial={false}
      animate={{
        boxShadow: isBreak
          ? "0 0 32px rgba(196, 163, 90, 0.35), 0 4px 24px rgba(0,0,0,0.06)"
          : "0 0 28px rgba(82, 121, 111, 0.4), 0 4px 24px rgba(0,0,0,0.06)",
      }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.card}>
        <div className={styles.topRow}>
          <span className={styles.clock} aria-label="Current time">
            {currentTime}
          </span>
          {isBreak && (
            <span className={styles.sproutSway} aria-hidden>
              🌱
            </span>
          )}
        </div>
        <motion.div
          className={styles.timerDisplay}
          animate={seedPop ? { scale: [1, 1.2, 1.05] } : {}}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {formatTimeLeft(timeLeft)}
        </motion.div>
        <p className={styles.taskLabel}>
          {isBreak ? (isPaused ? "Break — take a breather" : "Break time") : (task || "Focus session")}
        </p>
        {!isBreak && (
          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressFill}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}
        <div className={styles.actions}>
          {isBreak && (
            <button type="button" className={styles.ghostBtn} onClick={handleAdd5Min}>
              +5m
            </button>
          )}
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? "Pause" : "Resume"}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={handleSkip}>
            Skip
          </button>
          <button type="button" className={styles.ghostBtn} onClick={handleOpenTimer}>
            Open timer
          </button>
        </div>
        {nextItem?.title && (
          <p className={styles.nextUp}>
            Up next: {nextItem.title}
            {nextItem.start_time ? ` at ${new Date(nextItem.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </p>
        )}
      </div>
    </motion.div>
  );
}
