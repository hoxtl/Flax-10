import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildTransform,
  cx,
  getDocumentHeight,
  getGlobeOpacity,
  getInitialTransform,
  getInterpolatedPosition,
  getNearestSectionIndex,
  getScrollProgress,
  getScrollTop,
  getSectionInterpolation,
  getTargetIndex,
  getViewportCenter,
  lerp,
  parsePercent,
} from "../../../../components/ui/landing_page/landingPageUtils";

describe("landingPageUtils", () => {
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    globalThis.window = { pageYOffset: 0, innerHeight: 0 };
    globalThis.document = {
      documentElement: {
        scrollTop: 0,
        scrollHeight: 0,
      },
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it("covers the basic numeric helpers", () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
    expect(cx("alpha", "", null, "beta")).toBe("alpha beta");
    expect(parsePercent("12.5%")).toBe(12.5);
  });

  it("reads scroll positions and dimensions for window and element targets", () => {
    Object.defineProperty(window, "pageYOffset", { configurable: true, value: 90, writable: true });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600, writable: true });
    Object.defineProperty(document.documentElement, "scrollTop", { configurable: true, value: 45, writable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1500, writable: true });

    const element = { scrollTop: 30, scrollHeight: 700, clientHeight: 200 };

    expect(getScrollTop(window)).toBe(90);
    expect(getScrollTop(element)).toBe(30);
    expect(getDocumentHeight(window)).toBe(900);
    expect(getDocumentHeight(element)).toBe(500);
    expect(getViewportCenter(window)).toBe(300);
    expect(getViewportCenter(element)).toBe(100);

    window.pageYOffset = 0;
    expect(getScrollTop(window)).toBe(45);
    document.documentElement.scrollTop = 0;
    expect(getScrollTop(window)).toBe(0);
  });

  it("clamps scroll progress and chooses the nearest section", () => {
    expect(getScrollProgress(-10, { scrollHeight: 500, clientHeight: 100 })).toBe(0);
    expect(getScrollProgress(999, { scrollHeight: 500, clientHeight: 100 })).toBe(1);
    expect(getScrollProgress(0.5, { scrollHeight: 1, clientHeight: 10 })).toBe(0.5);

    const refs = [
      { getBoundingClientRect: () => ({ top: 0, height: 100 }) },
      null,
      { getBoundingClientRect: () => ({ top: 180, height: 80 }) },
    ];

    expect(getNearestSectionIndex(refs, 210)).toBe(2);
    expect(getNearestSectionIndex([{ getBoundingClientRect: () => ({ top: 0, height: 100 }) }], 50)).toBe(0);
  });

  it("calculates target sections and interpolations in both directions", () => {
    expect(getTargetIndex(1, 4, true)).toBe(2);
    expect(getTargetIndex(1, 4, false)).toBe(0);
    expect(getTargetIndex(0, 4, false)).toBe(0);
    expect(getTargetIndex(3, 4, true)).toBe(3);

    const current = { offsetTop: 100 };
    const target = { offsetTop: 300 };

    expect(getSectionInterpolation(current, target, 200, true)).toBe(0.5);
    expect(getSectionInterpolation(current, target, 200, false)).toBe(0.5);
    expect(getSectionInterpolation(current, current, 200, true)).toBe(0);
    expect(getSectionInterpolation({ offsetTop: 100 }, { offsetTop: 100 }, 200, true)).toBe(0);
  });

  it("builds and interpolates transforms for globe positions", () => {
    expect(buildTransform({ left: 10, top: 20, scale: 1.5 })).toContain("translate3d(10vw, 20vh, 0)");
    expect(getInitialTransform({ left: 5, top: 6, scale: 0.7 })).toEqual({ left: 5, top: 6, scale: 0.7 });
    expect(getInterpolatedPosition(
      { left: 0, top: 10, scale: 1 },
      { left: 10, top: 30, scale: 2 },
      0.5,
    )).toEqual({ left: 5, top: 20, scale: 1.5 });
    expect(getGlobeOpacity(1, 3)).toBe(0.85);
    expect(getGlobeOpacity(2, 3)).toBe(0.38);
  });
});
