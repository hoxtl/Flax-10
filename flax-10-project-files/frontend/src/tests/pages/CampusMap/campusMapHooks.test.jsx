import { act, render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/tflApi", () => ({
  tflService: {
    getTfLDelays: vi.fn(),
  },
}));

vi.mock("../../../api/userApi", () => ({
  getHomeAddress: vi.fn(),
}));

import { tflService } from "../../../api/tflApi";
import { getHomeAddress } from "../../../api/userApi";
import CampusMap from "../../../pages/CampusMap/CampusMap";
import { useCampusMapRefs } from "../../../pages/CampusMap/hooks/useCampusMapRefs";
import { useCampusMapState } from "../../../pages/CampusMap/hooks/useCampusMapState";
import { useDisruptions } from "../../../pages/CampusMap/hooks/useDisruptions";
import { useHomeAddress } from "../../../pages/CampusMap/hooks/useHomeAddress";
import { useResponsiveCampusMap } from "../../../pages/CampusMap/hooks/useResponsiveCampusMap";

vi.mock("../../../components/CampusMap/CampusMapShell", () => ({
  CampusMapShell: (props) => (
    <div>
      <span data-testid="model-prop">{String(typeof props.handleGeolocateStart === "function")}</span>
      <span data-testid="skeleton-visible">{String(props.showInitialSkeleton)}</span>
    </div>
  ),
}));

vi.mock("../../../pages/CampusMap/hooks/useCampusMapModel", () => ({
  useCampusMapModel: vi.fn(() => ({
    form: { manualDestination: "", manualStart: "" },
    handleGeolocateStart: vi.fn(),
    showInitialSkeleton: false,
    ui: { isMobile: false },
  })),
}));

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("CampusMap hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1200 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useCampusMapRefs returns stable refs", () => {
    const { result, rerender } = renderHook(() => useCampusMapRefs());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(first.map.current).toBe(null);
    expect(Array.isArray(first.campusMarkers.current)).toBe(true);
  });

  it("useCampusMapState initialises grouped state from the current viewport", () => {
    const { result } = renderHook(() => useCampusMapState());

    expect(result.current.selection).toEqual({ customDestination: null, selectedCampus: null, startLocation: null });
    expect(result.current.routes.routeInfo).toBeNull();
    expect(result.current.form).toEqual({ manualDestination: "", manualStart: "" });
    expect(typeof result.current.ui.isMobile).toBe("boolean");
    expect(result.current.ui.mobileInitialOpen).toBe(true);
  });

  it("useCampusMapState marks narrow viewports as mobile", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 700 });
    vi.resetModules();

    const { useCampusMapState: useCampusMapStateFresh } = await import("../../../pages/CampusMap/hooks/useCampusMapState");
    const { result } = renderHook(() => useCampusMapStateFresh());

    expect(result.current.ui.isMobile).toBe(true);
  });

  it("useDisruptions loads initial disruption data", async () => {
    tflService.getTfLDelays.mockResolvedValueOnce([{ id: 1, name: "C" }]);
    const { result } = renderHook(() => useDisruptions());
    await flushEffects();
    expect(result.current.loading).toBe(false);
    expect(result.current.disruptions).toEqual([{ id: 1, name: "C" }]);
  });

  it("useDisruptions retries on an interval", async () => {
    let cb = null;
    vi.spyOn(window, "setInterval").mockImplementation((c) => { cb = c; return 1; });
    tflService.getTfLDelays.mockResolvedValueOnce([{ id: 1, name: "C" }]).mockResolvedValueOnce([{ id: 2, name: "N" }]);
    const { result } = renderHook(() => useDisruptions());
    await flushEffects();
    await act(async () => { await cb?.(); });
    await flushEffects();
    expect(result.current.disruptions).toEqual([{ id: 2, name: "N" }]);
  });

  it("useDisruptions swallows fetch failures and still clears loading", async () => {
    tflService.getTfLDelays.mockRejectedValueOnce(new Error("fail"));
    const { result, unmount } = renderHook(() => useDisruptions());
    await flushEffects();

    expect(result.current.loading).toBe(false);
    expect(result.current.disruptions).toEqual([]);

    unmount();
  });

  it("useHomeAddress loads valid home coordinates and refreshes after the custom event", async () => {
    getHomeAddress
      .mockResolvedValueOnce({ home_address: "London", home_latitude: 51.5, home_longitude: -0.1 })
      .mockResolvedValueOnce({ home_address: "Paris", home_latitude: 48.8, home_longitude: 2.3 });

    const { result } = renderHook(() => useHomeAddress());
    await flushEffects();

    expect(result.current.userHome).toEqual({ address: "London", lat: 51.5, lng: -0.1 });

    await act(async () => {
      window.dispatchEvent(new CustomEvent("home-address-updated"));
    });
    await flushEffects();

    expect(result.current.userHome).toEqual({ address: "Paris", lat: 48.8, lng: 2.3 });
  });

  it("useHomeAddress ignores incomplete or failed home-address responses", async () => {
    getHomeAddress.mockResolvedValueOnce({ home_address: "Nowhere", home_latitude: null, home_longitude: 0 });
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(() => useHomeAddress());
    await flushEffects();
    expect(result.current.userHome).toBeNull();

    unmount();

    expect(addSpy).toHaveBeenCalledWith("home-address-updated", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("home-address-updated", expect.any(Function));
  });

  it("useResponsiveCampusMap updates mobile state, skeleton timing, and initial open behaviour", async () => {
    vi.useFakeTimers();
    const setUi = vi.fn((updater) => updater({
      isMobile: false,
      minSkeletonElapsed: false,
      mobileInitialOpen: true,
    }));

    renderHook(() => useResponsiveCampusMap(setUi, true));

    await act(async () => {
      window.innerWidth = 700;
      window.dispatchEvent(new Event("resize"));
    });

    expect(setUi).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    expect(setUi).toHaveBeenCalled();

    await act(async () => {});
  });

  it("useResponsiveCampusMap schedules and cancels mobile open state updates", () => {
    const raf = vi.fn((cb) => {
      cb();
      return 42;
    });
    const cancelRaf = vi.fn();
    Object.defineProperty(window, "requestAnimationFrame", { configurable: true, writable: true, value: raf });
    Object.defineProperty(window, "cancelAnimationFrame", { configurable: true, writable: true, value: cancelRaf });

    const setUi = vi.fn((updater) => updater({
      isMobile: true,
      minSkeletonElapsed: false,
      mobileInitialOpen: true,
    }));

    const { unmount } = renderHook(() => useResponsiveCampusMap(setUi, true));

    expect(raf).toHaveBeenCalled();
    expect(setUi).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(cancelRaf).toHaveBeenCalledWith(42);
  });

  it("useResponsiveCampusMap clears the skeleton timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const setUi = vi.fn((updater) => updater({
      isMobile: false,
      minSkeletonElapsed: false,
      mobileInitialOpen: true,
    }));

    const { unmount } = renderHook(() => useResponsiveCampusMap(setUi, false));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("removes resize listeners and initialises mobileInitialOpen for desktop layouts", async () => {
    vi.useFakeTimers();
    const setUi = vi.fn((updater) => updater({
      isMobile: false,
      minSkeletonElapsed: false,
      mobileInitialOpen: false,
    }));
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useResponsiveCampusMap(setUi, false));

    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(setUi).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("renders the CampusMap page through the model hook", () => {
    const { getByTestId } = render(<CampusMap />);
    expect(getByTestId("model-prop")).toHaveTextContent("true");
    expect(getByTestId("skeleton-visible")).toHaveTextContent("false");
  });
});
