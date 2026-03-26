/*
 * Today banner for timer progress.
 */

<<<<<<< HEAD
import styles from '../../pages/timer/TimerPage.module.css';
import StatStrip from '../common/stat_strip/StatStrip';
import { useCountUp } from '../../hooks/useCountUp';
import { useTodayBannerData } from './today_banner/useTodayBannerData';

function buildStreakItem(state, streakRef) {
  return { key: 'streak', label: 'Current streak', value: state.streak, valueRef: streakRef, suffix: 'd', tone: state.streak > 0 ? 'success' : undefined };
}

function buildSessionsItem(state, sessionsRef) {
  return { key: 'sessions', label: 'Sessions logged', value: state.sessions, valueRef: sessionsRef, tooltip: 'Last 30 days', tone: state.sessions > 0 ? 'accent' : undefined };
}

function buildWeeklyGoalItem(state, weeklyGoalRef) {
  return { key: 'weekly-goal', label: 'Weekly goal', value: state.weeklyGoalDays, valueRef: weeklyGoalRef, suffix: ' / 7', tooltip: 'Active days this week', tone: 'accent' };
}

function buildFocusTimeItem(state, focusHoursRef) {
  return { key: 'focus-time', label: 'Focus time', value: state.focusHours, valueRef: focusHoursRef, suffix: 'h', tooltip: 'Last 30 days', tone: state.focusHours > 0 ? 'accent' : undefined };
}

function useTodayBannerItems(state) {
  const streakRef = useCountUp(state.streak, 1200);
  const sessionsRef = useCountUp(state.sessions, 1200);
  const weeklyGoalRef = useCountUp(state.weeklyGoalDays, 1200);
  const focusHoursRef = useCountUp(state.focusHours, 1200);
  return [buildStreakItem(state, streakRef), buildSessionsItem(state, sessionsRef), buildWeeklyGoalItem(state, weeklyGoalRef), buildFocusTimeItem(state, focusHoursRef)];
}

export default function TodayBanner({ onStreakData }) {
  const state = useTodayBannerData(onStreakData);
  const items = useTodayBannerItems(state);

  if (state.loading) return null;

  return <StatStrip items={items} className={styles.todayMetricBanner} />;
}
=======
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



>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
