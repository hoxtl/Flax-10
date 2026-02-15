§import styles from "./Welcome.module.css";
import { pickQuoteByKey } from "../lib/quotes";
import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayName } from "../utils/userDisplay";
import { useNavigate } from "react-router-dom";

const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

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
      startVelocity: 16,
      gravity: 0.9,
      ticks: 180,
      origin: { x: Math.random(), y: 0.08 },
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function buildPersonalLine(quote, name) {
  const cleaned = quote.trim().replace(/[".]+$/g, "");
  if (!name) return `${cleaned}.`;
  return `${cleaned}, ${name}.`;
}

export default function Welcome({ user }) {
  const navigate = useNavigate();
  const name = (getDisplayName(user) || "").trim();

  const [now, setNow] = useState(() => new Date());

  // lock scroll like before
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

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
    [quoteKey, now.getHours()]
  );

  const quoteLine = useMemo(() => buildPersonalLine(quote, name), [quote, name]);

  // new user / first visit message
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem(WELCOME_SEEN_KEY) !== "true";
  });

  useEffect(() => {
    if (!showIntro) return;
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    const id = setTimeout(() => setShowIntro(false), 1800);
    return () => clearTimeout(id);
  }, [showIntro]);

  const introLine = useMemo(() => {
    const n = name || "there";
    return `Welcome to StudyFlax, ${n}. This is where the magic begins ✨`;
  }, [name]);

  // optional daily goal (you can keep/remove)
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

  return (
    <div className={styles.welcomePage}>
      <div className={styles.center}>
        <div className={styles.time}>{formatTime(now)}</div>

        <AnimatePresence mode="wait">
          <motion.div
            key={showIntro ? "intro" : quoteLine}
            className={styles.personalLine}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {showIntro ? introLine : quoteLine}
          </motion.div>
        </AnimatePresence>

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
                placeholder=""
                autoFocus
              />

              <div className={styles.goalUnderline} />

              <button
                type="button"
                onClick={() => navigate("/calendar")}
                style={{
                  marginTop: 18,
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: "rgba(0,0,0,0.22)",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Explore StudyFlax →
              </button>
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

              <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={resetGoal}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.7,
                    color: "inherit",
                  }}
                >
                  Change goal
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/calendar")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.9,
                    color: "inherit",
                    fontWeight: 600,
                  }}
                >
                  Explore StudyFlax →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
