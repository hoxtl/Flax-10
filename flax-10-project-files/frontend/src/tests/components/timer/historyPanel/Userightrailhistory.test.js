import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRightRailHistory, clearRightRailHistory } from '../../../../components/Timer/historyPanel/useRightRailHistory';

vi.mock('../../../../components/Timer/utils/historyUtils', () => ({
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock('../../../../components/Timer/utils/historyFormatter', () => ({
  groupHistoryByBlock: vi.fn((h) => h),
}));

vi.mock('../../../../components/Timer/historyPanel/historyPanelUtils', () => ({
  filterVisibleBlocks: vi.fn((b) => b),
  getSevenDayFocusSeries: vi.fn(() =>
    Array.from({ length: 7 }, (_, i) => ({ key: `day-${i}`, label: 'Mon', seconds: i * 100 }))
  ),
  groupBlocksByHorizon: vi.fn((b) => (b.length ? [{ label: 'Today', entries: b }] : [])),
}));

import { getHistory, clearHistory } from '../../../../components/Timer/utils/historyUtils';

const RAW_HISTORY = [{ id: 'a', totalDuration: 600, sessions: [{ status: 'Complete' }] }];

beforeEach(() => {
  vi.clearAllMocks();
  getHistory.mockResolvedValue(RAW_HISTORY);
  clearHistory.mockResolvedValue();
});

describe('useRightRailHistory – initial load', () => {
  it('fetches history on mount and populates state', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.history).toEqual(RAW_HISTORY);
  });

  it('falls back to an empty array when getHistory rejects', async () => {
    getHistory.mockRejectedValueOnce(new Error('network failure'));
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.history).toEqual([]);
  });

  it('falls back to an empty array when getHistory returns a non-array', async () => {
    getHistory.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.history).toEqual([]);
  });

  it('exposes showClearModal as false by default', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.showClearModal).toBe(false);
  });

  it('computes weeklySeries with exactly 7 entries', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.weeklySeries).toHaveLength(7);
  });

  it('computes maxWeeklySeconds as at least 60', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    expect(result.current.maxWeeklySeconds).toBeGreaterThanOrEqual(60);
  });
});

