/*
 * Timer banner progress bar.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';

function ProgressTicks({ tickCount }) {
  return (
    <div className={styles.todayRibbonTickLayer}>
      {Array.from({ length: tickCount + 1 }).map((_, index) => <span key={`tick-${index}`} className={styles.todayRibbonTick} style={{ left: `${(index / tickCount) * 100}%` }} />)}
    </div>
  );
}

function ActivePulse({ isStudying, sessions, goalSessions, activePulseLeft }) {
  if (!isStudying || sessions >= goalSessions) return null;
  return <span className={styles.todayRibbonActivePulse} style={{ left: `${activePulseLeft}%` }} />;
}

export function ProgressBar({ sessions, goalSessions, sessionPct, fillAnimating, isStudying, activePulseLeft, tickCount }) {
  const fillClassName = `${styles.todayRibbonFill} ${fillAnimating ? styles.todayRibbonFillAnimate : ''} ${isStudying ? styles.todayRibbonFillLive : ''}`;

  return (
    <div className={styles.todayRibbonBar}>
      <div className={fillClassName} style={{ width: `${sessionPct}%` }}>
        <span className={styles.todayRibbonFillShimmer} />
      </div>
      <ProgressTicks tickCount={tickCount} />
      <ActivePulse isStudying={isStudying} sessions={sessions} goalSessions={goalSessions} activePulseLeft={activePulseLeft} />
    </div>
  );
}
