import styles from "./WelcomeLanding.module.css";
import { pickWelcomeQuoteByKey } from "../lib/quotes";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getGreeting } from "../utils/dateUtils";
import WelcomeBackgroundPaths from "../components/Welcome/WelcomeBackgroundPaths";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function getTimeTone(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "day";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function firstNameFromUser(user) {
  return (user?.first_name || "").trim();
}

function cleanQuote(q) {
  return (q || "").trim().replace(/[".]+$/g, "");
}

export default function WelcomeLanding({ user, onExplore, onBackToAuth }) {
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

  const quote = useMemo(() => pickWelcomeQuoteByKey(quoteKey), [quoteKey]);

  const greetingLine = useMemo(() => {
    const g = getGreeting();
    if (!firstName) return `${g}.`;
    return `${g}, ${firstName}.`;
  }, [firstName]);

  const quoteLine = useMemo(() => `${cleanQuote(quote)}.`, [quote]);

  return (
    <div className={`${styles.page} ${styles[getTimeTone(now.getHours())]}`}>
      <WelcomeBackgroundPaths />

      <motion.div
        className={styles.center}
        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <motion.div
          className={styles.time}
          initial={{ scale: 0.99, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.45 }}
        >
          {formatTime(now)}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={greetingLine}
            className={styles.bigLine}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {greetingLine}
          </motion.div>
        </AnimatePresence>

        {/* Quotes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteLine}
            className={styles.smallLine}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, delay: 0.12, ease: "easeOut" }}
          >
            {quoteLine}
          </motion.div>
        </AnimatePresence>

        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <button className={styles.primaryBtn} onClick={onExplore}>
            Explore StudyFlax
          </button>

          <button className={styles.secondaryBtn} disabled title="Coming soon">
            Watch tutorial (coming soon)
          </button>

          <button className={styles.tertiaryBtn} onClick={onBackToAuth}>
            Back to sign in
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
