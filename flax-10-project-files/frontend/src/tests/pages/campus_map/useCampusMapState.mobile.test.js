import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 700,
  });
});

import { useCampusMapState } from "../../../pages/campus_map/hooks/useCampusMapState";

describe("useCampusMapState mobile viewport", () => {
  it("marks narrow viewports as mobile", () => {
    const { result } = renderHook(() => useCampusMapState());

    expect(result.current.ui.isMobile).toBe(true);
  });
});
