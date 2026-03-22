import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../api/social/socialApi', () => ({
    shareCalendar: vi.fn().mockResolvedValue({}),
    unshareCalendar: vi.fn().mockResolvedValue({}),
}));

import ShareButton from '../../../components/Social/ShareButton';
import { shareCalendar, unshareCalendar } from '../../../api/social/socialApi';

describe('ShareButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows "Share Calendar" when not sharing', () => {
        render(<ShareButton userId={1} initialIsSharing={false} />);
        expect(screen.getByText('Share Calendar')).toBeTruthy();
    });

    it('shows "Shared" when sharing', () => {
        render(<ShareButton userId={1} initialIsSharing={true} />);
        expect(screen.getByText('Shared')).toBeTruthy();
    });

    it('calls shareCalendar when clicked in non-sharing state', async () => {
        render(<ShareButton userId={1} initialIsSharing={false} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(shareCalendar).toHaveBeenCalledWith(1));
    });

    it('calls unshareCalendar when clicked in sharing state', async () => {
        render(<ShareButton userId={2} initialIsSharing={true} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(unshareCalendar).toHaveBeenCalledWith(2));
    });

    it('calls onToggle callback after toggling', async () => {
        const onToggle = vi.fn();
        render(<ShareButton userId={1} initialIsSharing={false} onToggle={onToggle} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
    });

    it('updates to "Shared" after clicking Share Calendar', async () => {
        render(<ShareButton userId={1} initialIsSharing={false} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(screen.getByText('Shared')).toBeTruthy());
    });

    it('updates initialIsSharing via useEffect', () => {
        const { rerender } = render(<ShareButton userId={1} initialIsSharing={false} />);
        rerender(<ShareButton userId={1} initialIsSharing={true} />);
        expect(screen.getByText('Shared')).toBeTruthy();
    });

    it('shows "..." and is disabled when loading', async () => {
        shareCalendar.mockImplementation(() => new Promise(() => {}));
        render(<ShareButton userId={1} initialIsSharing={false} />);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('...')).toBeTruthy();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('stops propagation on click', () => {
        const onParentClick = vi.fn();
        render(
            <div onClick={onParentClick}>
                <ShareButton userId={1} initialIsSharing={false} />
            </div>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('handles API error without throwing', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        shareCalendar.mockRejectedValueOnce(new Error('network error'));
        render(<ShareButton userId={1} initialIsSharing={false} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(errSpy).toHaveBeenCalledWith('Error toggling share status', expect.any(Error)));
        errSpy.mockRestore();
    });

    it('does not call toggleShare when already loading', async () => {
        shareCalendar.mockImplementation(() => new Promise(() => {}));
        render(<ShareButton userId={1} initialIsSharing={false} />);
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(screen.getByText('...')).toBeTruthy());
        fireEvent.click(screen.getByRole('button'));
        expect(shareCalendar).toHaveBeenCalledTimes(1);
    });
});
