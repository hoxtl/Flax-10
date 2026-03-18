import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn().mockResolvedValue({}),
}));

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('throws when used outside provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
        consoleSpy.mockRestore();
    });

    it('defaults to light theme', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.theme).toBe('light');
    });

    it('uses stored theme from localStorage', () => {
        localStorage.setItem('theme', 'dark');
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.theme).toBe('dark');
    });

    it('falls back to initialTheme prop when no stored theme', () => {
        const wrapper = ({ children }) => <ThemeProvider initialTheme="dark">{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.theme).toBe('dark');
    });

    it('ignores invalid stored theme', () => {
        localStorage.setItem('theme', 'invalid-value');
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        expect(result.current.theme).toBe('light');
    });

    it('sets data-theme attribute on documentElement', () => {
        render(<ThemeProvider><div /></ThemeProvider>);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('toggleTheme switches light to dark', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleTheme(); });
        expect(result.current.theme).toBe('dark');
    });

    it('toggleTheme switches dark to light', () => {
        const wrapper = ({ children }) => <ThemeProvider initialTheme="dark">{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleTheme(); });
        expect(result.current.theme).toBe('light');
    });

    it('setTheme changes to specified theme', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.setTheme('dark'); });
        expect(result.current.theme).toBe('dark');
    });

    it('setTheme is a no-op when theme already set', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.setTheme('light'); });
        expect(result.current.theme).toBe('light');
    });

    it('persists theme to localStorage on toggle', () => {
        const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
        const { result } = renderHook(() => useTheme(), { wrapper });
        act(() => { result.current.toggleTheme(); });
        expect(localStorage.getItem('theme')).toBe('dark');
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
});
