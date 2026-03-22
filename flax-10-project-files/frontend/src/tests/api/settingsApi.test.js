import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patchSettings, saveUserToStorage, clearAuthAndRedirect, hasToken } from '../../api/user/settingsApi';

describe('settingsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('patchSettings makes PATCH request and returns { ok, data }', async () => {
        localStorage.setItem('token', 'tok123');
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ theme: 'dark' }),
        });
        const result = await patchSettings({ theme: 'dark' });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/settings/'),
            expect.objectContaining({
                method: 'PATCH',
                headers: expect.objectContaining({ 'Authorization': 'Token tok123' }),
                body: JSON.stringify({ theme: 'dark' }),
            })
        );
        expect(result).toEqual({ ok: true, data: { theme: 'dark' } });
    });

    it('patchSettings returns ok: false when response not ok', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: vi.fn().mockResolvedValue({ error: 'Bad Request' }),
        });
        const result = await patchSettings({});
        expect(result.ok).toBe(false);
    });

    it('saveUserToStorage stores user in localStorage', () => {
        const user = { id: 1, name: 'Test User' };
        saveUserToStorage(user);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    });

    it('clearAuthAndRedirect removes token and user and redirects to /login', () => {
        localStorage.setItem('token', 'tok');
        localStorage.setItem('user', '{}');
        delete window.location;
        window.location = { href: '' };
        clearAuthAndRedirect();
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(window.location.href).toBe('/login');
    });

    it('hasToken returns true when token is set', () => {
        localStorage.setItem('token', 'abc');
        expect(hasToken()).toBe(true);
    });

    it('hasToken returns false when no token', () => {
        expect(hasToken()).toBe(false);
    });
});
