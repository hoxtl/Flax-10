import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import "@/tests/mocks/motionAndIconMocks.jsx";
import {
  renderAppTour,
  makeRect,
  getOverlayElement,
  findCardByText,
  findClassFragment,
} from "../appTourTestUtils";

describe("AppTour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the welcome step centered without a spotlight", () => {
    renderAppTour();
    expect(screen.getByText("Welcome to StudyFlax")).toBeVisible();
    expect(getOverlayElement().style.clipPath).toBe("");
    expect(findCardByText("Welcome to StudyFlax").style.width).toBe("340px");
    expect(findClassFragment("spotlightRing")).toBeUndefined();
  });

  it("positions near-top steps below their target with a top arrow", async () => {
    const helpers = renderAppTour({ targets: { home: makeRect({ x: 90, y: 80, width: 50, height: 20 }) } });
    await helpers.next();
    const card = findCardByText("Dashboard");
    expect(card.className).toContain("hasArrowTop");
    expect(card.style.top).toBe("118px");
    expect(getOverlayElement().style.clipPath).toContain("polygon");
  });

  it("positions lower steps to the side and renders the spotlight ring", async () => {
    const helpers = renderAppTour({ targets: { home: makeRect({ x: 50, y: 200, width: 60, height: 40 }) } });
    await helpers.next();
    const card = findCardByText("Dashboard");
    expect(card.className).toContain("hasArrowLeft");
    expect(card.style.left).toBe("130px");
    const ring = findClassFragment("spotlightRing");
    expect(ring.style.left).toBe("38px");
    expect(ring.style.top).toBe("188px");
  });

  it("falls back to centered cards when a spotlight target is missing", async () => {
    const helpers = renderAppTour();
    await helpers.next();
    const overlay = getOverlayElement();
    const card = findCardByText("Dashboard");
    expect(overlay.style.clipPath).toBe("");
    expect(card.style.transform).toContain("translate(-50%, -50%)");
  });

  it("jumps to a selected step via progress dots and renders its icon", async () => {
    const helpers = renderAppTour({ targets: { calendar: makeRect({ x: 80, y: 150, width: 40, height: 30 }) } });
    await helpers.jumpTo(2);
    expect(screen.getByText("Calendar")).toBeVisible();
    expect(screen.getByTestId("icon-Calendar")).toBeVisible();
    expect(screen.getByText("3 / 7")).toBeVisible();
  });

  it("shows back navigation and returns to the welcome step", async () => {
    const helpers = renderAppTour({ targets: { home: makeRect({ x: 70, y: 150 }) } });
    await helpers.next();
    expect(screen.getByText("Back")).toBeVisible();
    await helpers.back();
    expect(screen.getByText("Welcome to StudyFlax")).toBeVisible();
  });

  it("completes the tour on Finish and calls onDone", async () => {
    const onDone = vi.fn();
    const helpers = renderAppTour({ onDone, targets: { attendance: makeRect({ x: 40, y: 260, width: 70, height: 50 }) } });
    await helpers.advanceToFinalStep();
    expect(screen.getByText("Finish")).toBeVisible();
    await helpers.next();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("navigates using keyboard shortcuts (Right, Enter, Left, Esc) and handles edge cases", async () => {
    const onDone = vi.fn();
    const helpers = renderAppTour({ onDone });
    
    // Press unmapped key (branch coverage)
    await helpers.key("x");
    expect(screen.getByText("Welcome to StudyFlax")).toBeVisible();

    // Press ArrowLeft on step 0 (branch coverage for prev() limit)
    await helpers.key("ArrowLeft");
    expect(screen.getByText("Welcome to StudyFlax")).toBeVisible();

    await helpers.key("ArrowRight"); // Dashboard
    expect(screen.getByText("Dashboard")).toBeVisible();
    await helpers.key("Enter"); // Calendar
    expect(screen.getByText("Calendar")).toBeVisible();
    await helpers.key("ArrowLeft"); // Dashboard
    expect(screen.getByText("Dashboard")).toBeVisible();
    await helpers.key("Escape"); // Skip
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
