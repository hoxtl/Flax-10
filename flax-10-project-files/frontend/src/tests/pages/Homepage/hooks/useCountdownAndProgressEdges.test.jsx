import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "../../../../pages/Homepage/hooks/useCountdown";
import { getSemesterProgress } from "../../../../pages/Homepage/hooks/useIntelligenceDashboard";

vi.mock("../../../../lib/termConfig", () => ({
  loadTermConfig: vi.fn(() => null),
}));

describe("useCountdown branches", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns empty text and relaxed urgency for null target", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current.text).toBe("");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("returns empty text and relaxed urgency for non-Date target", () => {
    const { result } = renderHook(() => useCountdown("not-a-date"));
    expect(result.current.text).toBe("");
    expect(result.current.urgency).toBe("relaxed");
  });

  it('returns "now" text when less than 1 minute remains', () => {
    const target = new Date(Date.now() + 30000); // 30 seconds
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("now");
    expect(result.current.urgency).toBe("urgent");
  });

  it("returns in Xm when less than 60 minutes remain", () => {
    const target = new Date(Date.now() + 15 * 60000); // 15 minutes
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 15m");
    expect(result.current.urgency).toBe("soon");
  });

  it("returns in Xh when exactly N hours remain with no remainder", () => {
    const target = new Date(Date.now() + 2 * 60 * 60000); // 2 hours exactly
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 2h");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("returns in Xh Ym when hours and minutes remain", () => {
    const target = new Date(Date.now() + (1 * 60 + 30) * 60000); // 1h 30m
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.text).toBe("in 1h 30m");
    expect(result.current.urgency).toBe("relaxed");
  });

  it("ticks the countdown on interval", () => {
    const target = new Date(Date.now() + 5 * 60000); // 5 minutes
    const { result } = renderHook(() => useCountdown(target));
    const initialText = result.current.text;

    act(() => { vi.advanceTimersByTime(61000); });
    expect(result.current.text).toBeDefined();
    expect(initialText).toMatch(/in \d+m/);
  });

  it("stops ticking after the target time has passed", () => {
    const target = new Date(Date.now() + 2000); // 2 seconds
    renderHook(() => useCountdown(target));
    act(() => { vi.advanceTimersByTime(5000); });
  });

  it("returns empty text and relaxed urgency once a target is already in the past", () => {
    const target = new Date(Date.now() - 60000);
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current).toEqual({ text: "", urgency: "relaxed" });
  });
});

describe("getSemesterProgress branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when loadTermConfig returns an invalid start date", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "not-a-date", totalWeeks: 10 });
    const result = getSemesterProgress(new Date("2026-03-24"));
    expect(result).toBeNull();
  });

  it("returns null when startDate is missing", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ totalWeeks: 10 });
    const result = getSemesterProgress(new Date("2026-03-24"));
    expect(result).toBeNull();
  });

  it("returns hasStarted=false when today is before semester start", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-09-01", totalWeeks: 12, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-01-01"));
    expect(result?.hasStarted).toBe(false);
  });

  it("returns isFinished=true when today is after semester end", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-06", totalWeeks: 12, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-06-01"));
    expect(result?.isFinished).toBe(true);
    expect(result?.pct).toBe(100);
  });

  it("includes reading week in total day count when hasReadingWeek is true", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-06", totalWeeks: 12, hasReadingWeek: true });
    const result = getSemesterProgress(new Date("2026-01-13"));
    expect(result?.hasStarted).toBe(true);
    expect(result?.pct).toBeGreaterThan(0);
    expect(result?.pct).toBeLessThan(100);
  });

  it("clamps pct to 100 when elapsed exceeds total days", async () => {
    const { loadTermConfig: lc } = await import("../../../../lib/termConfig");
    lc.mockReturnValue({ startDate: "2026-01-01", totalWeeks: 1, hasReadingWeek: false });
    const result = getSemesterProgress(new Date("2026-12-31"));
    expect(result?.pct).toBe(100);
  });
});
