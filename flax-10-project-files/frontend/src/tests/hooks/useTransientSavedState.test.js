import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTransientSavedState } from "../../components/common/hooks/useTransientSavedState";

describe("useTransientSavedState", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays false until a save signal is provided, then clears after the duration", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ signal, duration }) => useTransientSavedState(signal, duration),
      { initialProps: { signal: 0, duration: 100 } },
    );

    expect(result.current).toBe(false);

    rerender({ signal: 1, duration: 100 });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("refreshes the timeout when a new signal is provided", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ s }) => useTransientSavedState(s, 100), { initialProps: { s: 1 } });
    expect(result.current).toBe(true);
    act(() => { vi.advanceTimersByTime(50); });
    rerender({ s: 2 });
    expect(result.current).toBe(true);
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current).toBe(true);
  });

  it("clears the state after the refreshed timeout expires", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ s }) => useTransientSavedState(s, 100), { initialProps: { s: 1 } });
    act(() => { vi.advanceTimersByTime(50); });
    rerender({ s: 2 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe(false);
  });
});
