import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSummary = vi.fn();

vi.mock("../../../../pages/timer/TimerPage.module.css", () => ({ default: {} }));
vi.mock("../../../../components/timer/utils/timerFormatters", () => ({
  fmtDuration: (secs) => `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`,
}));
vi.mock("../../../../api/analyticsApi", () => ({
  default: { getSummary: (...args) => mockGetSummary(...args) },
}));

import { DailyGoalWidget, GoalEditor } from "../../../../components/timer/presets/DailyGoalWidget";

describe("DailyGoalWidget coverage topups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSummary.mockResolvedValue({ summary: { total_study_hours: 1 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the goal editor from the toggle view", () => {
    const setGoalInput = vi.fn();
    const setEditingGoal = vi.fn();

    render(
      <GoalEditor
        editingGoal={false}
        goalHours={6}
        setGoalInput={setGoalInput}
        setEditingGoal={setEditingGoal}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "6h" }));

    expect(setGoalInput).toHaveBeenCalledWith("6");
    expect(setEditingGoal).toHaveBeenCalledWith(true);
  });

  it("persists valid goal input and closes invalid or escaped edits", () => {
    const setGoalInput = vi.fn();
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();

    const { rerender } = render(
      <GoalEditor
        editingGoal
        goalInput="abc"
        setGoalInput={setGoalInput}
        setGoalHours={setGoalHours}
        setEditingGoal={setEditingGoal}
      />,
    );

    fireEvent.blur(screen.getByRole("spinbutton"));
    expect(setGoalHours).not.toHaveBeenCalled();
    expect(setEditingGoal).toHaveBeenCalledWith(false);

    rerender(
      <GoalEditor
        editingGoal
        goalInput="2.5"
        setGoalInput={setGoalInput}
        setGoalHours={setGoalHours}
        setEditingGoal={setEditingGoal}
      />,
    );

    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Enter" });
    expect(setGoalHours).toHaveBeenCalledWith(2.5);
    expect(localStorage.getItem("timerDailyGoalHours")).toBe("2.5");

    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Escape" });
    expect(setEditingGoal).toHaveBeenCalledWith(false);
  });

  it("closes the goal editor when Escape is pressed on a fresh edit", () => {
    const setEditingGoal = vi.fn();

    render(
      <GoalEditor
        editingGoal
        goalInput="3"
        setGoalInput={vi.fn()}
        setGoalHours={vi.fn()}
        setEditingGoal={setEditingGoal}
      />,
    );

    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "Escape" });
    expect(setEditingGoal).toHaveBeenCalledWith(false);
  });

  it("updates the goal input and ignores unrelated keys", () => {
    const setGoalInput = vi.fn();
    const setGoalHours = vi.fn();
    const setEditingGoal = vi.fn();

    render(
      <GoalEditor
        editingGoal
        goalInput="3"
        setGoalInput={setGoalInput}
        setGoalHours={setGoalHours}
        setEditingGoal={setEditingGoal}
      />,
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "5.5" } });
    fireEvent.keyDown(input, { key: "Tab" });

    expect(setGoalInput).toHaveBeenCalledWith("5.5");
    expect(setGoalHours).not.toHaveBeenCalled();
    expect(setEditingGoal).not.toHaveBeenCalled();
  });

  it("cancels pending analytics updates after unmount", async () => {
    let resolveSummary;
    const summaryPromise = new Promise((resolve) => {
      resolveSummary = resolve;
    });
    mockGetSummary.mockReturnValueOnce(summaryPromise);

    const { unmount } = render(<DailyGoalWidget />);

    await waitFor(() => expect(mockGetSummary).toHaveBeenCalledWith(1));

    unmount();

    await act(async () => {
      resolveSummary({ summary: { total_study_hours: 9 } });
      await summaryPromise;
    });
  });
});
