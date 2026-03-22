import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyChart } from '../../../../components/Timer/historyPanel/WeeklyChart';

vi.mock('../../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

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

})