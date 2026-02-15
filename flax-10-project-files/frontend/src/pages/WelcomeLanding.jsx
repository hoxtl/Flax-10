import styles from "./WelcomeLanding.module.css";
import { pickQuoteByKey } from "../lib/quotes";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayName } from "../utils/userDisplay";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatTime(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function dropConfetti() {
  const duration = 900;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 10,
      spread: 65,
      startVelocity: 18,
      gravity: 0.9,
      ticks: 200,
      origin: { x: Math.random(), y: 0.05 },
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function firstNameFromUser(user) {
  const display = (getDisplayName(user) || "").trim();
  if (!display) return "";
  return display.split(" ")[0];
}

function cleanQuote(q) {
  return q.trim().replace(/[".]+$/g, "");
}

export default function WelcomeLanding({ user, onExplore }) {
  const firstName = firstNameFromUser(user);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const quoteKey = useMemo(
    () => `${now.toDateString()}-${now.getHours()}-${now.getMinutes()}`,
    [now]
  );

  const quote = useMemo(
    () => pickQuoteByKey(quoteKey, now.getHours()),
    [quoteKey, now]
  );

  const greetingLine = useMemo(() => {
    if (!firstName) return "Welcome back.";
    return `Welcome back, ${firstName}.`;
  }, [firstName]);

  const quoteLine = useMemo(() => `${cleanQuote(quote)}.`, [quote]);

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

  return (
    <div className={styles.page}>
      <div className={styles.center}>
        <div className={styles.time}>{formatTime(now)}</div>

        <AnimatePresence mode="wait">
          <motion.div
            key={greetingLine}
            className={styles.bigLine}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {greetingLine}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={quoteLine}
            className={styles.smallLine}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {quoteLine}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!todayGoal ? (
            <motion.form
              key ="goalForm"
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onExplore}>
            Explore StudyFlax
          </button>

          <button className={styles.secondaryBtn} disabled title="Coming soon">
            Watch tutorial (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
}