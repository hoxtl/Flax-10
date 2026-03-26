import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../api/userApi';
import * as geocodeApi from '../../api/geocodeApi';

const mockFetch = (data, ok = true) => {
    const jsonStr = JSON.stringify(data);
    global.fetch = vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 400,
        json: vi.fn().mockResolvedValue(data),
        text: vi.fn().mockResolvedValue(jsonStr),
    });
};

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');
    });

    it('getUserSettings calls /settings/', async () => {
        mockFetch({ theme: 'dark' });
        await api.getUserSettings();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/settings/'),
            expect.objectContaining({ headers: expect.objectContaining({ 'Authorization': 'Token test-token' }) })
        );
    });

    it('updateUserSettings calls PATCH /settings/', async () => {
        mockFetch({ theme: 'light' });
        await api.updateUserSettings({ theme: 'light' });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/settings/'),
            expect.objectContaining({ method: 'PATCH' })
        );
    });

    it('getUserProfile calls /profile/', async () => {
        mockFetch({ username: 'alice' });
        await api.getUserProfile();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/profile/'),
            expect.any(Object)
        );
    });

    it('getAnotherUserProfile calls /users/:id/profile/', async () => {
        mockFetch({ username: 'bob' });
        await api.getAnotherUserProfile(42);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/users/42/profile/'),
            expect.any(Object)
        );
    });

    it('updateUserProfile calls PATCH /profile/ with formData', async () => {
        mockFetch({ success: true });
        const formData = new FormData();
        await api.updateUserProfile(formData);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/profile/'),
            expect.objectContaining({ method: 'PATCH', body: formData })
        );
    });

    it('getHomeAddress calls /user/home-address/', async () => {
        mockFetch({ address: '10 Downing St' });
        await api.getHomeAddress();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/user/home-address/'),
            expect.any(Object)
        );
    });

    it('saveHomeAddress calls POST /user/home-address/ with coords', async () => {
        mockFetch({ success: true });
        await api.saveHomeAddress('10 Downing St', 51.5, -0.1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/user/home-address/'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    home_address: '10 Downing St',
                    home_latitude: 51.5,
                    home_longitude: -0.1,
                }),
            })
        );
    });

    it('throws when response is not ok', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, json: vi.fn().mockResolvedValue({}), text: vi.fn().mockResolvedValue('{}') });
        await expect(api.getUserSettings()).rejects.toThrow();
    });

    it('searchUsers builds URL with query', async () => {
        mockFetch({ results: [] });
        await api.searchUsers('alice');
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('q=alice'),
            expect.any(Object)
        );
    });

    it('searchUsers with course, society, and year filters', async () => {
        mockFetch({ results: [] });
        await api.searchUsers('alice', 'Computer Science', 'Chess', 0, 20, 'Year 2');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('course=Computer%20Science');
        expect(url).toContain('society=Chess');
        expect(url).toContain('year=Year%202');
    });

    it('searchUsers with roleFilter appends role param', async () => {
        mockFetch({ results: [] });
        await api.searchUsers('bob', '', '', 0, 20, '', 'admin');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('role=admin');
    });

    it('searchUsers with sortBy name-desc uses -name ordering', async () => {
        mockFetch({ results: [] });
        await api.searchUsers('carol', '', '', 0, 20, '', '', 'name-desc');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('ordering=-name');
    });

    it('searchUsers with default sortBy uses name ordering', async () => {
        mockFetch({ results: [] });
        await api.searchUsers('dave');
        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('ordering=name');
    });

    it('getUserSettings unwraps payload.settings when present', async () => {
        const inner = { theme: 'dark', notifications: true };
        mockFetch({ settings: inner });
        const result = await api.getUserSettings();
        expect(result).toEqual(inner);
    });

    it('getUserSettings returns payload directly when settings key is absent', async () => {
        const payload = { theme: 'light' };
        mockFetch(payload);
        const result = await api.getUserSettings();
        expect(result).toEqual(payload);
    });

    describe('geocodeAddress', () => {
        it('returns lat/lng for a valid address', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    features: [{ center: [-0.127758, 51.507351] }],
                }),
            });
            const result = await geocodeApi.geocodeAddress('London');
            expect(result).toEqual({ latitude: 51.507351, longitude: -0.127758 });
        });

        it('returns null when no features', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ features: [] }),
            });
            const result = await geocodeApi.geocodeAddress('NowherePlace');
            expect(result).toBeNull();
        });

        it('throws when geocode fetch fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false });
            await expect(geocodeApi.geocodeAddress('BadAddress')).rejects.toThrow('geocoding has failed');
        });
    });
});
