import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTour from "../../../components/common/AppTour/AppTour";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

function getOverlay() {
  return Array.from(screen.getByRole("dialog", { name: "App tour" }).querySelectorAll("div")).find((element) => {
    const className = String(element.className || "");
    return className.includes("overlay") && !className.includes("overlayWrap");
  });
}

describe("AppTour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the welcome step centered with no back button", () => {
    render(<AppTour onDone={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "App tour" })).toBeInTheDocument();
    expect(screen.getByText("Welcome to StudyFlax")).toBeInTheDocument();
    expect(screen.getByText("1 / 7")).toBeInTheDocument();
    expect(screen.queryByText("Back")).toBeNull();
    expect(screen.getByText("Next")).toBeInTheDocument();

    const overlay = getOverlay();
    expect(overlay?.style.clipPath).toBe("");
  });

  it("measures targeted steps, supports back navigation, and applies the spotlight clip path", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue({
      getBoundingClientRect: () => ({ x: 100, y: 80, width: 60, height: 40 }),
    });

    render(<AppTour onDone={vi.fn()} />);

    fireEvent.click(screen.getByText("Next"));
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();

    const overlay = getOverlay();
    expect(overlay?.style.clipPath).toContain("polygon");
    expect(overlay?.style.clipPath).toContain("70px");

    const card = screen.getByText("Dashboard").parentElement;
    expect(card?.style.left).toBe("178px");
    expect(card?.style.top).toBe("20px");

    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Welcome to StudyFlax")).toBeInTheDocument();
  });

  it("calls onDone when the user skips", () => {
    const onDone = vi.fn();
    render(<AppTour onDone={onDone} />);

    fireEvent.click(screen.getByText("Skip tour"));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("handles missing spotlight targets without crashing", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue(null);

    render(<AppTour onDone={vi.fn()} />);
    fireEvent.click(screen.getByText("Next"));

    await act(async () => {
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    const overlay = getOverlay();
    expect(overlay?.style.clipPath).toBe("");
  });

  it("calls onDone after the final step", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue({
      getBoundingClientRect: () => ({ x: 40, y: 60, width: 50, height: 30 }),
    });

    const onDone = vi.fn();
    render(<AppTour onDone={onDone} />);

    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(screen.getByText("Next"));
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
    }

    expect(screen.getByText("My Venio Details")).toBeInTheDocument();
    expect(screen.getByText("Finish")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Finish"));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.getByText("7 / 7")).toBeInTheDocument();
  });
});
