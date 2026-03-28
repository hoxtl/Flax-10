import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, renderHook, screen } from "@testing-library/react";

const spanProps = [];

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => {
      spanProps.push(props);
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

import { WordLoaderCharacters } from "../../../../components/ui/word_loader/WordLoaderCharacters";
import { useWordLoader } from "../../../../components/ui/word_loader/useWordLoader";

describe("word loader extra coverage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    spanProps.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders empty words safely and exposes the keyed wrapper", () => {
    const { container } = render(<WordLoaderCharacters index={3} word="" />);
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("renders spaces as non-breaking spaces and exposes character variants", () => {
    const { container } = render(<WordLoaderCharacters index={1} word="A B" />);

    const characterSpan = spanProps.find((props) => props.variants);
    expect(characterSpan).toBeTruthy();
    expect(characterSpan.variants.visible(2)).toMatchObject({
      opacity: 1,
      y: 0,
      transition: { delay: 0.08, duration: 0.4, ease: "easeOut" },
    });
    expect(characterSpan.variants.exit(1)).toMatchObject({
      opacity: 0,
      y: -5,
      transition: { delay: 0.04, duration: 0.3, ease: "easeIn" },
    });
    expect(container.textContent).toContain("\u00A0");
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
