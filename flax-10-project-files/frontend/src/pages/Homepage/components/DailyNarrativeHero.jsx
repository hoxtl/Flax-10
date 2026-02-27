/**
 * Daily Narrative Hero: context-aware summary + Start Session.
 */

import styles from "../Homepage.module.css";

export function DailyNarrativeHero({ narrative, mostUrgentDeadline, onStartSession, isLateNight }) {
  const { dayType, sessionCount, bestWindowStart, bestWindowEnd } = narrative || {};
  const hasWindow = bestWindowStart && bestWindowEnd;

  if (isLateNight) {
    return (
      <div className={styles.dailyNarrativeHero}>
        <div className={styles.dailyNarrativeStrategyHeader}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          Strategy for Today
        </div>
        <div className={styles.dailyNarrativeBox}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          <p className={styles.dailyNarrativeText}>Late night focus? Remember to sleep soon. 🌙</p>
        </div>
        <button
          type="button"
          className={styles.dailyNarrativeBtn}
          onClick={() => onStartSession?.(mostUrgentDeadline)}
          aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
        >
          Start Session
        </button>
      </div>
    );
  }

  if (sessionCount > 0 && hasWindow) {
    return (
      <div className={styles.dailyNarrativeHero}>
        <div className={styles.dailyNarrativeStrategyHeader}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          Strategy for Today
        </div>
        <div className={styles.dailyNarrativeBox}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          <p className={styles.dailyNarrativeText}>
            Today is a <span className={styles.dailyNarrativeBold}>{dayType}</span> day with{" "}
            <span className={styles.dailyNarrativeBold}>{sessionCount} session{sessionCount === 1 ? "" : "s"}</span>.
            Your best window for deep work is between{" "}
            <span className={styles.dailyNarrativeBold}>{bestWindowStart} and {bestWindowEnd}</span>.
          </p>
        </div>
        <button
          type="button"
          className={styles.dailyNarrativeBtn}
          onClick={() => onStartSession?.(mostUrgentDeadline)}
          aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
        >
          Start Session
        </button>
      </div>
    );
  }

  const line1 = sessionCount > 0
    ? `Today is a ${dayType} day with ${sessionCount} session${sessionCount === 1 ? "" : "s"}.`
    : "Your day is clear.";
  const line2 = hasWindow
    ? `Your best window for deep work is between ${bestWindowStart} and ${bestWindowEnd}.`
    : sessionCount > 0
      ? "Snatch short lists between sessions."
      : "A good time to plan or tackle your tasks.";
  const greetingText = `${line1} ${line2}`;

  return (
    <div className={styles.dailyNarrativeHero}>
      <div className={styles.dailyNarrativeStrategyHeader}>
        <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
        Strategy for Today
      </div>
      <div className={styles.dailyNarrativeBox}>
        <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
        <p className={styles.dailyNarrativeText}>{greetingText}</p>
      </div>
      <button
        type="button"
        className={styles.dailyNarrativeBtn}
        onClick={() => onStartSession?.(mostUrgentDeadline)}
        aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
      >
        Start Session
      </button>
    </div>
  );
}
