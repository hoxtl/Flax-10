import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useSleepWarning, isDuringSleepWindow } from '../../components/Settings/hooks/useSleepWarning';

const makeDate = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };

describe('isDuringSleepWindow', () => {
  const sleep = '23:00', wake = '07:00';

  it('returns true at 02:00', () => expect(isDuringSleepWindow(sleep, wake, makeDate(2))).toBe(true));
  it('returns true at 23:00', () => expect(isDuringSleepWindow(sleep, wake, makeDate(23))).toBe(true));
  it('returns true at 06:59', () => expect(isDuringSleepWindow(sleep, wake, makeDate(6, 59))).toBe(true));
  it('returns false at 07:00', () => expect(isDuringSleepWindow(sleep, wake, makeDate(7))).toBe(false));
  it('returns false at 12:00', () => expect(isDuringSleepWindow(sleep, wake, makeDate(12))).toBe(false));
  it('returns false at 22:59', () => expect(isDuringSleepWindow(sleep, wake, makeDate(22, 59))).toBe(false));
});

describe('useSleepWarning', () => {
  const settings = { sleep_time: '23:00', wake_time: '07:00' };
  const makeSleepDate = () => makeDate(2);
  const makeAwakeDate = () => makeDate(10);

  it('runs action immediately when outside sleep window', () => {
    const { result } = renderHook(() => useSleepWarning(settings));
    const action = vi.fn();
    act(() => { result.current.checkSleepAndRun(makeAwakeDate(), action); });
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.sleepWarning).toBe(false);
  });

  it('shows warning and does NOT run action during sleep window', () => {
    const { result } = renderHook(() => useSleepWarning(settings));
    const action = vi.fn();
    act(() => { result.current.checkSleepAndRun(makeSleepDate(), action); });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.sleepWarning).toBe(true);
  });

  it('runs action after confirm', () => {
    const { result } = renderHook(() => useSleepWarning(settings));
    const action = vi.fn();
    act(() => { result.current.checkSleepAndRun(makeSleepDate(), action); });
    act(() => { result.current.sleepWarningProps.onConfirm(); });
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.sleepWarning).toBe(false);
  });

  it('dismisses without running action on cancel', () => {
    const { result } = renderHook(() => useSleepWarning(settings));
    const action = vi.fn();
    act(() => { result.current.checkSleepAndRun(makeSleepDate(), action); });
    act(() => { result.current.sleepWarningProps.onCancel(); });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.sleepWarning).toBe(false);
  });

  it('handles null settings with defaults', () => {
    const { result } = renderHook(() => useSleepWarning(null));
    const action = vi.fn();
    act(() => { result.current.checkSleepAndRun(makeSleepDate(), action); });
    expect(result.current.sleepWarning).toBe(true);
  });
});
