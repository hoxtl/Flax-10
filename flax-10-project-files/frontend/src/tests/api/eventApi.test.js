import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/eventApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('eventApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getEvents with no params calls /events/', async () => {
        await api.getEvents();
        expect(fetchApi).toHaveBeenCalledWith('/events/');
    });

    it('getEvents with params builds query string', async () => {
        await api.getEvents({ start: '2026-01-01', end: '2026-01-31' });
        expect(fetchApi).toHaveBeenCalledWith('/events/?start=2026-01-01&end=2026-01-31');
    });

    it('getEvents filters out falsy params', async () => {
        await api.getEvents({ start: '2026-01-01', end: '' });
        expect(fetchApi).toHaveBeenCalledWith('/events/?start=2026-01-01');
    });

    it('getEvents filters out all falsy values and preserves truthy numeric values', async () => {
        await api.getEvents({ start: null, end: undefined, page: 2, q: 0, search: false });
        expect(fetchApi).toHaveBeenCalledWith('/events/?page=2');
    });

    it('createEvent sends POST with JSON body', async () => {
        const data = { title: 'Test Event' };
        await api.createEvent(data);
        expect(fetchApi).toHaveBeenCalledWith('/events/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    });

    it('updateEvent sends PUT with id and JSON body', async () => {
        const data = { title: 'Updated' };
        await api.updateEvent(42, data);
        expect(fetchApi).toHaveBeenCalledWith('/events/42/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    });

    it('deleteEvent sends DELETE', async () => {
        await api.deleteEvent(42);
        expect(fetchApi).toHaveBeenCalledWith('/events/42/', {
            method: 'DELETE',
        });
    });

    it('addExceptionDate sends POST with date', async () => {
        await api.addExceptionDate(5, '2026-01-15');
        expect(fetchApi).toHaveBeenCalledWith('/events/5/exception/', {
            method: 'POST',
            body: JSON.stringify({ date: '2026-01-15' }),
        });
    });
});
