/*
 * Persistence and sync tests for the intelligence dashboard hook.
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDashboardProfile,
  resetIntelligenceDashboardMocks,
  updateUserSettingsMock,
} from "./useIntelligenceDashboard.testSetup";
import { useIntelligenceDashboard } from "../../../../pages/homepage/hooks/useIntelligenceDashboard";

function renderDashboardHook(props) {
  return renderHook(() => useIntelligenceDashboard(props));
}

async function advanceDashboardSync() {
  await act(async () => {
    await Promise.resolve();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();
  });
}

async function withDashboardTimers(run) {
  vi.useFakeTimers();
  try {
    await run();
  } finally {
    vi.useRealTimers();
  }
}

describe("useIntelligenceDashboard persistence", () => {
  beforeEach(() => {
    resetIntelligenceDashboardMocks();
  });

  it("falls back to stored widgets when server settings are already synced", async () => {
    await withDashboardTimers(async () => {
      const profile = createDashboardProfile(11, { homepage_widget_sizes: { hero: { row: 2 } } });
      localStorage.setItem("homepage_widget_layout_11", JSON.stringify(["deadlines", "deadlines", "unknown"]));
      localStorage.setItem("homepage_widget_sizes_11", JSON.stringify({ deadlines: { row: 1 } }));
      localStorage.setItem("homepage_widget_source_11", JSON.stringify({ layout: ["hero"], sizes: { hero: { row: 2 } } }));
      const { result } = renderDashboardHook({ profile, profileLoading: false, slot5Data: {} });
      await advanceDashboardSync();
      expect(result.current.layout).toEqual(["hero", "deadlines"]);
      expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
      expect(updateUserSettingsMock).toHaveBeenCalledWith({
        homepage_widgets: ["hero", "deadlines"],
        homepage_widget_sizes: { deadlines: { row: 1 } },
      });
    });
  });

  it("does not cloud sync when the profile is missing or still loading", () => {
    renderDashboardHook({ profile: null, profileLoading: false, slot5Data: {} });
    renderDashboardHook({ profile: createDashboardProfile(1), profileLoading: true, slot5Data: {} });
    expect(updateUserSettingsMock).not.toHaveBeenCalled();
  });

  it("falls back to stored widget sizes when the server has sizes but no layout", async () => {
    const profile = { id: 21, settings: { homepage_widgets: [], homepage_widget_sizes: { deadlines: { row: 1 } } } };
    const { result } = renderDashboardHook({ profile, profileLoading: false, slot5Data: {} });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.widgetSizes).toEqual({ deadlines: { row: 1 } });
  });

  it("syncs server layouts with empty widget sizes", async () => {
    const profile = { id: 31, settings: { homepage_widgets: ["todayTasks", "hero"], homepage_widget_sizes: null } };
    const { result } = renderDashboardHook({ profile, profileLoading: false, slot5Data: {} });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.layout).toEqual(["todayTasks", "hero"]);
    expect(result.current.widgetSizes).toEqual({});
  });

  it("stores sorted server widget-size snapshots when syncing from profile settings", async () => {
    const profile = {
      id: 32,
      settings: {
        homepage_widgets: ["todayTasks", "hero"],
        homepage_widget_sizes: {
          todayTasks: { row: 1 },
          hero: { row: 2 },
        },
      },
    };
    renderDashboardHook({ profile, profileLoading: false, slot5Data: {} });
    await act(async () => {
      await Promise.resolve();
    });
    const storedSource = JSON.parse(localStorage.getItem("homepage_widget_source_32"));
    expect(storedSource.layout).toEqual(["todayTasks", "hero"]);
    expect(Object.keys(storedSource.sizes)).toEqual(["hero", "todayTasks"]);
  });
});
