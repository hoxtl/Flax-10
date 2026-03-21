/**
 * Homepage active timer banner.
 */

import styles from "../Homepage.module.css";

function formatTimer(timeLeft) {
  const safeTime = Math.max(0, timeLeft);
  return `${Math.floor(safeTime / 60).toString().padStart(2, "0")}:${(safeTime % 60).toString().padStart(2, "0")}`;
}

export function HomepageFocusBanner({ hasTimerSession, navigate, timeLeft, timerMode, timerTask }) {
  if (!hasTimerSession) return null;

  return (
    <div className={styles.focusBanner}>
      <div className={styles.focusBannerLeft}>
        <span className={`${styles.focusBannerBadge} ${timerMode === "break" ? styles.focusBannerBadgeBreak : ""}`}>
          {timerMode === "break" ? "BREAK" : "FOCUS"}
        </span>
        {timerTask && <span className={styles.focusBannerTask}>{timerTask}</span>}
      </div>
      <div className={styles.focusBannerRight}>
        <span className={styles.focusBannerTime}>{formatTimer(timeLeft)}</span>
        <button type="button" className={styles.focusBannerBtn} onClick={() => navigate("/timer")}>
          Open timer →
        </button>
      </div>
    </div>
  );
}
