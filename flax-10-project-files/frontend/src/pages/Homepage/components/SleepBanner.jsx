/*
 * Late-night nudge banner.
 */

import { useState, useEffect } from 'react';
import { getUserSettings } from '../../../api/userApi';
import { isDuringSleepWindow } from '../../../components/Settings/hooks/useSleepWarning';
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

export default function SleepBanner() {
  const [show, setShow] = useState(false);
  const [message] = useState(randomMessage);

  useEffect(() => {
    syncSleepBanner(setShow);
  }, []);

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>🌙</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.dismiss} onClick={() => setShow(false)}>x</button>
    </div>
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
