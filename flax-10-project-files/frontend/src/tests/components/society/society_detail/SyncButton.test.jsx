import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../components/society/hooks/useSocietyCalendarSync', () => ({
    useSocietyCalendarSync: vi.fn(() => ({ isSynced: false, loading: false, toggleSync: vi.fn() })),
}));

import SyncButton from '../../../../components/society/society_detail/tabs/calendar_tab/SyncButton';
import { useSocietyCalendarSync } from '../../../../components/society/hooks/useSocietyCalendarSync';

describe('SyncButton', () => {
    it('shows "Sync to Calendar" when not synced', () => {
        render(<SyncButton societyId={1} societyName="KCL Chess" />);
        expect(screen.getByText('Sync to Calendar')).toBeTruthy();
    });

    it('shows "✓ Synced" when synced', () => {
        useSocietyCalendarSync.mockReturnValue({ isSynced: true, loading: false, toggleSync: vi.fn() });
        render(<SyncButton societyId={1} societyName="KCL Chess" />);
        expect(screen.getByText('✓ Synced')).toBeTruthy();
    });

    it('shows "..." while loading', () => {
        useSocietyCalendarSync.mockReturnValue({ isSynced: false, loading: true, toggleSync: vi.fn() });
        render(<SyncButton societyId={1} societyName="KCL Chess" />);
        expect(screen.getByText('...')).toBeTruthy();
    });

    it('disables button while loading', () => {
        useSocietyCalendarSync.mockReturnValue({ isSynced: false, loading: true, toggleSync: vi.fn() });
        render(<SyncButton societyId={1} societyName="KCL Chess" />);
        expect(screen.getByRole('button').disabled).toBe(true);
    });

    it('calls toggleSync on click', () => {
        const toggleSync = vi.fn();
        useSocietyCalendarSync.mockReturnValue({ isSynced: false, loading: false, toggleSync });
        render(<SyncButton societyId={1} societyName="KCL Chess" />);
        fireEvent.click(screen.getByRole('button'));
        expect(toggleSync).toHaveBeenCalledOnce();
    });
});
