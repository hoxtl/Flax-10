import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSocietyCalendarSync } from '../../components/society/hooks/useSocietyCalendarSync';

const getSyncStatusMock = vi.fn();
const syncCalendarMock = vi.fn();
const unsyncCalendarMock = vi.fn();
const useNotifyMock = vi.fn();
const useTagsMock = vi.fn();

vi.mock('../../api/societyApi', () => ({
  getSyncStatus: (...args) => getSyncStatusMock(...args),
  syncCalendar: (...args) => syncCalendarMock(...args),
  unsyncCalendar: (...args) => unsyncCalendarMock(...args),
}));

vi.mock('../../components/notifications/hooks/useNotify', () => ({
  useNotify: () => useNotifyMock(),
}));

vi.mock('../../context/TagContext', () => ({
  useTags: () => useTagsMock(),
}));

describe('useSocietyCalendarSync', () => {
  let notify;
  let refreshTags;

  beforeEach(() => {
    vi.clearAllMocks();
    notify = vi.fn();
    refreshTags = vi.fn().mockResolvedValue(undefined);
    useNotifyMock.mockReturnValue(notify);
    useTagsMock.mockReturnValue({ refreshTags });
    getSyncStatusMock.mockResolvedValue({ is_synced: true });
    syncCalendarMock.mockResolvedValue({});
    unsyncCalendarMock.mockResolvedValue({});
  });

  it('does not load sync status when societyId is missing', () => {
    const { result } = renderHook(() => useSocietyCalendarSync(null, 'Chess'));

    expect(getSyncStatusMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it('loads sync status and sets loading false', async () => {
    const { result } = renderHook(() => useSocietyCalendarSync(5, 'Chess'));

    await waitFor(() => {
      expect(getSyncStatusMock).toHaveBeenCalledWith(5);
      expect(result.current.isSynced).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles load errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getSyncStatusMock.mockRejectedValueOnce(new Error('load failed'));

    const { result } = renderHook(() => useSocietyCalendarSync(5, 'Chess'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load sync status:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('syncs calendar when currently unsynced', async () => {
    getSyncStatusMock.mockResolvedValueOnce({ is_synced: false });
    const { result } = renderHook(() => useSocietyCalendarSync(7, 'Dance'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleSync();
    });

    expect(syncCalendarMock).toHaveBeenCalledWith(7);
    expect(refreshTags).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Sync Successful', 'Calendar for Dance is now synced!');
    expect(result.current.isSynced).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('unsyncs calendar when currently synced', async () => {
    getSyncStatusMock.mockResolvedValueOnce({ is_synced: true });
    const { result } = renderHook(() => useSocietyCalendarSync(8, 'Music'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleSync();
    });

    expect(unsyncCalendarMock).toHaveBeenCalledWith(8);
    expect(refreshTags).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Unsync Successful', 'Calendar for Music is now unsynced.');
    expect(result.current.isSynced).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('handles toggle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getSyncStatusMock.mockResolvedValueOnce({ is_synced: false });
    syncCalendarMock.mockRejectedValueOnce(new Error('sync failed'));

    const { result } = renderHook(() => useSocietyCalendarSync(9, 'Art'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleSync();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle sync:', expect.any(Error));
    expect(result.current.loading).toBe(false);
    consoleSpy.mockRestore();
  });
});
