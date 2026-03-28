import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParamsMock = vi.fn();
const setSearchParams = vi.fn();

vi.mock("react-router-dom", () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

import { useAnalyticsPageState } from "../../../pages/analytics/hooks/pageState";

describe("useAnalyticsPageState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to default period and tab for invalid search params", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("period=11&tab=Unknown"), setSearchParams]);

    const { result } = renderHook(() => useAnalyticsPageState());

    expect(result.current.period).toBe(30);
    expect(result.current.activeTab).toBe("Overview");
  });

  it("updates search params when the period changes", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("period=30&tab=Overview"), setSearchParams]);

    const { result } = renderHook(() => useAnalyticsPageState());

    act(() => {
      result.current.handlePeriodChange(90);
    });

    expect(result.current.period).toBe(90);
    expect(setSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true },
    );
    const params = setSearchParams.mock.calls[0][0];
    expect(params.get("period")).toBe("90");
    expect(params.get("tab")).toBe("Overview");
  });

  it("updates search params when the tab changes", () => {
    useSearchParamsMock.mockReturnValue([new URLSearchParams("period=7&tab=Overview"), setSearchParams]);

    const { result } = renderHook(() => useAnalyticsPageState());

    act(() => {
      result.current.handleTabChange("AI Insights");
    });

    expect(result.current.activeTab).toBe("AI Insights");
    const params = setSearchParams.mock.calls[0][0];
    expect(params.get("period")).toBe("7");
    expect(params.get("tab")).toBe("AI Insights");
  });
});
