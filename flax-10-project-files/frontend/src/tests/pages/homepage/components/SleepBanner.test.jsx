<<<<<<< HEAD
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SleepBanner from '../../../../pages/homepage/components/SleepBanner';
import { getUserSettings } from '../../../../api/userApi';
import { isDuringSleepWindow } from '../../../../components/settings/hooks/useSleepWarning';

// Mocks
vi.mock('../../../../api/userApi', () => ({
  getUserSettings: vi.fn(),
}));

vi.mock('../../../../components/settings/hooks/useSleepWarning', () => ({
  isDuringSleepWindow: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('SleepBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not in sleep window', async () => {
    getUserSettings.mockResolvedValue({ sleep_time: '23:00', wake_time: '07:00' });
    isDuringSleepWindow.mockReturnValue(false);

    await act(async () => {
        render(<SleepBanner />);
    });
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });

  it('renders banner when in sleep window', async () => {
    getUserSettings.mockResolvedValue({ sleep_time: '23:00', wake_time: '07:00' });
    isDuringSleepWindow.mockReturnValue(true);

    await act(async () => {
        render(<SleepBanner />);
    });
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeTruthy();
  });

  it('dismisses banner when close button is clicked', async () => {
    getUserSettings.mockResolvedValue({});
    isDuringSleepWindow.mockReturnValue(true);

    await act(async () => {
        render(<SleepBanner />);
    });
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });

  it('handles API error gracefully', async () => {
    getUserSettings.mockRejectedValue(new Error('API Error'));
    await act(async () => {
        render(<SleepBanner />);
    });
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });

  it('uses default sleep times when data is missing', async () => {
    getUserSettings.mockResolvedValue({});
    isDuringSleepWindow.mockReturnValue(false);
    await act(async () => {
        render(<SleepBanner />);
    });
    expect(isDuringSleepWindow).toHaveBeenCalledWith('23:00', '07:00', expect.any(Date));
  });
=======
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import SleepBanner from '../../../../pages/homepage/components/SleepBanner';

vi.mock('../../../../api/userApi', () => ({
    getUserSettings: vi.fn(),
}));

vi.mock('../../../../components/settings/hooks/useSleepWarning', () => ({
    isDuringSleepWindow: vi.fn(),
}));

import { getUserSettings } from '../../../../api/userApi';
import { isDuringSleepWindow } from '../../../../components/settings/hooks/useSleepWarning';

describe('SleepBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when not during sleep window', async () => {
        getUserSettings.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
        isDuringSleepWindow.mockReturnValue(false);
        const { container } = render(<SleepBanner />);
        await waitFor(() => {
            expect(getUserSettings).toHaveBeenCalled();
        });
        expect(container.firstChild).toBeNull();
    });

    it('shows banner during sleep window', async () => {
        getUserSettings.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
        isDuringSleepWindow.mockReturnValue(true);
        render(<SleepBanner />);
        await waitFor(() => {
            expect(screen.getByText('🌙')).toBeTruthy();
        });
    });

    it('shows a sleep message', async () => {
        getUserSettings.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
        isDuringSleepWindow.mockReturnValue(true);
        render(<SleepBanner />);
        await waitFor(() => {
            // One of the MESSAGES should be shown
            const messageEl = screen.getByText(/sleep|bedtime|pillow|brain|night owl|procrastinator/i);
            expect(messageEl).toBeTruthy();
        });
    });

    it('dismisses banner when x is clicked', async () => {
        getUserSettings.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
        isDuringSleepWindow.mockReturnValue(true);
        render(<SleepBanner />);
        await waitFor(() => {
            expect(screen.getByText('🌙')).toBeTruthy();
        });
        fireEvent.click(screen.getByRole('button', { name: /dismiss sleep banner/i }));
        await waitForElementToBeRemoved(() => screen.queryByText('🌙'));
    });

    it('handles getUserSettings error gracefully', async () => {
        getUserSettings.mockRejectedValue(new Error('Network error'));
        const { container } = render(<SleepBanner />);
        await waitFor(() => {
            expect(getUserSettings).toHaveBeenCalled();
        });
        // Should not show banner (no error thrown)
        expect(container.firstChild).toBeNull();
    });

    it('uses default sleep times when data is missing', async () => {
        getUserSettings.mockResolvedValue({});
        isDuringSleepWindow.mockReturnValue(false);
        render(<SleepBanner />);
        await waitFor(() => {
            expect(isDuringSleepWindow).toHaveBeenCalledWith('23:00', '07:00', expect.any(Date));
        });
    });
>>>>>>> main
});
