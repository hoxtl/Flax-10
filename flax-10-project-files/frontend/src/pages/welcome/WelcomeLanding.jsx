import styles from "./WelcomeLanding.module.css";
import { pickWelcomeQuoteByKey } from "../../lib/quotes";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getGreeting } from "../../components/Calendar/utils/dateUtils";
import WelcomeBackgroundPaths from "../../components/Welcome/WelcomeBackgroundPaths";
import PrimaryButton from "../../components/common/primary_button/PrimaryButton";

function pad2(n) { return String(n).padStart(2, "0"); }

function formatTime(d) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

function getTimeTone(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "day";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}
function firstNameFromUser(user) { return (user?.first_name || "").trim(); }

function cleanQuote(q) { 
  if (!q) return "";
  return String(q).trim().replace(/[".]+$/g, "");
}

function buildGreetingLine(firstName) {
  const g = getGreeting();
  return firstName ? `${g}, ${firstName}.` : `${g}.`;
}

function useWelcomeState(user) {
  const firstName = firstNameFromUser(user);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const quoteKey = useMemo(() => `${now.toDateString()}-${now.getHours()}-${now.getMinutes()}`, [now]);
  const quote = useMemo(() => pickWelcomeQuoteByKey(quoteKey), [quoteKey]);
  const greetingLine = useMemo(() => buildGreetingLine(firstName), [firstName]);
  const quoteLine = useMemo(() => `${cleanQuote(quote)}.`, [quote]);
  return { now, greetingLine, quoteLine };
}

function WelcomeBrand() {
  return (
    <motion.div className={styles.brand} initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
      <div className={styles.brandName}>STUDYFLAX</div>
      <div className={styles.brandTagline}>Built for calm study.</div>
    </motion.div>
  );
}

function WelcomeTime({ now }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={formatTime(now)} className={styles.time}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
        {formatTime(now)}
      </motion.div>
    </AnimatePresence>
  );
}

function WelcomeGreeting({ greetingLine }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={greetingLine} className={styles.bigLine}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
        {greetingLine}
      </motion.div>
    </AnimatePresence>
  );
}

function WelcomeQuote({ quoteLine }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={quoteLine} className={styles.smallLine}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, delay: 0.09, ease: "easeOut" }}>
        {quoteLine}
      </motion.div>
    </AnimatePresence>
  );
}

function WelcomeActions({ onExplore, onBackToAuth }) {
  return (
    <motion.div className={styles.actions} initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
      <PrimaryButton className={styles.primaryBtn} size="large" pill onClick={onExplore}>Explore StudyFlax</PrimaryButton>
      <PrimaryButton className={styles.secondaryBtn} variant="secondary" size="large" pill disabled title="Coming soon">Watch tutorial (coming soon)</PrimaryButton>
      <PrimaryButton className={styles.tertiaryBtn} variant="ghost" size="large" pill onClick={onBackToAuth}>Back to sign in</PrimaryButton>
    </motion.div>
  );
}

function WelcomeCenter({ now, greetingLine, quoteLine, onExplore, onBackToAuth }) {
  return (
    <motion.div className={styles.center} initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <WelcomeTime now={now} />
      <WelcomeGreeting greetingLine={greetingLine} />
      <WelcomeQuote quoteLine={quoteLine} />
      <WelcomeActions onExplore={onExplore} onBackToAuth={onBackToAuth} />
    </motion.div>
  );
}

export default function WelcomeLanding({ user, onExplore, onBackToAuth }) {
  const { now, greetingLine, quoteLine } = useWelcomeState(user);
  return (
    <div className={`${styles.page} ${styles[getTimeTone(now.getHours())]}`}>
      <WelcomeBackgroundPaths />
      <WelcomeBrand />
      <WelcomeCenter now={now} greetingLine={greetingLine} quoteLine={quoteLine}
        onExplore={onExplore} onBackToAuth={onBackToAuth} />
      <div className={styles.footerNote}>v1</div>
    </div>
  );
}
