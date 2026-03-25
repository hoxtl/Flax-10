import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, renderHook } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => {
      const rest = { ...props };
      delete rest.custom;
      delete rest.variants;
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      return <span {...rest}>{children}</span>;
    },
  },
}));

import { WordLoaderCharacters } from "../../../components/ui/word-loader/WordLoaderCharacters";
import { useWordLoader } from "../../../components/ui/word-loader/useWordLoader";

describe("word loader extra coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders empty words safely and exposes the keyed wrapper", () => {
    const { container } = render(<WordLoaderCharacters index={3} word="" />);
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("advances word state with act and stays pinned at the last word", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { result } = renderHook(() => useWordLoader(["Alpha", "Beta"]));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toEqual({ index: 1, word: "Beta" });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toEqual({ index: 1, word: "Beta" });
    expect(clearSpy).toHaveBeenCalled();
  });

  it("falls back to an empty word when the array is empty", () => {
    const { result } = renderHook(() => useWordLoader([]));
    expect(result.current).toEqual({ index: 0, word: "" });
  });
});
