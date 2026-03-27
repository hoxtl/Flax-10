/*
 * Today banner for timer progress.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/timer/components/TodayBanner.jsx
import styles from '../../../pages/timer/TimerPage.module.css';
import StatStrip from '../../common/stat_strip/StatStrip';
import { useCountUp } from '../../../hooks/useCountUp';
import { useTodayBannerData } from '../today_banner/useTodayBannerData';
=======
import styles from '../../pages/timer/TimerPage.module.css';
import StatStrip from '../common/stat_strip/StatStrip';
import { useCountUp } from '../../hooks/useCountUp';
import { useTodayBannerData } from './today_banner/useTodayBannerData';
>>>>>>> main:flax-10-project-files/frontend/src/components/timer/TodayBanner.jsx

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
