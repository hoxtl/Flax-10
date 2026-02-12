import styles from "./Tasks.module.css";
import { pickQuoteByKey } from "../lib/quotes";
import confetti from "canvas-confetti";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dropConfetti() {
  const duration = 1200;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 12,
      spread: 70,
      startVelocity: 18,
      gravity: 0.9,
      ticks: 200,
      origin: { x: Math.random(), y: 0.05 },
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function buildPersonalLine(quote, name) {
  if (!quote) return name ? `Hi, ${name}.` : "Hi.";
  const cleaned = quote.trim().replace(/[".]+$/g, "");
  return name ? `${cleaned}, ${name}.` : `${cleaned}.`;
}

export default function Tasks({ user }) {
  const name = user?.name?.split(" ")[0] || "Guest";

  // To-do-list Panel Open State
  const [tasksOpen, setTasksOpen] = useState(() => {
    const saved = localStorage.getItem("flax_tasks_open");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("flax_tasks_open", JSON.stringify(tasksOpen));
  }, [tasksOpen]);

  // Live Clock
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

 // Quotes - changes every minute
  const quoteKey = useMemo(
    () => `${now.toDateString()}-${now.getHours()}-${now.getMinutes()}`,
    [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()]
  );

  const quote = useMemo(
    () => pickQuoteByKey(quoteKey, now.getHours()),
    [quoteKey, now.getHours()]
  );

  const personalLine = useMemo(
    () => buildPersonalLine(quote, name),
    [quote, name]
  );

  // Main Goal
  const [goalText, setGoalText] = useState("");
  const [todayGoal, setTodayGoal] = useState("");
  const [todayDone, setTodayDone] = useState(false);

  const submitGoal = (e) => {
    e.preventDefault();
    const t = goalText.trim();
    if (!t) return;

    setTodayGoal(t);
    setTodayDone(false);
    setGoalText("");
  };

  const toggleTodayDone = () => {
    setTodayDone((prev) => {
      const next = !prev;
      if (next) dropConfetti();
      return next;
    });
  };

  const resetGoal = () => {
    setTodayGoal("");
    setTodayDone(false);
    setGoalText("");
  };

  // Rendering
  return (
    <div className={styles.momentumPage}>
      <div className={styles.center}>
        <div className={styles.time}>{formatTime(now)}</div>

        <div className={styles.personalLine}>{personalLine}</div>

        <AnimatePresence mode="wait">
          {!todayGoal ? (
            <motion.form
              key="goalForm"
              className={styles.goalBlock}
              onSubmit={submitGoal}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className={styles.goalPrompt}>
                What is your main goal for today?
              </div>

              <input
                className={styles.goalInput}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                autoFocus
              />

              <div className={styles.goalUnderline} />
            </motion.form>
          ) : (
            <motion.div
              key="todayBlock"
              className={styles.todayBlock}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className={styles.todayLabel}>TODAY</div>

              <label className={styles.todayRow}>
                <input
                  type="checkbox"
                  checked={todayDone}
                  onChange={toggleTodayDone}
                />
                <span className={todayDone ? styles.todayDone : ""}>
                  {todayGoal}
                </span>
              </label>

              <button
                type="button"
                onClick={resetGoal}
                style={{
                  marginTop: 14,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.7,
                }}
              >
                Change goal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.bottomQuote}>"{quote}"</div>

      <button
        className={styles.tasksBtn}
        onClick={() => setTasksOpen((v) => !v)}
      >
        Tasks
      </button>

      <ToDoPanel open={tasksOpen} />
    </div>
  );
}