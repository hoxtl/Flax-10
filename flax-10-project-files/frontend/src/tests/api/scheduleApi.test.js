import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSchedules, createSchedule, renameSchedule, deleteSchedule } from '../../api/scheduleApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('scheduleApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSchedules calls GET /schedules/', async () => {
        await getSchedules();
        expect(fetchApi).toHaveBeenCalledWith('/schedules/');
    });

    it('getSchedules returns the value from fetchApi', async () => {
        const mockData = [{ id: 1, title: 'My Schedule' }];
        fetchApi.mockResolvedValueOnce(mockData);
        const result = await getSchedules();
        expect(result).toEqual(mockData);
    });

    it('createSchedule sends POST /schedules/ with serialised payload', async () => {
        const payload = { title: 'Term 1' };
        await createSchedule(payload);
        expect(fetchApi).toHaveBeenCalledWith('/schedules/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    });

    it('renameSchedule sends PATCH /schedules/:id/ with the new title', async () => {
        await renameSchedule(3, 'Spring Term');
        expect(fetchApi).toHaveBeenCalledWith('/schedules/3/', {
            method: 'PATCH',
            body: JSON.stringify({ title: 'Spring Term' }),
        });
    });

    it('deleteSchedule sends DELETE /schedules/:id/', async () => {
        await deleteSchedule(7);
        expect(fetchApi).toHaveBeenCalledWith('/schedules/7/', { method: 'DELETE' });
    });

    it('createSchedule propagates errors from fetchApi', async () => {
        fetchApi.mockRejectedValueOnce(new Error('Server error'));
        await expect(createSchedule({ title: 'Bad' })).rejects.toThrow('Server error');
    });
});
