import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildTransformMock = vi.fn(({ left, top, scale }) => `transform:${left}:${top}:${scale}`);
const getGlobeOpacityMock = vi.fn(() => 0.85);
const getInitialTransformMock = vi.fn((position) => ({ ...position }));
const getInterpolatedPositionMock = vi.fn((from, to, interpolation) => ({
  left: from.left + (to.left - from.left) * interpolation,
  top: from.top + (to.top - from.top) * interpolation,
  scale: from.scale + (to.scale - from.scale) * interpolation,
}));
const getNearestSectionIndexMock = vi.fn(() => 0);
const getScrollProgressMock = vi.fn(() => 0.4);
const getScrollTopMock = vi.fn(() => 120);
const getSectionInterpolationMock = vi.fn(() => 0.5);
const getTargetIndexMock = vi.fn(() => 1);
const getViewportCenterMock = vi.fn(() => 300);
const lerpMock = vi.fn((start, end, factor) => start + (end - start) * factor);
const parsePercentMock = vi.fn((value) => Number.parseFloat(value));

vi.mock("../../../../components/ui/landing_page/landingPageUtils", () => ({
  buildTransform: (...args) => buildTransformMock(...args),
  getGlobeOpacity: (...args) => getGlobeOpacityMock(...args),
  getInitialTransform: (...args) => getInitialTransformMock(...args),
  getInterpolatedPosition: (...args) => getInterpolatedPositionMock(...args),
  getNearestSectionIndex: (...args) => getNearestSectionIndexMock(...args),
  getScrollProgress: (...args) => getScrollProgressMock(...args),
  getScrollTop: (...args) => getScrollTopMock(...args),
  getSectionInterpolation: (...args) => getSectionInterpolationMock(...args),
  getTargetIndex: (...args) => getTargetIndexMock(...args),
  getViewportCenter: (...args) => getViewportCenterMock(...args),
  lerp: (...args) => lerpMock(...args),
  parsePercent: (...args) => parsePercentMock(...args),
}));

import { useLandingPageState } from "../../../../components/ui/landing_page/useLandingPageState";

describe("useLandingPageState", () => {
  let requestAnimationFrameSpy;
  let cancelAnimationFrameSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    requestAnimationFrameSpy = vi.spyOn(window, "requestAnimationFrame");
    cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");
    let frameId = 1;
    requestAnimationFrameSpy.mockImplementation(() => frameId++);
    cancelAnimationFrameSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  it("returns stable defaults when there are no positions", () => {
    const sections = [{ id: "hero", pills: ["Fast"] }, { id: "details" }];
    const { result } = renderHook(() => useLandingPageState(sections, { positions: [] }));

    expect(result.current.activeSection).toBe(0);
    expect(result.current.displayTransform).toBe("");
    expect(result.current.globeOpacity).toBe(0.85);
    expect(result.current.topPills).toEqual(["Fast"]);
    expect(result.current.scrollProgress).toBe(0);
  });

  it("builds the initial transform and updates scroll-driven state when positions exist", () => {
    const sections = [{ id: "hero", pills: ["Fast"] }, { id: "details" }];
    const { result, unmount } = renderHook(() =>
      useLandingPageState(sections, {
        positions: [
          { left: "10", top: "20", scale: 1 },
          { left: "30", top: "40", scale: 1.5 },
        ],
      }),
    );

    expect(parsePercentMock).toHaveBeenCalledWith("20");
    expect(getInitialTransformMock).toHaveBeenCalledWith({ left: 10, top: 20, scale: 1 });
    expect(buildTransformMock).toHaveBeenCalled();
    expect(result.current.displayTransform).toContain("transform:");
    expect(result.current.scrollProgress).toBe(0.4);
    expect(result.current.activeSection).toBe(0);

    act(() => {
      unmount();
    });
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  it("falls back to empty top pills and an empty positions list when config fields are omitted", () => {
    const { result } = renderHook(() => useLandingPageState([{ id: "hero" }], {}));
    expect(result.current.topPills).toEqual([]);
    expect(result.current.displayTransform).toBe("");
  });
});
