import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCalendarEvents } from '../../api/calendarApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('calendarApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getCalendarEvents calls /calendar/events/map/', async () => {
        await getCalendarEvents();
        expect(fetchApi).toHaveBeenCalledWith('/calendar/events/map/');
    });

    it('getCalendarEvents returns the value from fetchApi', async () => {
        const mockData = [{ id: 1, title: 'Lecture' }];
        fetchApi.mockResolvedValueOnce(mockData);
        const result = await getCalendarEvents();
        expect(result).toEqual(mockData);
    });

    it('getCalendarEvents propagates errors from fetchApi', async () => {
        fetchApi.mockRejectedValueOnce(new Error('Network error'));
        await expect(getCalendarEvents()).rejects.toThrow('Network error');
    });
});
