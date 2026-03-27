import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
const getSummary = vi.fn();
const getProgress = vi.fn();
const getThemeStats = vi.fn();

vi.mock("../../lib/routes", () => ({
  APP_ROUTES: [
    { id: "home", path: "/", element: "HOME" },
    { id: "modules", path: "/modules", element: <div existing="yes" /> },
    { id: "empty", path: "/empty", element: undefined },
    { id: "plain", path: "/plain", element: { type: "plain-route" } },
  ],
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../../api/analyticsApi", () => ({
  default: {
    getSummary: (...args) => getSummary(...args),
    getProgress: (...args) => getProgress(...args),
    getThemeStats: (...args) => getThemeStats(...args),
  },
}));

import { resolveRouteContent } from "../../app/navigation/helpers";
import { useNavHandler } from "../../app/navigation/useNavHandler";
import { fadeUp } from "../../pages/analytics/pageConfig";
import useAnalyticsOverview from "../../pages/analytics/hooks/useAnalyticsOverview";

describe("navigation and analytics extras", () => {
  function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it("covers route content fallbacks and additional nav shapes", () => {
    expect(resolveRouteContent("unknown", { id: 1 }, vi.fn())).toBe("HOME");
    expect(resolveRouteContent("empty", { id: 1 }, vi.fn())).toBeUndefined();
    expect(resolveRouteContent("modules_topic_name", { id: 1 }, vi.fn()).props.initialSearch).toBe("topic_name");

    const setActiveNav = vi.fn();
    const createRoute = resolveRouteContent("modules_create", { id: 1 }, setActiveNav);
    createRoute.props.onBack();
    expect(setActiveNav).toHaveBeenCalledWith("home");

    const plainRoute = resolveRouteContent("plain", { id: 1 }, setActiveNav);
    expect(plainRoute.props.user).toEqual({ id: 1 });

    const { result } = renderHook(() => useNavHandler(setActiveNav));
    act(() => result.current("societies_17"));
    expect(navigate).toHaveBeenLastCalledWith("/societies?id=17");
    act(() => result.current("group-work_31"));
    expect(navigate).toHaveBeenLastCalledWith("/group-work?project=31");
    act(() => result.current("mystery-destination"));
    expect(setActiveNav).toHaveBeenLastCalledWith("mystery-destination");
  });

  it("covers analytics animation visible config", () => {
    expect(fadeUp.visible()).toEqual(expect.objectContaining({ opacity: 1, y: 0 }));
  });

  it("sets initial null state when no period is provided to useAnalyticsOverview", () => {
    const { result } = renderHook(() => useAnalyticsOverview(null));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("handles loading and error states for useAnalyticsOverview", async () => {
    getSummary.mockRejectedValue(new Error("summary-fail"));
    const { result, rerender } = renderHook(({ p }) => useAnalyticsOverview(p), { initialProps: { p: 7 } });
    await waitFor(() => expect(result.current.error).toBe("summary-fail"));
    
    getSummary.mockResolvedValue({ s: 1 });
    getProgress.mockResolvedValue({ p: 1 });
    getThemeStats.mockResolvedValue({ t: 1 });
    rerender({ p: 30 });
    await waitFor(() => expect(result.current.data).toEqual({ s: 1 }));
  });

  it("uses the fallback analytics error message when the rejection has no message", async () => {
    getSummary.mockRejectedValueOnce({});
    getProgress.mockRejectedValueOnce({});
    getThemeStats.mockRejectedValueOnce({});

    const { result } = renderHook(() => useAnalyticsOverview(90));
    await waitFor(() => expect(result.current.error).toBe("Failed to load analytics data."));
  });

  it("ignores late analytics responses after the hook unmounts", async () => {
    const summary = deferred();
    const progress = deferred();
    const theme = deferred();

    getSummary.mockReturnValueOnce(summary.promise);
    getProgress.mockReturnValueOnce(progress.promise);
    getThemeStats.mockReturnValueOnce(theme.promise);

    const { result, unmount } = renderHook(() => useAnalyticsOverview(14));
    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      summary.resolve({ summary: "late" });
      progress.resolve({ progress: "late" });
      theme.resolve({ theme: "late" });
      await Promise.all([summary.promise, progress.promise, theme.promise]);
    });
  });
});
