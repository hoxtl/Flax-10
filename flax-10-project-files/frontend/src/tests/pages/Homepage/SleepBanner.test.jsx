import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SleepBanner from '../../../pages/Homepage/components/SleepBanner';

vi.mock('../../../api/userService', () => ({
    getUserSettings: vi.fn(),
}));

vi.mock('../../../components/Settings/hooks/useSleepWarning', () => ({
    isDuringSleepWindow: vi.fn(),
}));

import { getUserSettings } from '../../../api/userService';
import { isDuringSleepWindow } from '../../../components/Settings/hooks/useSleepWarning';

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
        const { container } = render(<SleepBanner />);
        await waitFor(() => {
            expect(screen.getByText('🌙')).toBeTruthy();
        });
        fireEvent.click(screen.getByText('x'));
        expect(container.firstChild).toBeNull();
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
});
