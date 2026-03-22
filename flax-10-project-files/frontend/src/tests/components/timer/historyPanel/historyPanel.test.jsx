import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HistoryRailSection } from '../../../../../components/Timer/historyPanel/HistoryRailSection';
import { WeeklyChart } from '../../../../../components/Timer/historyPanel/WeeklyChart';
import { useRightRailHistory, clearRightRailHistory } from '../../../../../components/Timer/historyPanel/useRightRailHistory';

vi.mock('../../../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../../Timer/utils/historyUtils', () => ({
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
}));

vi.mock('../../../Timer/utils/historyFormatter', () => ({
  formatDuration: (s) => s ? `${Math.floor(s / 60)}m` : '0m',
  formatTimeRange: (start, end) => start && end ? '10:00 - 11:00' : '—',
  groupHistoryByBlock: (h) => Array.isArray(h) ? h : [],
}));

import { getHistory, clearHistory } from '../../../Timer/utils/historyUtils';

describe('HistoryRailSection', () => {
  it('renders complete card with all fields', () => {
    const group = {
      label: 'Today',
      entries: [{
        task: 'Study Math',
        totalDuration: 3600,
        totalBreak: 300,
        module: 'Mathematics',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:00:00Z',
        sessions: [{ status: 'Completed' }, { status: 'Completed' }],
      }],
    };
    render(<HistoryRailSection group={group} />);
    
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Study Math')).toBeTruthy();
    expect(screen.getByText('60m')).toBeTruthy();
    expect(screen.getByText('Mathematics')).toBeTruthy();
    expect(screen.getByText('10:00 - 11:00')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('2/2 sessions')).toBeTruthy();
    expect(screen.getByText(/☕ 5m break/)).toBeTruthy();
  });

  it('uses defaults for missing fields', () => {
    const group = {
      label: 'Yesterday',
      entries: [
        { sessions: [] },
        { sessions: [{ status: 'Incomplete' }] },
        { totalDuration: 0, sessions: [{ status: 'Completed' }] },
      ],
    };
    render(<HistoryRailSection group={group} />);
    
    expect(screen.getAllByText('Focus Session')).toHaveLength(3);
    expect(screen.getAllByText('General')).toHaveLength(3);
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.getAllByText('Partial')).toHaveLength(2);
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('0/1 sessions')).toBeTruthy();
    expect(screen.getByText('1/1 sessions')).toBeTruthy();
  });

  it('handles complex session scenarios', () => {
    const group = {
      label: 'This Week',
      entries: [{
        sessions: [
          { status: 'Completed' },
          { status: 'Incomplete' },
          { status: 'Completed' },
          {},
        ],
        totalBreak: 0,
      }],
    };
    render(<HistoryRailSection group={group} />);
    
    expect(screen.getByText('3/4 sessions')).toBeTruthy();
    expect(screen.queryByText(/☕/)).toBeNull();
  });

  it('renders multiple entries', () => {
    const group = {
      label: 'Earlier',
      entries: [
        { id: 1, task: 'Task 1', sessions: [] },
        { id: 2, task: 'Task 2', sessions: [] },
        { id: 3, task: 'Task 3', sessions: [] },
      ],
    };
    render(<HistoryRailSection group={group} />);
    
    expect(screen.getByText('Task 1')).toBeTruthy();
    expect(screen.getByText('Task 2')).toBeTruthy();
    expect(screen.getByText('Task 3')).toBeTruthy();
  });
});

describe('WeeklyChart', () => {
  const fullWeek = [
    { key: '2024-01-09', label: 'Mon', seconds: 3600 },
    { key: '2024-01-10', label: 'Tue', seconds: 7200 },
    { key: '2024-01-11', label: 'Wed', seconds: 0 },
    { key: '2024-01-12', label: 'Thu', seconds: 5400 },
    { key: '2024-01-13', label: 'Fri', seconds: 10800 },
    { key: '2024-01-14', label: 'Sat', seconds: 1800 },
    { key: '2024-01-15', label: 'Sun', seconds: 3600 },
  ];

  it('renders complete weekly chart', () => {
    const { container } = render(<WeeklyChart weeklySeries={fullWeek} maxWeeklySeconds={10800} />);
    
    expect(screen.getByText('Weekly Summary')).toBeTruthy();
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
      expect(screen.getByText(day)).toBeTruthy();
    });
    expect(screen.getByText('1.0h')).toBeTruthy();
    expect(screen.getByText('2.0h')).toBeTruthy();
    expect(screen.getByText('0.0h')).toBeTruthy();
    expect(screen.getByText('3.0h')).toBeTruthy();
    
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars).toHaveLength(7);
  });

  it('calculates bar heights correctly', () => {
    const { container } = render(<WeeklyChart weeklySeries={fullWeek} maxWeeklySeconds={10800} />);
    const bars = container.querySelectorAll('[style*="height"]');
    const heights = Array.from(bars).map(b => parseInt(b.style.height));
    
    expect(Math.max(...heights)).toBe(100);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(4);
  });

  it('handles zero values', () => {
    const series = [{ key: '2024-01-15', label: 'Sun', seconds: 0 }];
    const { container } = render(<WeeklyChart weeklySeries={series} maxWeeklySeconds={100} />);
    
    expect(screen.getByText('0.0h')).toBeTruthy();
    const bar = container.querySelector('[style*="height"]');
    expect(parseInt(bar.style.height)).toBeGreaterThanOrEqual(4);
  });
});

describe('useRightRailHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads history on mount', async () => {
    getHistory.mockResolvedValue([{ id: 1, totalDuration: 3600 }]);
    const { result } = renderHook(() => useRightRailHistory());

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalled();
      expect(result.current.history).toEqual([{ id: 1, totalDuration: 3600 }]);
    });
  });

  it('handles errors and non-array responses', async () => {
    getHistory.mockRejectedValue(new Error('Failed'));
    const { result: result1 } = renderHook(() => useRightRailHistory());
    await waitFor(() => expect(result1.current.history).toEqual([]));

    getHistory.mockResolvedValue(null);
    const { result: result2 } = renderHook(() => useRightRailHistory());
    await waitFor(() => expect(result2.current.history).toEqual([]));
  });

  it('refreshes on events', async () => {
    getHistory.mockResolvedValue([{ id: 1 }]);
    renderHook(() => useRightRailHistory());
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(1));

    getHistory.mockResolvedValue([{ id: 2 }]);
    await act(async () => {
      window.dispatchEvent(new Event('timerHistoryUpdated'));
    });
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(2));

    await act(async () => {
      window.dispatchEvent(new Event('historyCleared'));
    });
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(3));
  });

  it('clears history', async () => {
    const setHistory = vi.fn();
    const setShowClearModal = vi.fn();
    const listener = vi.fn();
    window.addEventListener('historyCleared', listener);

    await clearRightRailHistory(setHistory, setShowClearModal);

    expect(setShowClearModal).toHaveBeenCalledWith(false);
    expect(clearHistory).toHaveBeenCalled();
    expect(setHistory).toHaveBeenCalledWith([]);
    expect(listener).toHaveBeenCalled();

    window.removeEventListener('historyCleared', listener);
  });
});

function renderHook(hook) {
  let result;
  const TestComponent = () => (result = hook(), null);
  render(<TestComponent />);
  return { result };
}