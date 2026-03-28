import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyCalendarSync } from '../../../../components/society/hooks/useSocietyCalendarSync';
import * as api from '../../../../api/societyApi';
import { useTags } from '../../../../context/TagContext';
import { useToast } from '../../../../context/ToastContext';

vi.mock('../../../../api/societyApi', () => ({
    getSyncStatus: vi.fn(),
    syncCalendar: vi.fn(),
    unsyncCalendar: vi.fn()
}));

vi.mock('../../../../context/ToastContext', () => ({
    useToast: vi.fn(() => vi.fn())
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ refreshTags: vi.fn() }))
}));

describe('useSocietyCalendarSync', () => {
    const mockId = 1;
    let showToast, refreshTags;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue(showToast);
        refreshTags = vi.fn();
        useTags.mockReturnValue({ refreshTags });
        api.getSyncStatus.mockResolvedValue({ is_synced: false });
    });

    it('loads sync status on mount', async () => {
        api.getSyncStatus.mockResolvedValue({ is_synced: true });
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        expect(result.current.loading).toBe(true);
        await act(async () => {});
        expect(api.getSyncStatus).toHaveBeenCalledWith(mockId);
        expect(result.current.isSynced).toBe(true);
        expect(result.current.loading).toBe(false);
    });

    it('handles load error', async () => {
        api.getSyncStatus.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});
        expect(result.current.isSynced).toBe(false);
        expect(result.current.loading).toBe(false);
    });

    it('toggleSync unsyncs when already synced', async () => {
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {}); // load is_synced: false
        
        // Mock as synced for toggle
        api.getSyncStatus.mockResolvedValue({ is_synced: true });
        const { result: syncedHook } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});

        api.unsyncCalendar.mockResolvedValue({});
        await act(async () => {
            await syncedHook.current.toggleSync();
        });
        expect(api.unsyncCalendar).toHaveBeenCalledWith(mockId);
        expect(syncedHook.current.isSynced).toBe(false);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('unsynced'), expect.objectContaining({ title: 'Unsync Successful' }));
    });

    it('toggleSync syncs when not synced', async () => {
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});
        
        api.syncCalendar.mockResolvedValue({});
        await act(async () => {
            await result.current.toggleSync();
        });
        expect(api.syncCalendar).toHaveBeenCalledWith(mockId);
        expect(result.current.isSynced).toBe(true);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('synced'), expect.objectContaining({ title: 'Sync Successful' }));
    });

    it('toggleSync handles error', async () => {
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});
        
        api.syncCalendar.mockRejectedValue(new Error('toggle fail'));
        await act(async () => {
            await result.current.toggleSync();
        });
        expect(api.syncCalendar).toHaveBeenCalledWith(mockId);
        expect(result.current.isSynced).toBe(false);
    });

    it('does not load if id is missing', () => {
        renderHook(() => useSocietyCalendarSync(null, 'Soc'));
        expect(api.getSyncStatus).not.toHaveBeenCalled();
    });
});
