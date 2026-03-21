/*
 * Today banner for timer progress.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import { GoalEditor } from './todayBanner/GoalEditor';
import { ProgressBar } from './todayBanner/ProgressBar';
import { useTodayBannerData } from './todayBanner/useTodayBannerData';

function MetricSection({ label, value, sub, icon, iconBg, divider = true }) {
  return (
    <>
      <div className={styles.todayMetricSection}>
        <div className={styles.todayMetricIconWrap} style={{ backgroundColor: iconBg }}>
          <span className={styles.todayMetricIcon}>{icon}</span>
        </div>
        <div className={styles.todayMetricInfo}>
          <span className={styles.todayMetricLabel}>{label}</span>
          <span className={styles.todayMetricValue}>{value}</span>
          {sub && <div className={styles.todayMetricSub}>{sub}</div>}
        </div>
      </div>
      {divider && <div className={styles.todayMetricDivider} />}
    </>
  );
}

export default function TodayBanner({ onStreakData, isStudying = false }) {
  const state = useTodayBannerData(onStreakData);
  if (state.loading) return null;

  const weeklyProgressDays = Math.max(0, Math.min(7, state.streak > 0 && state.streak % 7 === 0 ? 7 : state.streak % 7));

  return (
    <div className={styles.todayMetricBanner}>
      <MetricSection
        label="STREAK"
        value={`${state.streak} day${state.streak !== 1 ? 's' : ''}`}
        icon="🔥"
        iconBg="#fff7ed"
      />
      <MetricSection
        label="SESSIONS"
        value={`${state.sessions} / ${state.goalSessions}`}
        sub={<ProgressBar sessions={state.sessions} goalSessions={state.goalSessions} sessionPct={state.sessionPct} fillAnimating={state.fillAnimating} isStudying={isStudying} activePulseLeft={state.activePulseLeft} tickCount={state.tickCount} />}
        icon="🎯"
        iconBg="#f5f3ff"
      />
      <MetricSection
        label="WEEKLY GOAL"
        value={`${weeklyProgressDays} / 7 days`}
        sub={<ProgressBar sessions={weeklyProgressDays} goalSessions={7} sessionPct={(weeklyProgressDays / 7) * 100} isStudying={false} />}
        icon="🏆"
        iconBg="#f0fdf4"
      />
      <MetricSection
        label="FOCUS TIME"
        value={state.formattedHours}
        sub={<div className={styles.todayGoalInlineMeta}>of {state.goalHours}h · {state.timePct}%</div>}
        icon="🕒"
        iconBg="#fafaf9"
        divider={false}
      />

    </div>
  );
}



