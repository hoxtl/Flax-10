import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppTour from "../../../../components/common/AppTour/AppTour";

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

const advanceToNextStep = async () => {
  fireEvent.click(screen.getByText("Next"));
  await act(async () => {
    vi.advanceTimersByTime(150);
  });
};

describe("AppTour – uncovered branches", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("getSideCardPosition (y >= 120) and arrowSide left", () => {
    it("positions the card to the side when target y >= 120", async () => {
      // y=200 is >= 120 so getSideCardPosition is used, producing arrowSide "left"
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 50, y: 200, width: 60, height: 40 }),
      });

      render(<AppTour onDone={vi.fn()} />);
      await advanceToNextStep();

      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // The card should be positioned using getSideCardPosition logic:
      // left = x + width + PAD + 8 = 50 + 60 + 12 + 8 = 130
      const card = Array.from(screen.getByRole("dialog", { name: "App tour" }).querySelectorAll("div[style]"))
        .find((el) => el.textContent?.includes("Dashboard") && el.style.left);
      expect(card?.style.left).toBe("130px");

      // arrowSide === "left" means buildCardClasses adds hasArrowLeft class
      const className = card?.className || "";
      expect(className).toContain("hasArrowLeft");

      // SpotlightOverlay should have a clipPath since rect is provided
      const overlay = getOverlay();
      expect(overlay?.style.clipPath).toContain("polygon");
    });
  });

  describe("SpotlightRing renders when rect is provided", () => {
    it("renders the spotlight ring div when a target element exists", async () => {
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 100, y: 200, width: 60, height: 40 }),
      });

      const { container } = render(<AppTour onDone={vi.fn()} />);
      await advanceToNextStep();

      // SpotlightRing renders a motion.div with className including "spotlightRing"
      const ring = Array.from(container.querySelectorAll("div")).find((el) =>
        String(el.className || "").includes("spotlightRing")
      );
      expect(ring).toBeTruthy();

      // Verify the ring style positions correctly using getSpotlightRingStyle
      // left = x - PAD = 100 - 12 = 88, top = y - PAD = 200 - 12 = 188
      expect(ring.style.left).toBe("88px");
      expect(ring.style.top).toBe("188px");
    });
  });

  describe("useTourKeyboardNavigation", () => {
    it("advances with ArrowRight key", async () => {
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 50, y: 200, width: 60, height: 40 }),
      });

      render(<AppTour onDone={vi.fn()} />);

      // Press ArrowRight to advance from welcome step
      fireEvent.keyDown(window, { key: "ArrowRight" });
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("advances with Enter key", async () => {
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 50, y: 200, width: 60, height: 40 }),
      });

      render(<AppTour onDone={vi.fn()} />);

      // Press Enter to advance from welcome step
      fireEvent.keyDown(window, { key: "Enter" });
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("goes back with ArrowLeft key", async () => {
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 50, y: 200, width: 60, height: 40 }),
      });

      render(<AppTour onDone={vi.fn()} />);

      // First advance to step 2
      fireEvent.keyDown(window, { key: "ArrowRight" });
      await act(async () => {
        vi.advanceTimersByTime(150);
      });
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // Now press ArrowLeft to go back
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText("Welcome to StudyFlax")).toBeInTheDocument();
    });

    it("calls onDone with Escape key", () => {
      const onDone = vi.fn();
      render(<AppTour onDone={onDone} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  describe("progress dot navigation", () => {
    it("jumps to a specific step when a progress dot is clicked", async () => {
      vi.spyOn(document, "querySelector").mockReturnValue({
        getBoundingClientRect: () => ({ x: 60, y: 90, width: 80, height: 30 }),
      });

      render(<AppTour onDone={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Go to step 3: Calendar" }));
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("3 / 7")).toBeInTheDocument();
    });
  });
});
