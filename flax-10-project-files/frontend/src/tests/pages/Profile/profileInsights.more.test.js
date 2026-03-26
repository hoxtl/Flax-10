import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const analyticsSummaryMock = vi.fn();
const fetchApiMock = vi.fn();

vi.mock("../../../api/analyticsApi", () => ({
  default: {
    getSummary: (...args) => analyticsSummaryMock(...args),
  },
}));

vi.mock("../../../api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import {
  saveWeeklyGoal,
  useCurrentUserSummary,
  usePeakHour,
  useProfileAnalytics,
  useSuggestionState,
} from "../../../pages/Profile/hooks/useProfileInsights";

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("profile insights more", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps analytics null when loading fails or viewing is disabled", async () => {
    analyticsSummaryMock.mockRejectedValueOnce(new Error("nope"));

    const { result: enabled } = renderHook(() => useProfileAnalytics(true));
    await flushEffects();
    expect(enabled.current).toBeNull();
    expect(analyticsSummaryMock).toHaveBeenCalledWith(90);

    renderHook(() => useProfileAnalytics(false));
    expect(analyticsSummaryMock).toHaveBeenCalledTimes(1);
  });

  it("loads analytics successfully when viewing is enabled", async () => {
    analyticsSummaryMock.mockResolvedValueOnce({ heatmap: { data: [[1]] } });

    const { result } = renderHook(() => useProfileAnalytics(true));
    await flushEffects();

    expect(result.current).toEqual({ heatmap: { data: [[1]] } });
  });

  it("returns null peak hour for empty heatmaps and all-zero totals", () => {
    const { result: empty } = renderHook(() => usePeakHour([]));
    expect(empty.current).toBeNull();

    const { result: zeroes } = renderHook(() => usePeakHour([[0, 0, 0], [0, 0, 0]]));
    expect(zeroes.current).toBeNull();
  });

  it("does not fetch the current-user summary when viewing yourself and swallows failures otherwise", async () => {
    fetchApiMock.mockRejectedValueOnce(new Error("summary down"));

    const { result: otherUser } = renderHook(() => useCurrentUserSummary(false));
    await flushEffects();
    expect(otherUser.current).toBeNull();
    expect(fetchApiMock).toHaveBeenCalledWith("/profile/summary/");

    renderHook(() => useCurrentUserSummary(true));
    expect(fetchApiMock).toHaveBeenCalledTimes(1);
  });

  it("loads the current-user summary when viewing another profile", async () => {
    fetchApiMock.mockResolvedValueOnce({ score: 7 });

    const { result } = renderHook(() => useCurrentUserSummary(false));
    await flushEffects();

    expect(result.current).toEqual({ score: 7 });
  });

  it("does not submit suggestions without a target id and ignores duplicate sends", async () => {
    const { result: emptyTarget } = renderHook(() => useSuggestionState(null));
    await act(async () => {
      await emptyTarget.current.submit();
    });
    expect(emptyTarget.current.state).toBe("idle");
    expect(fetchApiMock).not.toHaveBeenCalled();

    let resolveRequest;
    fetchApiMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const { result: sending } = renderHook(() => useSuggestionState(42));

    act(() => {
      sending.current.submit();
    });

    expect(sending.current.state).toBe("sending");
    expect(fetchApiMock).toHaveBeenCalledTimes(1);

    act(() => {
      sending.current.submit();
    });
    expect(fetchApiMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({});
      await Promise.resolve();
    });
    expect(sending.current.state).toBe("sent");
  });

  it("marks suggestion submission errors", async () => {
    fetchApiMock.mockRejectedValueOnce(new Error("send failed"));

    const { result } = renderHook(() => useSuggestionState(24));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.state).toBe("error");
  });

  it("saves the weekly goal with the expected patch payload before refetching", async () => {
    const refetch = vi.fn();
    fetchApiMock.mockResolvedValueOnce({ ok: true });

    await saveWeeklyGoal(18, refetch);

    expect(fetchApiMock).toHaveBeenCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ weekly_goal_hours: 18 }),
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
