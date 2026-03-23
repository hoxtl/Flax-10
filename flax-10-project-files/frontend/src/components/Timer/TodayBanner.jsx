/*
 * Today banner for timer progress.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
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

function getWeeklyProgressDays(streak) {
  const weeklyDays = streak % 7;
  if (streak > 0 && weeklyDays === 0) return 7;
  return Math.max(0, Math.min(7, weeklyDays));
}

function FocusTimeSub({ goalHours, timePct }) {
  return <div className={styles.todayGoalInlineMeta}>of {goalHours}h · {timePct}%</div>;
}

function BannerMetrics({ state, isStudying }) {
  const weeklyProgressDays = getWeeklyProgressDays(state.streak);

  return (
    <>
      <MetricSection label="STREAK" value={`${state.streak} day${state.streak !== 1 ? 's' : ''}`} icon="🔥" iconBg="var(--color-banner-streak)" />
      <MetricSection label="SESSIONS" value={`${state.sessions} / ${state.goalSessions}`} sub={<ProgressBar sessions={state.sessions} goalSessions={state.goalSessions} sessionPct={state.sessionPct} fillAnimating={state.fillAnimating} isStudying={isStudying} activePulseLeft={state.activePulseLeft} tickCount={state.tickCount} />} icon="🎯" iconBg="var(--color-banner-sessions)" />
      <MetricSection label="WEEKLY GOAL" value={`${weeklyProgressDays} / 7 days`} sub={<ProgressBar sessions={weeklyProgressDays} goalSessions={7} sessionPct={(weeklyProgressDays / 7) * 100} isStudying={false} />} icon="🏆" iconBg="var(--color-banner-goal)" />
      <MetricSection label="FOCUS TIME" value={state.formattedHours} sub={<FocusTimeSub goalHours={state.goalHours} timePct={state.timePct} />} icon="🕒" iconBg="var(--color-banner-focus)" divider={false} />
    </>
  );
}

export default function TodayBanner({ onStreakData, isStudying = false }) {
  const state = useTodayBannerData(onStreakData);
  if (state.loading) return null;

  return (
    <div className={styles.todayMetricBanner}>
      <BannerMetrics state={state} isStudying={isStudying} />
    </div>
  );
}

