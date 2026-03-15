import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useOnboarding from '../../components/Onboarding/hooks/useOnboarding';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockFetch.mockResolvedValue({ ok: true });
    });

    it('initializes with empty year and major', () => {
        const { result } = renderHook(() => useOnboarding());
        expect(result.current.year).toBe('');
        expect(result.current.major).toBe('');
    });

    it('initializes with confirmed=false', () => {
        const { result } = renderHook(() => useOnboarding());
        expect(result.current.confirmed).toBe(false);
    });

    it('initializes with loading=false and done=false', () => {
        const { result } = renderHook(() => useOnboarding());
        expect(result.current.loading).toBe(false);
        expect(result.current.done).toBe(false);
    });

    it('updates year state via setYear', () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => { result.current.setYear('2'); });
        expect(result.current.year).toBe('2');
    });

    it('updates major and resets confirmed via handleMajorChange', () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => { result.current.setConfirmed(true); });
        act(() => { result.current.handleMajorChange('Computer Science'); });
        expect(result.current.major).toBe('Computer Science');
        expect(result.current.confirmed).toBe(false);
    });

    it('does not submit if year is missing', async () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.handleMajorChange('CS');
            result.current.setConfirmed(true);
        });
        await act(async () => { await result.current.handleSubmit(); });
        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.current.done).toBe(false);
    });

    it('does not submit if major is missing', async () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.setYear('2');
            result.current.setConfirmed(true);
        });
        await act(async () => { await result.current.handleSubmit(); });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not submit if not confirmed', async () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.setYear('2');
            result.current.handleMajorChange('CS');
        });
        await act(async () => { await result.current.handleSubmit(); });
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('submits when year, major, and confirmed are all set', async () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.setYear('2');
            result.current.handleMajorChange('CS');
            result.current.setConfirmed(true);
        });
        await act(async () => { await result.current.handleSubmit(); });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.current.done).toBe(true);
    });

    it('sets loading to false after submit', async () => {
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.setYear('2');
            result.current.handleMajorChange('CS');
            result.current.setConfirmed(true);
        });
        await act(async () => { await result.current.handleSubmit(); });
        expect(result.current.loading).toBe(false);
    });

    it('updates localStorage user with year and major after submit', async () => {
        localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));
        const { result } = renderHook(() => useOnboarding());
        act(() => {
            result.current.setYear('3');
            result.current.handleMajorChange('Physics');
            result.current.setConfirmed(true);
        });
        await act(async () => { await result.current.handleSubmit(); });
        const stored = JSON.parse(localStorage.getItem('user'));
        expect(stored.year).toBe('3');
        expect(stored.major).toBe('Physics');
    });
});
