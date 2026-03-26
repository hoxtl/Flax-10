import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthenticationContext';
import * as userApi from '../../api/userApi';

vi.mock('../../api/userApi', () => ({
    getUserProfile: vi.fn(),
}));

function TestConsumer() {
    const { user, profile, loading, authenticated, refreshProfile, setAuthenticated } = useAuth();
    return (
        <div>
            <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
            <span data-testid="profile">{profile ? JSON.stringify(profile) : 'null'}</span>
            <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
            <span data-testid="authenticated">{authenticated ? 'yes' : 'no'}</span>
            <button onClick={refreshProfile}>Refresh</button>
            <button onClick={() => setAuthenticated(false)}>Logout</button>
        </div>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should provide initial unauthenticated state when no token', async () => {
        userApi.getUserProfile.mockResolvedValue(null);
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });

    it('should read stored user from localStorage on mount', async () => {
        const stored = { id: 1, name: 'Alice' };
        localStorage.setItem('user', JSON.stringify(stored));
        userApi.getUserProfile.mockResolvedValue(null);
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('user')).toHaveTextContent('Alice');
    });

    it('should return null user when localStorage has invalid JSON', async () => {
        localStorage.setItem('user', 'not-valid-json{{{');
        userApi.getUserProfile.mockResolvedValue(null);
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should return null user when localStorage has no stored user', async () => {
        userApi.getUserProfile.mockResolvedValue(null);
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('should be authenticated when token exists in localStorage', async () => {
        localStorage.setItem('token', 'abc123');
        userApi.getUserProfile.mockResolvedValue({ id: 1, name: 'Bob' });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    it('should load profile on mount when authenticated', async () => {
        localStorage.setItem('token', 'abc123');
        userApi.getUserProfile.mockResolvedValue({ id: 1, name: 'Alice', role: 'student' });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('profile')).toHaveTextContent('Alice');
    });

    it('should merge profile into user and persist in localStorage', async () => {
        localStorage.setItem('token', 'abc123');
        localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Old' }));
        userApi.getUserProfile.mockResolvedValue({ id: 1, name: 'New', role: 'admin' });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        const stored = JSON.parse(localStorage.getItem('user'));
        expect(stored.name).toBe('New');
        expect(stored.role).toBe('admin');
    });

    it('should handle profile refresh failure gracefully', async () => {
        localStorage.setItem('token', 'abc123');
        userApi.getUserProfile.mockRejectedValue(new Error('API down'));
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(screen.getByTestId('profile')).toHaveTextContent('null');
    });

    it('should stop loading without calling profile when not authenticated', async () => {
        userApi.getUserProfile.mockResolvedValue({ id: 1 });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        expect(userApi.getUserProfile).not.toHaveBeenCalled();
    });

    it('should refresh profile on demand', async () => {
        localStorage.setItem('token', 'token1');
        userApi.getUserProfile
            .mockResolvedValueOnce({ id: 1, name: 'First' })
            .mockResolvedValueOnce({ id: 1, name: 'Refreshed' });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        await act(async () => { screen.getByText('Refresh').click(); });
        await waitFor(() => expect(screen.getByTestId('profile')).toHaveTextContent('Refreshed'));
    });

    it('should listen to auth-changed event and update authenticated state', async () => {
        localStorage.setItem('token', 'token1');
        userApi.getUserProfile.mockResolvedValue({ id: 1 });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));

        // Remove token and fire auth-changed event
        localStorage.removeItem('token');
        await act(async () => {
            window.dispatchEvent(new Event('auth-changed'));
        });
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });

    it('should clear user and profile on auth-changed when token removed', async () => {
        localStorage.setItem('token', 'token1');
        localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice' }));
        userApi.getUserProfile.mockResolvedValue({ id: 1, name: 'Alice' });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('profile')).not.toHaveTextContent('null'));

        localStorage.removeItem('token');
        await act(async () => {
            window.dispatchEvent(new Event('auth-changed'));
        });
        expect(screen.getByTestId('profile')).toHaveTextContent('null');
    });

    it('should remain authenticated on auth-changed when token still present', async () => {
        localStorage.setItem('token', 'token1');
        userApi.getUserProfile.mockResolvedValue({ id: 1 });
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('yes'));

        await act(async () => {
            window.dispatchEvent(new Event('auth-changed'));
        });
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    it('should clean up auth-changed event listener on unmount', async () => {
        userApi.getUserProfile.mockResolvedValue(null);
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('auth-changed', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('throws when useAuth used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
        consoleSpy.mockRestore();
    });

    it('should not set profile when profile data is null from API', async () => {
        localStorage.setItem('token', 'abc');
        userApi.getUserProfile.mockResolvedValue(null);
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );
        await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
        // Profile set to null, user unchanged (mergeStoredUser not called for null data)
        expect(screen.getByTestId('profile')).toHaveTextContent('null');
    });
});
