import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGlowPosition } from "../../../components/ui/bento-grid/useGlowPosition";

describe("useGlowPosition", () => {
  it("starts centered and resets back to the center", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useGlowPosition(ref));

    expect(result.current.glowPos).toEqual({ "--glow-x": "50%", "--glow-y": "50%" });

    act(() => {
      result.current.resetGlow();
    });

    expect(result.current.glowPos).toEqual({ "--glow-x": "50%", "--glow-y": "50%" });
  });

  it("ignores mouse movement when the card ref is missing", () => {
    const ref = { current: null };
    const { result } = renderHook(() => useGlowPosition(ref));

    act(() => {
      result.current.handleMouseMove({ clientX: 20, clientY: 40 });
    });

    expect(result.current.glowPos).toEqual({ "--glow-x": "50%", "--glow-y": "50%" });
  });

  it("updates the glow position relative to the card bounds", () => {
    const ref = {
      current: {
        getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 100 }),
      },
    };
    const { result } = renderHook(() => useGlowPosition(ref));

    act(() => {
      result.current.handleMouseMove({ clientX: 110, clientY: 70 });
    });

    expect(result.current.glowPos).toEqual({ "--glow-x": "50%", "--glow-y": "50%" });

    act(() => {
      result.current.handleMouseMove({ clientX: 210, clientY: 120 });
    });

    expect(result.current.glowPos).toEqual({ "--glow-x": "100%", "--glow-y": "100%" });
  });
});
