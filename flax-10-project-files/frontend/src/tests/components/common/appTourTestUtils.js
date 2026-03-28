/*
 * Shared helpers for app tour component tests.
 */

import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AppTour from "@/components/common/AppTour/AppTour";

const TOTAL_STEPS = 7;

export const defaultRect = { x: 60, y: 200, width: 80, height: 40 };

export function makeRect(overrides = {}) {
  return { ...defaultRect, ...overrides };
}

export function mockTourTargets(targetRects = {}) {
  vi.spyOn(document, "querySelector").mockImplementation((selector) => {
    const match = selector.match(/data-tour="([^"]+)"/);
    const rect = match ? targetRects[match[1]] : null;
    if (!rect) return null;
    return { getBoundingClientRect: () => rect };
  });
}

export function getOverlayElement() {
  const dialog = screen.getByRole("dialog", { name: "App tour" });
  return Array.from(dialog.querySelectorAll("div")).find((element) => {
    const name = String(element.className || "");
    return name.includes("overlay") && !name.includes("overlayWrap");
  });
}

export function findCardByText(text) {
  const dialog = screen.getByRole("dialog", { name: "App tour" });
  return Array.from(dialog.querySelectorAll("div[style]"))
    .find((element) => element.textContent?.includes(text));
}

export function findClassFragment(fragment) {
  const dialog = screen.getByRole("dialog", { name: "App tour" });
  return Array.from(dialog.querySelectorAll("*"))
    .find((element) => String(element.className || "").includes(fragment));
}

export async function flushTour(ms = 10) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

export async function clickTourButton(name) {
  fireEvent.click(screen.getByRole("button", { name }));
  await flushTour();
}

export async function clickTourText(text) {
  fireEvent.click(screen.getByText(text));
  await flushTour();
}

export async function pressTourKey(keyName) {
  fireEvent.keyDown(window, { key: keyName });
  await flushTour();
}

export async function advanceTourSteps(count = TOTAL_STEPS - 1) {
  for (let index = 0; index < count; index += 1) {
    await clickTourButton(/next|finish/i);
  }
}

export async function completeRenderedTour() {
  await advanceTourSteps();
  await clickTourButton(/next|finish/i);
}

export function renderAppTour(options = {}) {
  const { targets, onDone = vi.fn() } = options;
  if (targets) mockTourTargets(targets);
  const utils = render(createElement(AppTour, { onDone }));
  const next = () => clickTourButton(/next|finish/i);
  const back = () => clickTourText("Back");
  const jumpTo = (index) => clickTourButton(new RegExp(`^Go to step ${index + 1}`));
  const key = (keyName) => pressTourKey(keyName);
  const skip = () => fireEvent.click(screen.getByText("Skip tour"));
  return { ...utils, onDone, next, back, jumpTo, key, skip, advanceToFinalStep: advanceTourSteps, completeTour: completeRenderedTour, flush: flushTour };
}
