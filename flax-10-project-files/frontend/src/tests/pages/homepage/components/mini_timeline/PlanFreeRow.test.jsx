import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanFreeRow } from "@/pages/homepage/components/mini_timeline/PlanFreeRow";

vi.mock("@/pages/homepage/utils/timelineUtils", () => ({
  getGapStartDate: vi.fn(() => new Date("2026-03-28T09:15:00Z")),
}));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/deadlineTask", () => ({
  buildDeadlineTask: vi.fn(() => null),
}));
vi.mock("@/pages/homepage/components/mini_timeline/helpers/gapRowUtils", () => ({
  formatGapDuration: vi.fn(() => "30m"),
  getGapMinHeight: vi.fn(() => 80),
  getGapTimeLabel: vi.fn(() => "9:15 AM"),
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/PlanFreeRowContent", () => ({
  PlanFreeRowContent: ({ gapContext, durationLabel, candidateTask, onStartTask, onSkipTask }) => (
    <div data-testid="free-content">
      <span>{gapContext.type}</span>
      <span>{durationLabel}</span>
      {candidateTask && <span data-testid="candidate">{candidateTask.title}</span>}
      <button onClick={() => onStartTask(candidateTask)}>Start</button>
      {onSkipTask && <button onClick={() => onSkipTask("t1")}>Skip</button>}
    </div>
  ),
}));
vi.mock("@/pages/homepage/components/mini_timeline/parts/TimelineRowLayout", () => ({
  TimelineRowLayout: ({ children }) => <div data-testid="row">{children}</div>,
  TimelineGutter: ({ timeLabel }) => <div data-testid="gutter">{timeLabel}</div>,
  TimelineSpineCell: () => <div data-testid="spine" />,
}));

const styles = { planTimelineRowGap: "gap" };
const row = { id: "g1", gapStartMins: 75, minutes: 30 };

describe("PlanFreeRow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders with default study context when no gapContext provided", () => {
    render(<PlanFreeRow row={row} styles={styles} selectedDate={new Date()} />);
    expect(screen.getByText("study")).toBeTruthy();
  });

  it("uses assignedTask over deadline suggestion", () => {
    const assigned = { id: "t1", title: "My Task", estimated_blocks: 2 };
    render(<PlanFreeRow row={row} styles={styles} assignedTask={assigned} selectedDate={new Date()} />);
    expect(screen.getByTestId("candidate").textContent).toBe("My Task");
  });

  it("calls onQuickStart with computed date on Start click", () => {
    const onQuickStart = vi.fn();
    render(<PlanFreeRow row={row} styles={styles} selectedDate={new Date()} onQuickStart={onQuickStart} />);
    fireEvent.click(screen.getByText("Start"));
    expect(onQuickStart).toHaveBeenCalled();
  });
});
