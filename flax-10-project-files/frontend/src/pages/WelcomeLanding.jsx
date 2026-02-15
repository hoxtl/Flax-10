import styles from "./WelcomeLanding.module.css";
import { pickQuoteByKey } from "../lib/quotes";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayName } from "../utils/userDisplay";
import { getGreeting } from "../utils/dateUtils";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function firstNameFromUser(user) {
  const display = (getDisplayName(user) || "").trim();
  if (!display) return "";
  return display.split(" ")[0];
}

function cleanQuote(q) {
  return (q || "").trim().replace(/[".]+$/g, "");
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
    const g = getGreeting(); // "Good afternoon"
    if (!firstName) return `${g}.`;
    return `${g}, ${firstName}.`;
  }, [firstName]);

  const quoteLine = useMemo(() => `${cleanQuote(quote)}.`, [quote]);

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
