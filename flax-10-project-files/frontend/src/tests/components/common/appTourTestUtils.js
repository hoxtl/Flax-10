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

export function renderAppTour(options = {}) {
  const { targets, onDone = vi.fn() } = options;
  if (targets) mockTourTargets(targets);
  const utils = render(createElement(AppTour, { onDone }));
  const flush = async (ms = 10) => {
    await act(async () => { await new Promise(r => setTimeout(r, ms)); });
  };
  const next = async () => {
    fireEvent.click(screen.getByRole("button", { name: /next|finish/i }));
    await flush();
  };
  const back = async () => {
    fireEvent.click(screen.getByText("Back"));
    await flush();
  };
  const jumpTo = async (index) => {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Go to step ${index + 1}`) }));
    await flush();
  };
  const key = async (keyName) => {
    fireEvent.keyDown(window, { key: keyName });
    await flush();
  };
  const skip = () => fireEvent.click(screen.getByText("Skip tour"));
  const advanceToFinalStep = async () => {
    for (let i = 0; i < TOTAL_STEPS - 1; i += 1) await next();
  };
  const completeTour = async () => {
    await advanceToFinalStep();
    await next();
  };
  return { ...utils, onDone, next, back, jumpTo, key, skip, advanceToFinalStep, completeTour, flush };
}
