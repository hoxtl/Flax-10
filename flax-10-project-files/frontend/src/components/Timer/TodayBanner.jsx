/*
 * Today banner for timer progress.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import StatStrip from '../common/StatStrip/StatStrip';
import { useCountUp } from '../../hooks/useCountUp';
import { useTodayBannerData } from './todayBanner/useTodayBannerData';

function useTodayBannerItems(state) {
  const streakRef = useCountUp(state.streak, 1200);
  const sessionsRef = useCountUp(state.sessions, 1200);
  const weeklyGoalRef = useCountUp(state.weeklyGoalDays, 1200);
  const focusHoursRef = useCountUp(state.focusHours, 1200);

  return [
    {
      key: 'streak',
      label: 'Current streak',
      value: state.streak,
      valueRef: streakRef,
      suffix: 'd',
      meta: 'days in a row',
      tone: state.streak > 0 ? 'success' : undefined,
    },
    {
      key: 'sessions',
      label: 'Sessions logged',
      value: state.sessions,
      valueRef: sessionsRef,
      meta: 'last 30 days',
      tone: state.sessions > 0 ? 'accent' : undefined,
    },
    {
      key: 'weekly-goal',
      label: 'Weekly goal',
      value: state.weeklyGoalDays,
      valueRef: weeklyGoalRef,
      suffix: ' / 7',
      meta: 'active days this week',
      tone: state.weeklyGoalDays >= 7 ? 'success' : undefined,
    },
    {
      key: 'focus-time',
      label: 'Focus time',
      value: state.focusHours,
      valueRef: focusHoursRef,
      suffix: 'h',
      meta: 'last 30 days',
      tone: state.focusHours > 0 ? 'accent' : undefined,
    },
  ];
}

export default function TodayBanner({ onStreakData }) {
  const state = useTodayBannerData(onStreakData);
  const items = useTodayBannerItems(state);

  if (state.loading) return null;

  return <StatStrip items={items} className={styles.todayMetricBanner} />;
}
