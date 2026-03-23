/*
 * Loads and derives timer banner summary state.
 */

import { useCallback, useEffect, useState } from 'react';
import analyticsService from '../../../api/analyticsApi';
import { getNearestMilestone } from '../utils/milestoneUtils';
import { listenToTimerHistoryEvents } from '../utils/historyEvents';

function loadGoalHours() {
  return parseFloat(localStorage.getItem('timerDailyGoalHours') || '4');
}

function loadSummary(days, onSuccess, onError) {
  analyticsService.getSummary(days).then((result) => onSuccess(result?.summary ?? null)).catch(onError);
}

function fmtHours(hours) {
  if (!hours || hours <= 0) return '0m';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (wholeHours > 0 && minutes > 0) return `${wholeHours}h ${minutes}m`;
  if (wholeHours > 0) return `${wholeHours}h`;
  return `${minutes}m`;
}

function useSummaryData(onStreakData) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState(null);
  const refresh = useCallback(() => refreshSummaries(setData, setMonthSummary, setLoading, onStreakData), [onStreakData]);

  useEffect(() => listenToTimerHistoryEvents(refresh), [refresh]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, loading, monthSummary };
}

function refreshSummaries(setData, setMonthSummary, setLoading, onStreakData) {
  loadSummary(1, (summary) => updateDailySummary(summary, setData, setLoading, onStreakData), () => setLoading(false));
  loadSummary(30, setMonthSummary, () => setMonthSummary(null));
}

function updateDailySummary(summary, setData, setLoading, onStreakData) {
  setData(summary);
  setLoading(false);
  if (onStreakData) onStreakData(summary);
}

function useAnimationState(sessions) {
  const [lastSessionCount, setLastSessionCount] = useState(null);
  const [fillAnimating, setFillAnimating] = useState(false);
  const [counterAnimating, setCounterAnimating] = useState(false);

  useEffect(() => animateSessionChange(sessions, lastSessionCount, setLastSessionCount, setFillAnimating, setCounterAnimating), [sessions, lastSessionCount]);
  return { fillAnimating, counterAnimating };
}

function animateSessionChange(sessions, lastSessionCount, setLastSessionCount, setFillAnimating, setCounterAnimating) {
  if (lastSessionCount == null) return setLastSessionCount(sessions);
  if (sessions === lastSessionCount) return undefined;
  setFillAnimating(true);
  setCounterAnimating(true);
  setLastSessionCount(sessions);
  const id = window.setTimeout(() => stopAnimations(setFillAnimating, setCounterAnimating), 900);
  return () => clearTimeout(id);
}

function stopAnimations(setFillAnimating, setCounterAnimating) {
  setFillAnimating(false);
  setCounterAnimating(false);
}

function buildBannerMetrics(data, monthSummary, goalHours) {
  const sessions = data?.total_sessions ?? 0;
  const hours = data?.total_study_hours ?? 0;
  const streak = data?.current_streak_days ?? 0;
  const goalSessions = Math.max(1, Math.ceil((goalHours * 60) / 25));
  const sessionPct = Math.min(100, Math.round((sessions / goalSessions) * 100));
  const timePct = Math.round((hours / goalHours) * 100);
  const milestone = monthSummary ? getNearestMilestone(Number(monthSummary.total_sessions ?? 0), Number(monthSummary.current_streak_days ?? 0), Number(monthSummary.total_study_hours ?? 0)) : null;
  return { sessions, hours, streak, goalSessions, sessionPct, timePct, milestone, formattedHours: fmtHours(hours) };
}


function buildRibbonMeta(metrics) {
  const weeklyProgressDays = Math.max(0, Math.min(7, metrics.streak > 0 && metrics.streak % 7 === 0 ? 7 : metrics.streak % 7));
  const weeklyGoalText = `🔥 ${weeklyProgressDays}/7 days towards your weekly goal`;
  const streakTooltip = metrics.milestone ? `${metrics.milestone.remaining} away from ${metrics.milestone.label}` : weeklyGoalText;
  const tickCount = Math.max(2, Math.min(metrics.goalSessions, 16));
  const activePulseLeft = Math.min(98, Math.max(2, ((Math.min(metrics.sessions, metrics.goalSessions - 1) + 0.5) / metrics.goalSessions) * 100));
  return { weeklyGoalText, streakTooltip, tickCount, activePulseLeft };
}

export function useTodayBannerData(onStreakData) {
  const [goalHours, setGoalHours] = useState(loadGoalHours);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const { data, loading, monthSummary } = useSummaryData(onStreakData);
  const metrics = buildBannerMetrics(data, monthSummary, goalHours);
  const ribbonMeta = buildRibbonMeta(metrics);
  const animation = useAnimationState(metrics.sessions);

  return { loading, goalHours, setGoalHours, editingGoal, setEditingGoal, goalInput, setGoalInput, ...metrics, ...ribbonMeta, ...animation };
}
