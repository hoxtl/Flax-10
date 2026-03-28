import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("../../../../api/analyticsApi", () => ({ default: { getSummary: vi.fn() } }));
import analyticsApi from "../../../../api/analyticsApi";
import { useProfileAnalytics } from "../../../../pages/profile/hooks/useProfileInsights";
describe("useProfileAnalytics", () => {
  const gS = analyticsApi.getSummary;
  beforeEach(() => { vi.clearAllMocks(); });
  it("polls remote profiles periodically", async () => {
    vi.useFakeTimers();
    gS.mockResolvedValue({ heatmap: { data: [] } });
    renderHook(() => useProfileAnalytics(true));
    expect(gS).toHaveBeenCalledWith(90);
    vi.advanceTimersByTime(300000); // 5 mins in implementation
    vi.useRealTimers();
  });

  it("initializes with null data", () => {
    const { result } = renderHook(() => useProfileAnalytics(false));
    expect(result.current).toBeNull();
  });

  it("handles fetch error", async () => {
    gS.mockRejectedValueOnce(new Error("err"));
    const { result } = renderHook(() => useProfileAnalytics(true));
    await waitFor(() => expect(gS).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
