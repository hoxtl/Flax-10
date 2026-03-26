import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TodayBanner from '../../../components/Timer/TodayBanner';
import analyticsService from '../../../api/analyticsApi';

const statStripSpy = vi.fn();

vi.mock('../../../api/analyticsApi', () => ({
  default: {
    getSummary: vi.fn(),
  },
}));

vi.mock('../../../components/common/stat_strip/StatStrip', () => ({
  default: (props) => {
    statStripSpy(props);
    return <div data-testid="stat-strip" />;
  },
}));

vi.mock('../../../hooks/useCountUp', () => ({
  useCountUp: () => undefined,
}));

vi.mock('../../../components/Timer/utils/historyEvents', () => ({
  listenToTimerHistoryEvents: () => () => {},
}));

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({
  default: {
    todayMetricBanner: 'todayMetricBanner',
  },
}));

describe('TodayBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statStripSpy.mockReset();
  });

  const mockAnalytics = () => {
    analyticsService.getSummary.mockImplementation((days) => Promise.resolve({
      summary: { 1: { total_sessions: 2 }, 7: { active_days: 4 }, 30: { current_streak_days: 5, total_sessions: 12, total_study_hours: 17.5 } }[days],
    }));
  };

  it('renders the stat strip and calls analytics for each range', async () => {
    mockAnalytics();
    render(<TodayBanner />);
    await waitFor(() => expect(screen.getByTestId('stat-strip')).toBeInTheDocument());
    expect(analyticsService.getSummary).toHaveBeenCalledTimes(3);
    [1, 7, 30].forEach(d => expect(analyticsService.getSummary).toHaveBeenCalledWith(d));
  });

  it('passes correctly mapped analytics items to StatStrip', async () => {
    mockAnalytics();
    render(<TodayBanner />);
    await waitFor(() => {
      const { items } = statStripSpy.mock.calls.at(-1)[0];
      expect(items.find(i => i.key === 'streak')).toMatchObject({ value: 5, suffix: 'd' });
      expect(items.find(i => i.key === 'sessions')).toMatchObject({ value: 12 });
      expect(items.find(i => i.key === 'weekly-goal')).toMatchObject({ value: 4 });
      expect(items.find(i => i.key === 'focus-time')).toMatchObject({ value: 17.5 });
    });
  });

  it('propagates streak data to parent callback', async () => {
    mockAnalytics();
    const onStreakData = vi.fn();
    render(<TodayBanner onStreakData={onStreakData} />);
    await waitFor(() => expect(onStreakData).toHaveBeenCalledWith({ current_streak_days: 5, total_sessions: 2 }));
  });
});
