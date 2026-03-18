import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('deadlineApi', () => {
    let fetchApi;
    let api;

    beforeEach(async () => {
        vi.clearAllMocks();
        fetchApi = (await import('../../api/client')).fetchApi;
        api = await import('../../api/deadlineApi');
    });

    it('should get deadlines', async () => {
        await api.getDeadlines(1);
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/deadlines/');
    });

    it('should create deadlines', async () => {
        await api.createDeadline(1, { title: 'CW1' });
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/deadlines/', expect.objectContaining({ method: 'POST' }));
    });

    it('should update deadline', async () => {
        await api.updateDeadline(1, 1, { title: 'Updated' });
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/deadlines/1/', expect.objectContaining({ method: 'PUT' }));
    });

    it('should delete deadline', async () => {
        await api.deleteDeadline(1, 1);
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/deadlines/1/', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should return upcoming deadlines', async () => {
        await api.getUpcomingDeadlines();
        expect(fetchApi).toHaveBeenCalledWith('/deadlines/upcoming/');
    });
});