import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DailyGoalWidget } from '../../../components/timer/presets/DailyGoalWidget';

vi.mock('../../../pages/Timer/TimerPage.module.css', () => ({ default: {} }));

vi.mock('../../../components/timer/utils/timerFormatters', () => ({
  fmtDuration: (secs) => `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`,
}));

const mockGetSummary = vi.fn();
vi.mock('../../../api/analyticsApi', () => ({
  default: { getSummary: (...args) => mockGetSummary(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSummary.mockReset();
  localStorage.clear();
  mockGetSummary.mockResolvedValue({ summary: { total_study_hours: 2 } });
});

describe('DailyGoalWidget', () => {
  it('renders "Today\'s Goal" label', async () => {
    render(<DailyGoalWidget />);
    expect(screen.getByText("Today's Goal")).toBeTruthy();
  });

  it('shows the loading ellipsis initially before analytics resolves', () => {
    mockGetSummary.mockReturnValueOnce(new Promise(() => {}));
    render(<DailyGoalWidget />);
    expect(screen.getByText(/…/)).toBeTruthy();
  });

  it('displays studied hours after analytics loads', async () => {
    mockGetSummary.mockResolvedValueOnce({ summary: { total_study_hours: 3 } });
    render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    // DailyGoalWidget renders studiedText with fmtDuration
    expect(screen.getByText(/of/)).toBeTruthy();
  });

  it('falls back to 0 studied hours when getSummary rejects', async () => {
    mockGetSummary.mockRejectedValueOnce(new Error('fail'));
    render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    expect(screen.getByText('0h 0m of 4h (0%)')).toBeTruthy();
  });

  it('falls back to 0 when getSummary returns null summary', async () => {
    mockGetSummary.mockResolvedValueOnce({ summary: null });
    render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    expect(screen.getByText(/0%/)).toBeTruthy();
  });

  it('reads goalHours from localStorage', async () => {
    localStorage.setItem('timerDailyGoalHours', '8');
    mockGetSummary.mockResolvedValueOnce({ summary: { total_study_hours: 0 } });
    render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    expect(screen.getByRole('button', { name: /8h/i })).toBeTruthy();
  });

  it('defaults to 4h goal when localStorage has no value', async () => {
    render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    expect(screen.getByRole('button', { name: /4h/i })).toBeTruthy();
  });

  it('renders the progress bar fill element', async () => {
    mockGetSummary.mockResolvedValueOnce({ summary: { total_study_hours: 2 } });
    const { container } = render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    // The fill div has inline style width
    const fills = container.querySelectorAll('[style]');
    expect(fills.length).toBeGreaterThan(0);
  });

  it('caps progress at 100% when studied hours exceed goal', async () => {
    localStorage.setItem('timerDailyGoalHours', '1');
    mockGetSummary.mockResolvedValueOnce({ summary: { total_study_hours: 10 } });
    const { container } = render(<DailyGoalWidget />);
    await waitFor(() => expect(screen.queryByText(/…/)).toBeNull());
    expect(screen.getByText(/100%/)).toBeTruthy();
    const fill = container.querySelector('[style]');
    expect(fill.style.width).toBe('100%');
  });
});
