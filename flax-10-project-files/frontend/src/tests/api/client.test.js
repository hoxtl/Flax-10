import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchApi } from '../../api/client';

describe('fetchApi', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return json data on success', async () => {
        const mockData = { message: 'success' };
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockData,
        });
        const data = await fetchApi('/test');
        expect(data).toEqual(mockData);
        expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
    });

    it('should return null on 204 No Content', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 204,
        });
        const data = await fetchApi('/test');
        expect(data).toBeNull();
    });

    it('should include headers', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
        });
        await fetchApi('/test', { method: 'POST' });
        expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
            })
        }));
    });

    it('adds Authorization header when token is in localStorage', async () => {
        localStorage.setItem('token', 'abc123');
        global.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
        });
        await fetchApi('/test');
        const callHeaders = global.fetch.mock.calls[0][1].headers;
        expect(callHeaders['Authorization']).toBe('Token abc123');
    });

    it('should throw error on non-ok response with detail', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ detail: 'Validation failed' }),
        });
        await expect(fetchApi('/test')).rejects.toThrow('Validation failed');
    });

    it('should throw error on non-ok response with non_field_errors array', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ non_field_errors: ['Invalid credentials'] }),
        });
        await expect(fetchApi('/test')).rejects.toThrow('Invalid credentials');
    });

    it('should throw error on non-ok response using Object.values fallback when no detail/message/non_field_errors', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ username: ['This field is required.'] }),
        });
        await expect(fetchApi('/test')).rejects.toThrow('This field is required.');
    });

    it('should throw default error on non-ok response without detail', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error('parse error'); },
        });
        await expect(fetchApi('/test')).rejects.toThrow('Request failed');
    });

    it('should throw error on network failure', async () => {
        global.fetch.mockRejectedValue(new Error('Network Error'));
        await expect(fetchApi('/test')).rejects.toThrow('Network Error');
    });

    it('does not set Authorization header when no token', async () => {
        localStorage.removeItem('token');
        await expect(fetchApi('/test')).rejects.toThrow();
    });

    it('does not add Authorization header when no token in localStorage', async () => {
        localStorage.removeItem('token');
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ data: 'ok' }),
        });
        const result = await fetchApi('/test');
        const callHeaders = global.fetch.mock.calls[0][1].headers;
        expect(callHeaders['Authorization']).toBeUndefined();
        expect(result).toEqual({ data: 'ok' });
    });
});

