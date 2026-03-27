import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getHistory, saveSession, clearHistory } from '../../components/timer/utils/historyUtils';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('historyUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('getHistory calls API', async () => {
        fetchApi.mockResolvedValueOnce([{ id: 1 }]);
        const history = await getHistory();
        expect(fetchApi).toHaveBeenCalledWith('/timer/history/');
        expect(history).toEqual([{ id: 1 }]);
    });

    it('getHistory returns empty array on error', async () => {
        fetchApi.mockRejectedValueOnce(new Error('Network error'));
        const history = await getHistory();
        expect(history).toEqual([]);
    });

    it('getHistory normalises paginated and nested response shapes', async () => {
        fetchApi.mockResolvedValueOnce({ results: [{ id: 2 }] });
        await expect(getHistory()).resolves.toEqual([{ id: 2 }]);

        fetchApi.mockResolvedValueOnce({ data: [{ id: 3 }] });
        await expect(getHistory()).resolves.toEqual([{ id: 3 }]);

        fetchApi.mockResolvedValueOnce({ unexpected: true });
        await expect(getHistory()).resolves.toEqual([]);
    });

    it('saveSession calls API with correct payload', async () => {
        const mockNow = new Date('2026-02-15T12:00:00Z');
        vi.setSystemTime(mockNow);
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        await saveSession(25, 5, 1, 12345, 'Task');

        expect(fetchApi).toHaveBeenCalledWith('/timer/history/', {
            method: 'POST',
            body: expect.stringMatching(/"duration":25/)
        });

        const callArgs = fetchApi.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        expect(body).toMatchObject({
            duration: 25, break_duration: 5, session_count: 1,
            study_block_id: 12345, task: 'Task', status: 'Completed',
            end_time: mockNow.toISOString()
        });
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'timerHistoryUpdated' }));
        dispatchSpy.mockRestore();
    });

    it('clearHistory calls API', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        await clearHistory();
        expect(fetchApi).toHaveBeenCalledWith('/timer/history/clear_history/', { method: 'DELETE' });
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'timerHistoryUpdated' }));
        dispatchSpy.mockRestore();
    });

    it('uses the default task value and skips window events when window is unavailable', async () => {
        vi.stubGlobal('window', undefined);

        await saveSession(15, 3, 2, 222);
        expect(fetchApi).toHaveBeenCalledWith('/timer/history/', {
            method: 'POST',
            body: expect.stringContaining('"task":""')
        });

        fetchApi.mockClear();
        await clearHistory();
        expect(fetchApi).toHaveBeenCalledWith('/timer/history/clear_history/', { method: 'DELETE' });

        vi.unstubAllGlobals();
    });
});
