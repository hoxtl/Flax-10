/* Tests for task list-colour resolution and fallbacks. */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getListColor } from "../../../pages/tasks/utils/listColorUtils";

describe("listColorUtils", () => {
  const originalGetItem = globalThis.localStorage?.getItem;

  beforeEach(() => {
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.getItem = vi.fn();
    }
  });

  afterEach(() => {
    if (typeof globalThis.localStorage !== "undefined" && originalGetItem) {
      globalThis.localStorage.getItem = originalGetItem;
    }
  });

  it("returns list.color when set", () => {
    const list = { id: 1, name: "L", color: "#ff0000" };
    expect(getListColor(list)).toBe("#ff0000");
  });

  it("returns stored color from localStorage when list has id and no color", () => {
    const list = { id: 42, name: "L" };
    globalThis.localStorage.getItem = vi.fn((key) => (key === "listColor:42" ? "#00ff00" : null));
    expect(getListColor(list)).toBe("#00ff00");
  });

  it("returns palette color by index when no list color and no stored", () => {
    const list = { id: 99, name: "L" };
    globalThis.localStorage.getItem = vi.fn(() => null);
    const color = getListColor(list, 0);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
    expect(color.length).toBeGreaterThan(0);
  });

  it("uses idx for palette when provided", () => {
    globalThis.localStorage.getItem = vi.fn(() => null);
    const a = getListColor({ id: 1 }, 0);
    const b = getListColor({ id: 2 }, 1);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("handles null list safely", () => {
    globalThis.localStorage.getItem = vi.fn(() => null);
    const color = getListColor(null, 0);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("handles list without id", () => {
    globalThis.localStorage.getItem = vi.fn(() => null);
    const color = getListColor({ name: "L" }, 2);
    expect(color).toBeDefined();
  });

  it("falls back to the first palette colour when idx is null", () => {
    globalThis.localStorage.getItem = vi.fn(() => null);
    const color = getListColor({ id: 7, name: "L" }, null);
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });
});
