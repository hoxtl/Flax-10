import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importTimetable } from '../../api/timetableApi';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

import { fetchApi } from '../../api/client';

describe('importTimetable', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls fetchApi with correct endpoint, method and body', async () => {
        fetchApi.mockResolvedValue({ success: true });
        const result = await importTimetable('https://example.com/timetable.ics');
        expect(fetchApi).toHaveBeenCalledWith('/timetable/import/', {
            method: 'POST',
            body: JSON.stringify({ source_url: 'https://example.com/timetable.ics' }),
        });
        expect(result).toEqual({ success: true });
    });
});
