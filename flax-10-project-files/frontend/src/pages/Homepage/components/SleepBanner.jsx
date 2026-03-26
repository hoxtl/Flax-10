/*
 * Late-night nudge banner.
 */

import { AnimatePresence, motion as Motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { getUserSettings } from '../../../api/userApi';
import { isDuringSleepWindow } from '../../../components/settings/hooks/useSleepWarning';
import styles from './SleepBanner.module.css';

const MESSAGES = [
  "Shouldn't you be asleep right now?",
  "It's past your bedtime. Your future self will not thank you.",
  "Sleep is a study skill too, you know.",
  "Still here? Your pillow misses you.",
  "Your brain consolidates memory during sleep. Just saying.",
  "Night owl or procrastinator? Either way, get some rest.",
];

function randomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

const BANNER_TRANSITION = { duration: 0.32, ease: [0.22, 1, 0.36, 1] };
const GLOW_ANIMATION = { x: ["-10%", "16%", "-4%"], opacity: [0.24, 0.38, 0.28] };
const ICON_ANIMATION = { y: [0, -2, 0], rotate: [-4, 0, 4, 0], scale: [1, 1.05, 1] };

function BannerGlow() {
  return <Motion.div className={styles.glow} aria-hidden animate={GLOW_ANIMATION} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />;
}

function BannerIcon() {
  return <Motion.span className={styles.icon} aria-hidden animate={ICON_ANIMATION} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>🌙</Motion.span>;
}

function BannerContent({ message, onDismiss }) {
  return (
    <Motion.div className={styles.banner} initial={{ opacity: 0, y: -10, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.982 }} transition={BANNER_TRANSITION}>
      <div className={styles.flow} aria-hidden />
      <BannerGlow />
      <BannerIcon />
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.dismiss} aria-label="Dismiss sleep banner" onClick={onDismiss}>&times;</button>
    </Motion.div>
  );
}

export default function SleepBanner() {
  const [show, setShow] = useState(false);
  const [message] = useState(randomMessage);
  useEffect(() => { syncSleepBanner(setShow); }, []);
  return (
    <AnimatePresence initial={false}>
      {show ? <BannerContent message={message} onDismiss={() => setShow(false)} /> : null}
    </AnimatePresence>
  );
}

function syncSleepBanner(setShow) {
  getUserSettings().then((data) => setShow(shouldShowSleepBanner(data))).catch(() => {});
}

function shouldShowSleepBanner(data) {
  const sleepTime = data?.sleep_time?.slice(0, 5) || '23:00';
  const wakeTime = data?.wake_time?.slice(0, 5) || '07:00';
  return isDuringSleepWindow(sleepTime, wakeTime, new Date());
}
