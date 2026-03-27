import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock the API module before importing the hook

vi.mock("../../../../../api/userApi", () => ({
  getUserSettings: vi.fn(),
}));

import { getUserSettings } from "../../../../../api/userApi";
import { useSleepWindow } from "../../../../../pages/homepage/hooks/mini_timeline/useSleepWindow";

const DEFAULT_SLEEP_WINDOW = { sleepTime: "23:00", wakeTime: "07:00" };

describe("useSleepWindow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialises with the default sleep window before the API resolves", () => {
    // Return a never-resolving promise so the effect is still pending.
    getUserSettings.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSleepWindow());
    expect(result.current).toEqual(DEFAULT_SLEEP_WINDOW);
  });

  it("returns formatted data from a successful API call", async () => {
    getUserSettings.mockResolvedValue({
      sleep_time: "22:30:00",
      wake_time: "06:45:00",
    });

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current.sleepTime).toBe("22:30");
      expect(result.current.wakeTime).toBe("06:45");
    });
  });

  it("slices only the first 5 characters from sleep_time and wake_time", async () => {
    getUserSettings.mockResolvedValue({
      sleep_time: "23:00:00.000Z",
      wake_time: "07:00:00.000Z",
    });

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current.sleepTime).toBe("23:00");
      expect(result.current.wakeTime).toBe("07:00");
    });
  });

  it("falls back to defaults when sleep_time is absent from the API response", async () => {
    getUserSettings.mockResolvedValue({ wake_time: "08:00:00" });

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current.sleepTime).toBe(DEFAULT_SLEEP_WINDOW.sleepTime);
      expect(result.current.wakeTime).toBe("08:00");
    });
  });

  it("falls back to defaults when wake_time is absent from the API response", async () => {
    getUserSettings.mockResolvedValue({ sleep_time: "22:00:00" });

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current.sleepTime).toBe("22:00");
      expect(result.current.wakeTime).toBe(DEFAULT_SLEEP_WINDOW.wakeTime);
    });
  });

  it("returns the default sleep window when the API call fails", async () => {
    getUserSettings.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current).toEqual(DEFAULT_SLEEP_WINDOW);
    });
  });

  it("returns the default sleep window when the API resolves with null", async () => {
    getUserSettings.mockResolvedValue(null);

    const { result } = renderHook(() => useSleepWindow());

    await waitFor(() => {
      expect(result.current).toEqual(DEFAULT_SLEEP_WINDOW);
    });
  });

  it("calls getUserSettings exactly once on mount", async () => {
    getUserSettings.mockResolvedValue({ sleep_time: "23:00:00", wake_time: "07:00:00" });

    renderHook(() => useSleepWindow());

    await waitFor(() => expect(getUserSettings).toHaveBeenCalledTimes(1));
  });
});
