/*
 * Today banner for timer progress.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import { GoalEditor } from './todayBanner/GoalEditor';
import { ProgressBar } from './todayBanner/ProgressBar';
import { useTodayBannerData } from './todayBanner/useTodayBannerData';

function StreakBadge({ streak, streakTooltip }) {
  return (
    <span className={styles.todayRibbonStreakWrap} data-tooltip={streakTooltip}>
      <span className={styles.todayRibbonStreakIcon}>🔥</span>
      <span className={styles.todayRibbonStreakValue}>{streak}d</span>
    </span>
  );
}

function SessionCounter({ sessions, goalSessions, counterAnimating }) {
  const extraText = sessions > goalSessions ? ` (+${sessions - goalSessions} extra)` : '';
  return (
    <span className={styles.todayRibbonSessionsText}>
      <span className={styles.todayRibbonSessionDigitWrap}>
        <span key={sessions} className={`${styles.todayRibbonSessionDigit} ${counterAnimating ? styles.todayRibbonSessionDigitAnimate : ''}`}>{Math.min(sessions, goalSessions)}</span>
      </span>
      /{goalSessions} sessions today{extraText}
    </span>
  );
}

function BannerCenter({ state, isStudying }) {
  return (
    <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneCenter}`}>
      <div className={styles.todayRibbonHeroRow}>
        <SessionCounter sessions={state.sessions} goalSessions={state.goalSessions} counterAnimating={state.counterAnimating} />
        <span className={styles.todayRibbonMilestoneActive}>{state.weeklyGoalText}</span>
      </div>
      <div className={styles.todayRibbonScale}><span>0</span><span>{state.goalSessions}</span></div>
      <ProgressBar sessions={state.sessions} goalSessions={state.goalSessions} sessionPct={state.sessionPct} fillAnimating={state.fillAnimating} isStudying={isStudying} activePulseLeft={state.activePulseLeft} tickCount={state.tickCount} />
    </div>
  );
}

function BannerRight({ state }) {
  return (
    <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneRight}`}>
      <span className={styles.todayRibbonFocusValue}>🕒 {state.formattedHours}</span>
      <span className={styles.todayRibbonMeta}>
        Goal: <GoalEditor goalHours={state.goalHours} editingGoal={state.editingGoal} goalInput={state.goalInput} setGoalInput={state.setGoalInput} setEditingGoal={state.setEditingGoal} setGoalHours={state.setGoalHours} />
      </span>
    </div>
  );
}

export default function TodayBanner({ onStreakData, isStudying = false }) {
  const state = useTodayBannerData(onStreakData);
  if (state.loading) return null;

  return (
    <div className={styles.todayRibbon}>
      <div className={`${styles.todayRibbonZone} ${styles.todayRibbonZoneLeft}`}><StreakBadge streak={state.streak} streakTooltip={state.streakTooltip} /></div>
      <BannerCenter state={state} isStudying={isStudying} />
      <BannerRight state={state} />
    </div>
  );
}
