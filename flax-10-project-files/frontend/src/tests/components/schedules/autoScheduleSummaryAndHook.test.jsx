import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { AutoScheduleSummary } from '../../../components/schedules/auto/AutoScheduleSummary';
import { useUpcomingDeadlines } from '../../../components/schedules/auto/useUpcomingDeadlines';

vi.mock('../../../api/deadlineApi', () => ({
  getUpcomingDeadlines: vi.fn(),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

import { getUpcomingDeadlines } from '../../../api/deadlineApi';
import { useToast } from '../../../context/ToastContext';

describe('AutoScheduleSummary', () => {
  it('renders the deadline count', () => {
    render(<AutoScheduleSummary deadlines={[{ id: 1 }, { id: 2 }, { id: 3 }]} />);
    expect(screen.getByText(/3 upcoming deadlines/)).toBeInTheDocument();
  });

  it('renders 0 deadlines', () => {
    render(<AutoScheduleSummary deadlines={[]} />);
    expect(screen.getByText(/0 upcoming deadlines/)).toBeInTheDocument();
  });
});

describe('useUpcomingDeadlines', () => {
  let showToast;

  beforeEach(() => {
    vi.clearAllMocks();
    showToast = vi.fn();
    useToast.mockReturnValue(showToast);
  });

  it('loads deadlines on mount', async () => {
    getUpcomingDeadlines.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const { result } = renderHook(() => useUpcomingDeadlines());

    await waitFor(() => expect(result.current.deadlines).toHaveLength(2));
    expect(result.current.showToast).toBe(showToast);
  });

  it('shows error toast and leaves deadlines empty on failure', async () => {
    getUpcomingDeadlines.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useUpcomingDeadlines());

    await waitFor(() => expect(showToast).toHaveBeenCalledWith(
      'Unable to load upcoming deadlines.',
      { variant: 'error' },
    ));
    expect(result.current.deadlines).toEqual([]);
  });
});
