import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn().mockResolvedValue({}),
}));

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-mode');
        document.documentElement.removeAttribute('data-theme');
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
        vi.useRealTimers();
    });

    it('throws when used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
        consoleSpy.mockRestore();
    });

    it('defaults to light mode and flax theme', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.mode).toBe('light');
        expect(result.current.theme).toBe('flax');
    });

    it('uses stored mode from localStorage', () => {
        localStorage.setItem('mode', 'dark');
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.mode).toBe('dark');
    });

    it('falls back to initialMode prop when no stored mode', () => {
        const wrapper = ({ children }) => <ThemeProvider initialMode="dark">{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.mode).toBe('dark');
    });

    it('ignores invalid stored mode', () => {
        localStorage.setItem('mode', 'invalid-value');
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.mode).toBe('light');
    });

    it('sets data-mode and data-theme attributes on documentElement', () => {
        act(() => {
            render(<ThemeProvider><div /></ThemeProvider>);
        });
        expect(document.documentElement.getAttribute('data-mode')).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('flax');
    });

    it('toggleMode switches light to dark', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleMode(); });
        expect(result.current.mode).toBe('dark');
    });

    it('toggleMode switches dark to light', () => {
        const wrapper = ({ children }) => <ThemeProvider initialMode="dark">{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleMode(); });
        expect(result.current.mode).toBe('light');
    });

    it('setTheme changes to specified palette theme', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.setTheme('coral'); });
        expect(result.current.theme).toBe('coral');
    });

    it('setTheme is a no-op when theme already set', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.setTheme('flax'); });
        expect(result.current.theme).toBe('flax');
    });

    it('persists mode to localStorage on toggle', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleMode(); });
        expect(localStorage.getItem('mode')).toBe('dark');
    });

    it('registers and cleans up beforeunload listener', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = render(<ThemeProvider><div /></ThemeProvider>);
        expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('logs a theme session on unload after at least one minute and ignores invalid theme changes', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-25T09:00:00.000Z'));

        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => {
            result.current.setTheme('not-a-theme');
        });
        expect(result.current.theme).toBe('flax');

        act(() => {
            vi.setSystemTime(new Date('2026-03-25T09:02:00.000Z'));
            window.dispatchEvent(new Event('beforeunload'));
        });

        expect(fetchApi).toHaveBeenCalledWith(
            '/analytics/theme-session/',
            expect.objectContaining({ method: 'POST' }),
        );
    });
});
