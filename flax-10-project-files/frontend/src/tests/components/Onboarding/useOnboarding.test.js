import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useOnboarding from '../../../components/Onboarding/hooks/useOnboarding';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
  localStorage.setItem('token', 'test-token');
});

describe('useOnboarding', () => {
  it('initialises with empty state', () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.year).toBe('');
    expect(result.current.major).toBe('');
    expect(result.current.confirmed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.done).toBe(false);
  });

  it('handleMajorChange sets major and resets confirmed', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => { result.current.setConfirmed(true); });
    act(() => { result.current.handleMajorChange('Physics'); });
    expect(result.current.major).toBe('Physics');
    expect(result.current.confirmed).toBe(false);
  });

  it('handleSubmit does nothing when fields are missing', async () => {
    const { result } = renderHook(() => useOnboarding());
    await act(async () => { await result.current.handleSubmit(); });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.done).toBe(false);
  });

  it('handleSubmit submits and sets done when all fields are filled', async () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setYear('Year 1');
      result.current.handleMajorChange('Physics');
      result.current.setConfirmed(true);
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(global.fetch).toHaveBeenCalled();
    expect(result.current.done).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('handleSubmit catches and logs fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setYear('Year 1');
      result.current.handleMajorChange('Physics');
      result.current.setConfirmed(true);
    });
    await act(async () => { await result.current.handleSubmit(); });
    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.done).toBe(true);
    consoleSpy.mockRestore();
  });
});
