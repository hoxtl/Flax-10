/*
 * Loads and derives timer banner summary state.
 */

import { useCallback, useEffect, useState } from 'react';
import analyticsService from '../../../api/analyticsApi';
import { listenToTimerHistoryEvents } from '../utils/historyEvents';

const EMPTY_SUMMARY = Object.freeze({
  total_sessions: 0,
  total_study_hours: 0,
  current_streak_days: 0,
  active_days: 0,
});

function normalizeSummary(summary) {
  return { ...EMPTY_SUMMARY, ...(summary || {}) };
}

async function loadSummary(days) {
  try {
    const result = await analyticsService.getSummary(days);
    return normalizeSummary(result?.summary);
  } catch {
    return EMPTY_SUMMARY;
  }
}

function buildBannerMetrics(todaySummary, weekSummary, monthSummary) {
  return {
    streak: Number(monthSummary.current_streak_days || 0),
    sessions: Number(monthSummary.total_sessions || 0),
    weeklyGoalDays: Math.max(0, Math.min(7, Number(weekSummary.active_days || 0))),
    focusHours: Number(monthSummary.total_study_hours || 0),
    streakData: {
      current_streak_days: Number(monthSummary.current_streak_days || 0),
      total_sessions: Number(todaySummary.total_sessions || 0),
    },
  };
}

async function fetchBannerSummaries() {
  const [todaySummary, weekSummary, monthSummary] = await Promise.all([loadSummary(1), loadSummary(7), loadSummary(30)]);
  return buildBannerMetrics(todaySummary, weekSummary, monthSummary);
}

function useBannerRefresh(setState, onStreakData) {
  return useCallback(async () => {
    const nextState = await fetchBannerSummaries();
    setState({ loading: false, ...nextState });
    onStreakData?.(nextState.streakData);
  }, [setState, onStreakData]);
}

export function useTodayBannerData(onStreakData) {
  const [state, setState] = useState({ loading: true, ...buildBannerMetrics(EMPTY_SUMMARY, EMPTY_SUMMARY, EMPTY_SUMMARY) });
  const refresh = useBannerRefresh(setState, onStreakData);
  useEffect(() => listenToTimerHistoryEvents(refresh), [refresh]);
  useEffect(() => { const id = window.setTimeout(refresh, 0); return () => window.clearTimeout(id); }, [refresh]);
  return state;
}
