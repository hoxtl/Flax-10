/*
 * Loads timer history for the right rail.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearHistory, getHistory } from '../utils/historyUtils';
import { groupHistoryByBlock } from '../utils/historyFormatter';
import { filterVisibleBlocks, getSevenDayFocusSeries, groupBlocksByHorizon } from './historyPanelUtils';

function listenToHistoryEvents(refresh) {
  window.addEventListener('timerHistoryUpdated', refresh);
  window.addEventListener('historyCleared', refresh);
  return () => removeHistoryListeners(refresh);
}

function removeHistoryListeners(refresh) {
  window.removeEventListener('timerHistoryUpdated', refresh);
  window.removeEventListener('historyCleared', refresh);
}

export function useRightRailHistory() {
  const [history, setHistory] = useState([]);
  const [earlierExpanded, setEarlierExpanded] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const refresh = useCallback(() => refreshHistory(setHistory), []);
  const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
  const visibleBlocks = useMemo(() => filterVisibleBlocks(blocks), [blocks]);
  const groupedByHorizon = useMemo(() => groupBlocksByHorizon(visibleBlocks), [visibleBlocks]);
  const weeklySeries = useMemo(() => getSevenDayFocusSeries(blocks), [blocks]);
  const maxWeeklySeconds = useMemo(() => Math.max(60, ...weeklySeries.map((day) => Number(day.seconds || 0))), [weeklySeries]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => listenToHistoryEvents(refresh), [refresh]);
  return { history, setHistory, earlierExpanded, setEarlierExpanded, showClearModal, setShowClearModal, visibleBlocks, groupedByHorizon, weeklySeries, maxWeeklySeconds };
}

async function refreshHistory(setHistory) {
  try {
    const data = await getHistory();
    setHistory(Array.isArray(data) ? data : []);
  } catch {
    setHistory([]);
  }
}

export async function clearRightRailHistory(setHistory, setShowClearModal) {
  setShowClearModal(false);
  await clearHistory();
  setHistory([]);
  window.dispatchEvent(new Event('historyCleared'));
}
