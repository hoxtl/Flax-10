/*
 * Analytics overview data loader.
 */

import { useEffect, useState } from 'react';
import analyticsService from '../../../api/analytics/analyticsApi';

const EMPTY_STATE = {
  data: null,
  error: null,
  loading: true,
  progressData: null,
  themeStats: null,
};

const getErrorMessage = (error) => error?.message || 'Failed to load analytics data.';

const getOverviewRequests = (period) => [
  analyticsService.getSummary(period),
  analyticsService.getProgress(period),
  analyticsService.getThemeStats(period),
];

const applyOverviewData = (setState, [data, progressData, themeStats]) =>
  setState({ data, error: null, loading: false, progressData, themeStats });

const applyOverviewError = (setState, error) =>
  setState((current) => ({ ...current, error: getErrorMessage(error), loading: false }));

const resetOverviewState = (setState) =>
  setState({ data: null, error: null, loading: false, progressData: null, themeStats: null });

const finishOverviewLoad = (isCancelled, onComplete) => {
  if (!isCancelled()) onComplete();
};

async function loadOverview(period, setState, isCancelled) {
  setState((current) => ({ ...current, error: null, loading: true }));
  try {
    const results = await Promise.all(getOverviewRequests(period));
    finishOverviewLoad(isCancelled, () => applyOverviewData(setState, results));
  } catch (error) {
    finishOverviewLoad(isCancelled, () => applyOverviewError(setState, error));
  }
}

export default function useAnalyticsOverview(period) {
  const [state, setState] = useState(EMPTY_STATE);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    if (!period) resetOverviewState(setState);
    if (period) loadOverview(period, setState, isCancelled);
    return () => {
      cancelled = true;
    };
  }, [period]);

  return state;
}
