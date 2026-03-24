import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { WordLoaderCharacters } from "../../../components/ui/word-loader/WordLoaderCharacters";
import { useWordLoader } from "../../../components/ui/word-loader/useWordLoader";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

describe("word-loader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders each character and preserves spaces", () => {
    const { container } = render(<WordLoaderCharacters index={1} word="A B" />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(container.textContent).toBe("A\u00A0B");
  });

  it("rotates words over time and stops at the last item", () => {
    const { result } = renderHook(() => useWordLoader(["Alpha", "Beta", "Gamma"]));
    expect(result.current.word).toBe("Alpha");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.word).toBe("Beta");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.word).toBe("Gamma");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.word).toBe("Gamma");
  });

  it("returns the first word without creating an interval when there is fewer than two words", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { result } = renderHook(() => useWordLoader(["Solo"]));
    expect(result.current).toEqual({ index: 0, word: "Solo" });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(clearSpy).not.toHaveBeenCalled();
  });
});
