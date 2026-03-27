/*
 * Weekly history chart.
 */

import { motion, useReducedMotion } from 'framer-motion';
import styles from '../../../pages/timer/TimerPage.module.css';

const MotionSpan = motion.span;

function getBarAnimation(reduceMotion, barHeight, index) {
  if (reduceMotion) return { style: { height: barHeight }, initial: false, animate: undefined, transition: undefined };
  return {
    style: { height: barHeight },
    initial: { height: 0, opacity: 0.35, scaleY: 0.92 },
    animate: { height: barHeight, opacity: 1, scaleY: 1 },
    transition: { duration: 0.55, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] },
  };
}

function WeeklyBar({ day, maxWeeklySeconds, index, todayKey, reduceMotion }) {
  const safeMaxWeeklySeconds = Math.max(1, Number(maxWeeklySeconds) || 0);
  const ratio = Math.max(0.04, Number(day.seconds || 0) / safeMaxWeeklySeconds);
  const hours = (Number(day.seconds || 0) / 3600).toFixed(1);
  const isToday = day.key === todayKey;
  const barHeight = `${Math.round(ratio * 100)}%`;
  const anim = getBarAnimation(reduceMotion, barHeight, index);
  const labelClassName = `${styles.rightHistoryWeeklyBarLabel} ${isToday ? styles.rightHistoryWeeklyBarLabelToday : ''}`.trim();
  const valueClassName = `${styles.rightHistoryWeeklyValue} ${isToday ? styles.rightHistoryWeeklyValueToday : ''}`.trim();
  return (
    <div className={styles.rightHistoryWeeklyBarCol}>
      <div className={styles.rightHistoryWeeklyBarTrack}><MotionSpan className={styles.rightHistoryWeeklyBarFill} style={anim.style} initial={anim.initial} animate={anim.animate} transition={anim.transition} /></div>
      <span className={labelClassName}>{day.label}</span>
      <span className={valueClassName}>{hours}h</span>
    </div>
  );
}

export function WeeklyChart({ weeklySeries, maxWeeklySeconds }) {
  const reduceMotion = useReducedMotion();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  return (
    <section className={styles.rightHistoryWeeklySummary}>
      <div className={styles.rightHistoryWeeklyHeader}>Weekly Summary</div>
      <div className={styles.rightHistoryWeeklyChart} role="img" aria-label="Focus hours per day for the last 7 days">
        {weeklySeries.map((day, index) => (
          <WeeklyBar key={day.key} day={day} index={index} todayKey={todayKey} maxWeeklySeconds={maxWeeklySeconds} reduceMotion={reduceMotion} />
        ))}
      </div>
    </section>
  );
}
