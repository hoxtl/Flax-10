import { describe,it, expect, beforeEach, vi } from "vitest";

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('readingApi', () => {
    let fetchApi;
    let api;
    
    beforeEach(async () => {
        vi.clearAllMocks();
        fetchApi =(await import('../../api/client')).fetchApi;
        api = await import('../../api/tasks/readingApi');
    });

    it('should get readings for a module', async () => {
        await api.getReadings(1);
        expect(fetchApi).toHaveBeenCalledWith('/modules/1/readings/');
    });

    it('should create a reading for a module', async () => {
        const data = { title: 'Ch.1', start_page: 13, end_page: 63};
        await api.createReading(1, data);
        expect (fetchApi).toHaveBeenCalledWith('/modules/1/readings/', expect.objectContaining({method: 'POST'}));
    });

    it('should update a reading', async () => {
        const data = {title: 'Updated'};
        await api.updateReading(1, 12, data);
        expect (fetchApi).toHaveBeenCalledWith('/modules/1/readings/12/', expect.objectContaining({method: 'PUT'}));
    });

    it('should delete a reading', async () => {
        await api.deleteReading(1, 12);
        expect (fetchApi).toHaveBeenCalledWith('/modules/1/readings/12/', expect.objectContaining({method: 'DELETE'}));
    });

    it('should convert a reading to a task', async () => {
        await api.convertReadingToTask(12);
        expect (fetchApi).toHaveBeenCalledWith('/readings/12/load-task/', expect.objectContaining({method: 'POST'}));
    });

    it('should get the reading speed ', async () => {
        await api.getReadingSpeed();
        expect (fetchApi).toHaveBeenCalledWith('/readings/speed/');
    });

    it('should get suggested readings ', async () => {
        await api.getSuggestedReadings();
        expect (fetchApi).toHaveBeenCalledWith('/readings/suggested/');
    });


});