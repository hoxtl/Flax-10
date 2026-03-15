/**
 * Tests for Tasks listColorUtils: getListColor with list.color, stored color, and palette fallback.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getListColor } from "../../../pages/Tasks/utils/listColorUtils";

describe("listColorUtils", () => {
  const originalGetItem = global.localStorage?.getItem;

  beforeEach(() => {
    if (typeof global.localStorage !== "undefined") {
      global.localStorage.getItem = vi.fn();
    }
  });

  afterEach(() => {
    if (typeof global.localStorage !== "undefined" && originalGetItem) {
      global.localStorage.getItem = originalGetItem;
    }
  });

  it("returns list.color when set", () => {
    const list = { id: 1, name: "L", color: "#ff0000" };
    expect(getListColor(list)).toBe("#ff0000");
  });

  it("returns stored color from localStorage when list has id and no color", () => {
    const list = { id: 42, name: "L" };
    global.localStorage.getItem = vi.fn((key) => (key === "listColor:42" ? "#00ff00" : null));
    expect(getListColor(list)).toBe("#00ff00");
  });

  it("returns palette color by index when no list color and no stored", () => {
    const list = { id: 99, name: "L" };
    global.localStorage.getItem = vi.fn(() => null);
    const color = getListColor(list, 0);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
    expect(color.length).toBeGreaterThan(0);
  });

  it("uses idx for palette when provided", () => {
    global.localStorage.getItem = vi.fn(() => null);
    const a = getListColor({ id: 1 }, 0);
    const b = getListColor({ id: 2 }, 1);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("handles null list safely", () => {
    global.localStorage.getItem = vi.fn(() => null);
    const color = getListColor(null, 0);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("handles list without id", () => {
    global.localStorage.getItem = vi.fn(() => null);
    const color = getListColor({ name: "L" }, 2);
    expect(color).toBeDefined();
  });
});
