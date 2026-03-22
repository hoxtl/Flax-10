import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../api/auth/authApi';

const mockFetch = (data) => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(data),
    });
};

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('register sends POST with user data', async () => {
        mockFetch({ id: 1 });
        const userData = { username: 'testuser', password: 'pass123' };
        const { data, response } = await authService.register(userData);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/register/'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            })
        );
        expect(data).toEqual({ id: 1 });
        expect(response).toBeTruthy();
    });

    it('login sends POST with credentials', async () => {
        mockFetch({ token: 'abc123' });
        const creds = { username: 'testuser', password: 'pass123' };
        const { data } = await authService.login(creds);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/login/'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(creds),
            })
        );
        expect(data).toEqual({ token: 'abc123' });
    });

    it('logout sends POST with Authorization header', async () => {
        localStorage.setItem('token', 'mytoken');
        mockFetch({ detail: 'Logged out.' });
        const { data } = await authService.logout();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/logout/'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Authorization': 'Token mytoken' }),
            })
        );
        expect(data).toEqual({ detail: 'Logged out.' });
    });
});
