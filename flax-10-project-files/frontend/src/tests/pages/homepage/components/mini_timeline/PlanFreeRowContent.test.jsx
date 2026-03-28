import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanFreeRowContent } from "@/pages/homepage/components/mini_timeline/parts/PlanFreeRowContent";

vi.mock("@/pages/homepage/components/mini_timeline/helpers/gapRowUtils", () => ({
  formatGapDuration: vi.fn((mins) => `${mins}m`),
  getGapRecommendationTitle: vi.fn((task) => task?.title || ""),
}));
vi.mock("@/pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: vi.fn((task) => task?.estimated_blocks ? task.estimated_blocks * 25 : 25),
}));
vi.mock("@/pages/homepage/utils/planTimelineRows", () => ({
  CAMPUS_DISPLAY: { waterloo: "Waterloo", strand: "Strand" },
}));

const baseStyles = {
  planTimelineGapShortWindow: "sw", planTimelineGapShortWindowNoActions: "na",
  planTimelineGapShortWindowFeatured: "feat", planTimelineGapShortWindowBest: "best",
  planTimelineGapRail: "rail", planTimelineGapMain: "main", planTimelineGapLeadDot: "dot",
  planTimelineGapShortDur: "dur", planTimelineGapFreeWord: "free", planTimelineGapSeparator: "sep",
  planTimelineGapSuggestionText: "sug", planTimelineGapNoTasks: "notask",
  planTimelineGapActions: "actions", planTimelineGapTaskMeta: "meta",
  planTimelineGapSkipBtn: "skip", planTimelineGapStartBtnSm: "start",
  planTimelineGapTaskTitle: "title", planTimelineGapTransit: "transit",
  planTimelineGapTransitIcon: "icon", planTimelineGapTransitBody: "body",
  planTimelineGapTransitLabel: "label", planTimelineGapTransitMeta: "tmeta",
  planTimelineGapTransitPartial: "partial", planTimelineGapTransitPartialTop: "top",
  planTimelineGapTransitPartialFree: "pfree", planTimelineGapShortTaskRow: "taskrow",
};

const task = { id: "t1", title: "Write report", estimated_blocks: 2, priority: "medium" };
const urgentTask = { id: "t2", title: "Urgent hw", priority: "urgent" };
const overdueTask = { id: "t3", title: "Essay", due_date: "2024-01-01T00:00:00.000Z" };

describe("PlanFreeRowContent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders transit layout for transit type", () => {
    const ctx = { type: "transit", prevCampus: "waterloo", nextCampus: "strand", transitMins: 15 };
    render(<PlanFreeRowContent styles={baseStyles} gapContext={ctx} durationLabel="30m" />);
    expect(screen.getByText("Waterloo → Strand")).toBeTruthy();
  });

  it("falls back to generic campus labels for transit gaps", () => {
    const ctx = { type: "transit", prevCampus: "unknown", nextCampus: "other", transitMins: 12 };
    render(<PlanFreeRowContent styles={baseStyles} gapContext={ctx} durationLabel="15m" />);
    expect(screen.getByText("campus → next campus")).toBeTruthy();
  });

  it("renders transit-partial layout with assigned task", () => {
    const ctx = { type: "transit-partial", prevCampus: "strand", nextCampus: "waterloo", transitMins: 10, freeAfterTransit: 20 };
    render(<PlanFreeRowContent styles={baseStyles} gapContext={ctx} durationLabel="30m" assignedTask={task} onStartTask={vi.fn()} />);
    expect(screen.getByText(/Strand → Waterloo/)).toBeTruthy();
    expect(screen.getByText("Write report")).toBeTruthy();
  });

  it("renders transit-partial without a task and shows free-after fallback", () => {
    const ctx = { type: "transit-partial", prevCampus: "unknown", nextCampus: "other", transitMins: 8 };
    render(<PlanFreeRowContent styles={baseStyles} gapContext={ctx} durationLabel="20m" />);
    expect(screen.getByText("campus → next campus (~8m)")).toBeTruthy();
    expect(screen.getByText("0m free after")).toBeTruthy();
  });

  it("renders personal passive gap", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "personal" }} durationLabel="20m" />);
    expect(screen.getByText("Short breather")).toBeTruthy();
  });

  it("renders evening passive gap", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "evening" }} durationLabel="1h" />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("renders study gap with no candidate task", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="45m" />);
    expect(screen.getByText("Short breather")).toBeTruthy();
  });

  it("renders study gap with candidate task and calls onStartTask", () => {
    const onStartTask = vi.fn();
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="50m" candidateTask={task} onStartTask={onStartTask} />);
    expect(screen.getByText("Write report")).toBeTruthy();
    fireEvent.click(screen.getByText("Slot in →"));
    expect(onStartTask).toHaveBeenCalledWith(task);
  });

  it("applies best gap styling when flagged", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="40m" candidateTask={task} onStartTask={vi.fn()} isBestGap />);
    const wrapper = screen.getByText("Write report").closest(".sw");
    expect(wrapper?.className).toContain("best");
  });

  it("renders urgent emoji for urgent tasks", () => {
    const onStartTask = vi.fn();
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="25m" candidateTask={urgentTask} onStartTask={onStartTask} />);
    expect(screen.getByTitle("❗ Urgent hw")).toBeTruthy();
  });

  it("flags overdue tasks with urgency", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="30m" candidateTask={overdueTask} onStartTask={vi.fn()} />);
    expect(screen.getByTitle("❗ Essay")).toBeTruthy();
  });

  it("renders skip button when onSkipTask and task.id provided", () => {
    const onSkipTask = vi.fn();
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="55m" candidateTask={task} onSkipTask={onSkipTask} onStartTask={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Skip Write report"));
    expect(onSkipTask).toHaveBeenCalledWith("t1");
  });

  it("does not render skip button when no task.id", () => {
    render(<PlanFreeRowContent styles={baseStyles} gapContext={{ type: "study" }} durationLabel="25m" candidateTask={{ title: "No ID" }} onSkipTask={vi.fn()} onStartTask={vi.fn()} />);
    expect(screen.queryByText("✕")).toBeNull();
  });
});
