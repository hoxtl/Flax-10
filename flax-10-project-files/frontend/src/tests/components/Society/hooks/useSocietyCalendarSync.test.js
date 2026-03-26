import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyCalendarSync } from '../../../../components/society/hooks/useSocietyCalendarSync';
import * as api from '../../../../api/societyApi';
import { useNotify } from '../../../../components/notifications/hooks/useNotify';
import { useTags } from '../../../../context/TagContext';

vi.mock('../../../../api/societyApi', () => ({
    getSyncStatus: vi.fn(),
    syncCalendar: vi.fn(),
    unsyncCalendar: vi.fn()
}));

vi.mock('../../../../components/notifications/hooks/useNotify', () => ({
    useNotify: vi.fn(() => vi.fn())
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ refreshTags: vi.fn() }))
}));

describe('useSocietyCalendarSync', () => {
    const mockId = 1;
    let notify, refreshTags;

    beforeEach(() => {
        vi.clearAllMocks();
        notify = vi.fn();
        useNotify.mockReturnValue(notify);
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
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.getSyncStatus.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});
        expect(spy).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        spy.mockRestore();
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
        expect(notify).toHaveBeenCalledWith('Unsync Successful', expect.any(String));
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
        expect(notify).toHaveBeenCalledWith('Sync Successful', expect.any(String));
    });

    it('toggleSync handles error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useSocietyCalendarSync(mockId, 'Soc'));
        await act(async () => {});
        
        api.syncCalendar.mockRejectedValue(new Error('toggle fail'));
        await act(async () => {
            await result.current.toggleSync();
        });
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('does not load if id is missing', () => {
        renderHook(() => useSocietyCalendarSync(null, 'Soc'));
        expect(api.getSyncStatus).not.toHaveBeenCalled();
    });
});
