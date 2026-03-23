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

vi.mock('../../../components/common/StatStrip/StatStrip', () => ({
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

  it('renders the shared analytics stat strip with seeded summary ranges', async () => {
    analyticsService.getSummary.mockImplementation((days) => Promise.resolve({
      summary: {
        1: { total_sessions: 2 },
        7: { active_days: 4 },
        30: { current_streak_days: 5, total_sessions: 12, total_study_hours: 17.5 },
      }[days],
    }));

    const onStreakData = vi.fn();
    render(<TodayBanner onStreakData={onStreakData} />);

    await waitFor(() => expect(screen.getByTestId('stat-strip')).toBeInTheDocument());

    expect(analyticsService.getSummary).toHaveBeenCalledTimes(3);
    expect(analyticsService.getSummary).toHaveBeenCalledWith(1);
    expect(analyticsService.getSummary).toHaveBeenCalledWith(7);
    expect(analyticsService.getSummary).toHaveBeenCalledWith(30);

    const { items } = statStripSpy.mock.calls.at(-1)[0];
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'streak', value: 5, suffix: 'd' }),
      expect.objectContaining({ key: 'sessions', value: 12 }),
      expect.objectContaining({ key: 'weekly-goal', value: 4, suffix: ' / 7' }),
      expect.objectContaining({ key: 'focus-time', value: 17.5, suffix: 'h' }),
    ]));
    expect(onStreakData).toHaveBeenCalledWith({ current_streak_days: 5, total_sessions: 2 });
  });
});
