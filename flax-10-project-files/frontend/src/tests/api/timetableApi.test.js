import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/calendar/timetableApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('timetableApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('importTimetable sends POST with source_url', async () => {
        await api.importTimetable('https://example.com/timetable.ics');
        expect(fetchApi).toHaveBeenCalledWith('/timetable/import/', {
            method: 'POST',
            body: JSON.stringify({ source_url: 'https://example.com/timetable.ics' }),
        });
    });
});
