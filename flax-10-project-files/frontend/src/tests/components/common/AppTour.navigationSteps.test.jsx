import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capturedCallbacks = [];

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCallback: (fn, deps) => {
      capturedCallbacks.push(fn);
      return actual.useCallback(fn, deps);
    },
  };
});

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

import AppTour from "../../../components/common/AppTour/AppTour";

describe("AppTour branch coverage", () => {
  beforeEach(() => {
    capturedCallbacks.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("covers the no-op prev branch on the first step", () => {
    render(<AppTour onDone={vi.fn()} />);
    expect(capturedCallbacks).toHaveLength(2);

    act(() => {
      capturedCallbacks[1]();
    });

    expect(screen.getByText("Welcome to StudyFlax")).toBeInTheDocument();
    expect(screen.queryByText("Back")).toBeNull();
  });

  it("still advances and completes when the next callback is used", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue({
      getBoundingClientRect: () => ({ x: 30, y: 40, width: 50, height: 20 }),
    });

    const onDone = vi.fn();
    render(<AppTour onDone={onDone} />);

    fireEvent.click(screen.getByText("Next"));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Welcome to StudyFlax")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
