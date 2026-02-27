/**
 * Daily progress ring: percentage of today's scheduled items completed (past events / total).
 */

import { useMemo } from "react";
import { isPast } from "../utils/eventUtils";
import styles from "../Homepage.module.css";

export function DailyProgressRing({ dayEvents }) {
  const { completed, total, pct } = useMemo(() => {
    const totalCount = dayEvents.length;
    const completedCount = dayEvents.filter((e) => isPast(e.end_time)).length;
    const value = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completed: completedCount, total: totalCount, pct: value };
  }, [dayEvents]);

  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={styles.progressRingWrap} title={`${completed} of ${total} done today`}>
      <svg className={styles.progressRingSvg} viewBox="0 0 52 52" aria-hidden>
        <circle className={styles.progressRingBg} cx="26" cy="26" r={r} fill="none" strokeWidth="4" />
        <circle
          className={styles.progressRingFill}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className={styles.progressRingLabel}>{total ? `${pct}%` : "—"}</span>
    </div>
  );
}
