import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { createPopupCoords, shouldShowPopupAbove } from "../../../pages/group_work/utils/taskAssigneeUtils";

describe("taskAssigneeUtils", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 768 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("positions the popup below the trigger when showTop is false", () => {
    expect(createPopupCoords({ top: 100, bottom: 150, left: 40 }, false)).toEqual({
      top: 158,
      left: 40,
      width: 200,
    });
  });

  it("positions the popup above the trigger when showTop is true and clamps left", () => {
    expect(createPopupCoords({ top: 100, bottom: 150, left: 900 }, true)).toEqual({
      top: 92,
      left: 814,
      width: 200,
    });
  });

  it("shows above only when space below is tight and there is more room above", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 400 });
    expect(shouldShowPopupAbove({ top: 250, bottom: 260 })).toBe(true);
  });

  it("keeps the popup below when there is sufficient space below", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 900 });
    expect(shouldShowPopupAbove({ top: 100, bottom: 150 })).toBe(false);
  });
});
