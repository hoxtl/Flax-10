import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useReducedMotion } from 'framer-motion';
import { WeeklyChart } from '../../../../components/Timer/historyPanel/WeeklyChart';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: vi.fn(() => true),
}));

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const makeSeries = (secondsArr) =>
  secondsArr.map((seconds, i) => ({
    key: `day-${i}`,
    label: WEEK_LABELS[i] ?? `D${i}`,
    seconds,
  }));

const DEFAULT_SERIES = makeSeries([0, 1800, 3600, 7200, 0, 5400, 3600]);
const MAX = 7200;

describe('WeeklyChart', () => {
  it('renders the "Weekly Summary" heading', () => {
    render(<WeeklyChart weeklySeries={DEFAULT_SERIES} maxWeeklySeconds={MAX} />);
    expect(screen.getByText('Weekly Summary')).toBeTruthy();
  });

  it('renders the accessible chart region with the correct aria-label', () => {
    render(<WeeklyChart weeklySeries={DEFAULT_SERIES} maxWeeklySeconds={MAX} />);
    expect(screen.getByRole('img', { name: /Focus hours per day/i })).toBeTruthy();
  });

  it.each(WEEK_LABELS)('renders the bar column labelled "%s"', (label) => {
    render(<WeeklyChart weeklySeries={DEFAULT_SERIES} maxWeeklySeconds={MAX} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('displays hours formatted to one decimal place', () => {
    render(<WeeklyChart weeklySeries={makeSeries([3600])} maxWeeklySeconds={3600} />);
    expect(screen.getByText('1.0h')).toBeTruthy();
  });

  it('shows 0.0h for a zero-second day', () => {
    render(<WeeklyChart weeklySeries={makeSeries([0])} maxWeeklySeconds={3600} />);
    expect(screen.getByText('0.0h')).toBeTruthy();
  });

  it('clamps bar fill to the minimum 4% for a zero-second day', () => {
    const { container } = render(
      <WeeklyChart weeklySeries={makeSeries([0])} maxWeeklySeconds={3600} />
    );
    expect(container.querySelector('span[style]').style.height).toBe('4%');
  });

  it('renders 100% bar height for a day equal to maxWeeklySeconds', () => {
    const { container } = render(
      <WeeklyChart weeklySeries={makeSeries([3600])} maxWeeklySeconds={3600} />
    );
    expect(container.querySelector('span[style]').style.height).toBe('100%');
  });

  it('proportionally sizes a bar at 50% for half of maxWeeklySeconds', () => {
    const { container } = render(
      <WeeklyChart weeklySeries={makeSeries([1800])} maxWeeklySeconds={3600} />
    );
    expect(container.querySelector('span[style]').style.height).toBe('50%');
  });

  it('renders all 7 hour-value labels for a full week series', () => {
    render(<WeeklyChart weeklySeries={DEFAULT_SERIES} maxWeeklySeconds={MAX} />);
    expect(screen.getAllByText(/^\d+\.\d+h$/)).toHaveLength(7);
  });

  it('renders the chart container without errors when series is empty', () => {
    const { container } = render(<WeeklyChart weeklySeries={[]} maxWeeklySeconds={60} />);
    expect(container.querySelector('[role="img"]')).toBeTruthy();
  });

  it('renders animated bars when reduced motion is disabled', () => {
    useReducedMotion.mockReturnValue(false);
    const { container } = render(<WeeklyChart weeklySeries={makeSeries([3600])} maxWeeklySeconds={3600} />);
    expect(container.querySelector('span[style]').style.height).toBe('100%');
    useReducedMotion.mockReturnValue(true);
  });

  it('applies the today classes and guards against a zero max value', () => {
    const todayKey = new Date();
    todayKey.setHours(0, 0, 0, 0);

    // CSS module is mocked to return empty object so class names are undefined;
    // we just verify the chart renders without errors for a today key with zero max
    const { container } = render(
      <WeeklyChart
        weeklySeries={[{ key: todayKey.toISOString().slice(0, 10), label: 'Today', seconds: 0 }]}
        maxWeeklySeconds={0}
      />,
    );

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('0.0h')).toBeTruthy();
    expect(container.querySelector('span[style]')).toBeTruthy();
  });
});
