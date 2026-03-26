import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRightRailHistory, clearRightRailHistory } from '../../../../components/timer/history_panel/useRightRailHistory';

vi.mock('../../../../components/timer/utils/historyUtils', () => ({
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock('../../../../components/timer/utils/historyFormatter', () => ({
  groupHistoryByBlock: vi.fn((h) => h),
}));

vi.mock('../../../../components/timer/history_panel/historyPanelUtils', () => ({
  filterVisibleBlocks: vi.fn((b) => b),
  getSevenDayFocusSeries: vi.fn(() =>
    Array.from({ length: 7 }, (_, i) => ({ key: `day-${i}`, label: 'Mon', seconds: i * 100 }))
  ),
  groupBlocksByHorizon: vi.fn((b) => (b.length ? [{ label: 'Today', entries: b }] : [])),
}));

import { getHistory, clearHistory } from '../../../../components/timer/utils/historyUtils';

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

describe('useRightRailHistory – event listeners', () => {
  it('refreshes history when timerHistoryUpdated fires', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    getHistory.mockResolvedValueOnce([...RAW_HISTORY, { id: 'b' }]);
    await act(async () => { window.dispatchEvent(new Event('timerHistoryUpdated')); });
    expect(result.current.history).toHaveLength(2);
  });

  it('refreshes history when historyCleared fires', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    getHistory.mockResolvedValueOnce([]);
    await act(async () => { window.dispatchEvent(new Event('historyCleared')); });
    expect(result.current.history).toEqual([]);
  });

  it('removes the timerHistoryUpdated listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('timerHistoryUpdated', expect.any(Function));
  });

  it('removes the historyCleared listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('historyCleared', expect.any(Function));
  });
});

describe('useRightRailHistory – modal state', () => {
  it('setShowClearModal updates the modal flag to true', async () => {
    const { result } = renderHook(() => useRightRailHistory());
    await act(async () => {});
    act(() => result.current.setShowClearModal(true));
    expect(result.current.showClearModal).toBe(true);
  });
});

describe('clearRightRailHistory', () => {
  it('closes the modal immediately', async () => {
    const setShowClearModal = vi.fn();
    await clearRightRailHistory(vi.fn(), setShowClearModal);
    expect(setShowClearModal).toHaveBeenCalledWith(false);
  });

  it('calls clearHistory to remove persisted data', async () => {
    await clearRightRailHistory(vi.fn(), vi.fn());
    expect(clearHistory).toHaveBeenCalled();
  });

  it('resets local history state to an empty array', async () => {
    const setHistory = vi.fn();
    await clearRightRailHistory(setHistory, vi.fn());
    expect(setHistory).toHaveBeenCalledWith([]);
  });

  it('dispatches the historyCleared event on the window', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    await clearRightRailHistory(vi.fn(), vi.fn());
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'historyCleared' }));
  });
});