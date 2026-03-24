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
import { fadeUp } from "../../pages/Analytics/pageConfig";
import useAnalyticsOverview from "../../pages/Analytics/hooks/useAnalyticsOverview";

describe("navigation and analytics extras", () => {
  it("covers route content fallbacks and additional nav shapes", () => {
    expect(resolveRouteContent("unknown", { id: 1 }, vi.fn())).toBe("HOME");
    expect(resolveRouteContent("modules_topic_name", { id: 1 }, vi.fn()).props.initialSearch).toBe("topic_name");

    const setActiveNav = vi.fn();
    const { result } = renderHook(() => useNavHandler(setActiveNav));
    act(() => result.current("societies_17"));
    expect(navigate).toHaveBeenLastCalledWith("/societies?id=17");
    act(() => result.current("group-work_31"));
    expect(navigate).toHaveBeenLastCalledWith("/group-work?project=31");
  });

  it("covers analytics animation config and overview hook reset/error branches", async () => {
    expect(fadeUp.visible()).toEqual(expect.objectContaining({
      opacity: 1,
      y: 0,
      transition: expect.objectContaining({ delay: 0 }),
    }));

    const { result, rerender } = renderHook(({ period }) => useAnalyticsOverview(period), {
      initialProps: { period: null },
    });
    expect(result.current).toEqual({
      data: null,
      error: null,
      loading: false,
      progressData: null,
      themeStats: null,
    });

    getSummary.mockRejectedValueOnce(new Error("boom"));
    getProgress.mockRejectedValueOnce(new Error("boom"));
    getThemeStats.mockRejectedValueOnce(new Error("boom"));
    rerender({ period: 7 });
    await waitFor(() => expect(result.current.error).toBe("boom"));

    getSummary.mockResolvedValueOnce({ summary: true });
    getProgress.mockResolvedValueOnce({ progress: true });
    getThemeStats.mockResolvedValueOnce({ theme: true });
    rerender({ period: 30 });
    await waitFor(() => expect(result.current.data).toEqual({ summary: true }));
    expect(result.current.progressData).toEqual({ progress: true });
    expect(result.current.themeStats).toEqual({ theme: true });
  });
});
