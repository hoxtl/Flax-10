import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const getEventTypeMock = vi.fn((event) => event.kind || "other");

vi.mock("../../../pages/Homepage/components/IntelligenceWidgets", () => ({
  IntelligenceHero: (props) => (
    <div data-testid="hero">
      <button type="button" onClick={props.onDismissCourseChange}>dismiss-course-change</button>
      {JSON.stringify(props)}
    </div>
  ),
}));

vi.mock("../../../pages/Homepage/components/RightNowWidget", () => ({
  RightNowWidget: (props) => <div data-testid="right-now">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/Homepage/components/HomepageTimelineSection", () => ({
  HomepageTimelineSection: (props) => <div data-testid="big-timeline">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/Homepage/components/SemesterOverviewWidget", () => ({
  default: (props) => <div data-testid="semester">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/Homepage/components/StudyStreakWidget", () => ({
  default: () => <div data-testid="study-streak">study streak</div>,
}));

vi.mock("../../../pages/Homepage/components/WeeklyGoalWidget", () => ({
  default: () => <div data-testid="weekly-goal">weekly goal</div>,
}));

vi.mock("../../../pages/Homepage/components/PhotoWidget", () => ({
  default: (props) => <div data-testid="photo">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/Analytics/ProductivityCards", () => ({
  default: (props) => <div data-testid="productivity-cards">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/Analytics/DailyBreakdownChart", () => ({
  default: (props) => <div data-testid="daily-breakdown">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/Analytics/StudyHeatmap", () => ({
  default: (props) => <div data-testid="heatmap">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/Analytics/AttendanceChart", () => ({
  default: () => <div data-testid="attendance-chart">attendance</div>,
}));

vi.mock("../../../components/Analytics/InsightCards", () => ({
  ConsistencyScore: (props) => <div data-testid="consistency">{JSON.stringify(props)}</div>,
  PeakHoursCard: (props) => <div data-testid="peak-hours">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/Homepage/components/TinyTimelineWidget", () => ({
  TinyTimelineWidget: (props) => <div data-testid="tiny-timeline">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/Calendar/utils/eventUtils", () => ({
  getEventType: (...args) => getEventTypeMock(...args),
}));

import { renderIntelligenceWidget } from "../../../pages/Homepage/components/IntelligenceWidgetRenderer";

function Slot6Marker(props) {
  return <div data-testid="slot6-base">{JSON.stringify(props)}</div>;
}

const baseProps = {
  displayName: "Ava",
  slot1TodayTasks: <div data-testid="slot1-base">slot1</div>,
  slot3Urgent: <div data-testid="slot3-base">slot3</div>,
  slot5Data: { now: "2024-03-08T10:00:00Z", sortedEvents: [] },
  slot6Timeline: <Slot6Marker />,
  timelineProps: { sortedEvents: [{ id: 1 }] },
  upcomingDeadlines: [],
  calendarEvents: [],
  profile: { role: "student", summary: { societies: [] } },
  dashboard: {
    edit: true,
    attendance: { pct: 87 },
    live: {
      liveContext: "Focused",
      classesCount: 2,
      tasksCount: 3,
      nextStep: "Read",
      nextStepMeta: "Soon",
      weeklyProgress: 70,
      currentStreak: 5,
    },
    courseChangeRequest: true,
    teacherRequestPending: false,
    setShowCourseChange: vi.fn(),
    setShowTeacherRequest: vi.fn(),
    tflDelays: [{ id: "delay-1" }],
    analytics: {
      loading: false,
      progressData: { weekly: 4 },
      data: {
        summary: { total_hours: 8 },
        daily_breakdown: [{ day: "Mon", value: 1 }],
        heatmap: { data: [[10]], hours: ["09"] },
      },
    },
  },
};

function renderWidget(id, props = baseProps, size = { row: 2 }) {
  return render(<>{renderIntelligenceWidget(id, props, size)}</>);
}

describe("IntelligenceWidgetRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero widget with live dashboard props", () => {
    renderWidget("hero");
    expect(screen.getByTestId("hero").textContent).toContain('"displayName":"Ava"');
    expect(screen.getByTestId("hero").textContent).toContain('"attendancePct":87');
    expect(screen.getByTestId("hero").textContent).toContain('"tasksCount":3');
  });

  it("counts upcoming deadlines and society events for the hero widget", () => {
    const props = {
      ...baseProps,
      profile: {
        role: "teacher",
        summary: { societies: [{ society_id: 5, name: "Chess Club" }] },
      },
      upcomingDeadlines: [
        { id: 1, start_due_date: "2026-03-09T10:00:00Z" },
        { id: 2 },
        { id: 3, start_due_date: "2026-03-11T10:00:00Z" },
      ],
      calendarEvents: [
        { id: 10, kind: "society", society_id: 5, society_name: "Chess Club", start_time: "2024-03-10T10:00:00Z" },
        { id: 11, kind: "society", society_id: 8, society_name: "Other Club", start_time: "2024-03-10T10:00:00Z" },
        { id: 12, kind: "lecture", start_time: "2024-03-10T10:00:00Z" },
      ],
    };

    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"deadlinesCount":2');
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
    expect(screen.getByTestId("hero").textContent).toContain('"isTeacher":true');
    screen.getByText("dismiss-course-change").click();
    expect(props.dashboard.setShowCourseChange).toHaveBeenCalledWith(false);
  });

  it("renders the right-now widget with slot data and tfl delays", () => {
    renderWidget("rightNow");
    expect(screen.getByTestId("right-now").textContent).toContain('"now":"2024-03-08T10:00:00Z"');
    expect(screen.getByTestId("right-now").textContent).toContain('"tflDelays":[{"id":"delay-1"}]');
  });

  it("clones task and deadline slots with the requested row size", () => {
    const { rerender } = render(<>{renderIntelligenceWidget("todayTasks", baseProps, { row: 1 })}</>);
    expect(screen.getByTestId("slot1-base")).toHaveAttribute("row", "1");

    rerender(<>{renderIntelligenceWidget("deadlines", baseProps, { row: 3 })}</>);
    expect(screen.getByTestId("slot3-base")).toHaveAttribute("row", "3");
  });

  it("renders timeline props as a widget and falls back to cloning slot6 when needed", () => {
    const { rerender } = renderWidget("bigTimeline");
    expect(screen.getByTestId("big-timeline").textContent).toContain('"row":2');
    expect(screen.getByTestId("big-timeline").textContent).toContain('"isWidget":true');

    rerender(
      <>{renderIntelligenceWidget("bigTimeline", { ...baseProps, timelineProps: null }, { row: 4 })}</>,
    );
    expect(screen.getByTestId("slot6-base")).toHaveTextContent('"row":4');
    expect(screen.getByTestId("slot6-base")).toHaveTextContent('"isWidget":true');
  });

  it("renders analytics shells across loading, empty, and populated states", () => {
    const { rerender } = render(
      <>{renderIntelligenceWidget("analyticsProductivity", {
        ...baseProps,
        dashboard: { ...baseProps.dashboard, analytics: { ...baseProps.dashboard.analytics, loading: true } },
      }, { row: 2 })}</>,
    );
    expect(screen.getByText("PRODUCTIVITY")).toBeTruthy();
    expect(screen.getByText("Loading analytics…")).toBeTruthy();

    rerender(
      <>{renderIntelligenceWidget("analyticsInsights", {
        ...baseProps,
        dashboard: { ...baseProps.dashboard, analytics: { ...baseProps.dashboard.analytics, loading: false, data: {} } },
      }, { row: 2 })}</>,
    );
    expect(screen.getByText("No insights data yet.")).toBeTruthy();

    rerender(<>{renderIntelligenceWidget("analyticsDailyBreakdown", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("daily-breakdown")).toBeTruthy();

    rerender(<>{renderIntelligenceWidget("analyticsHeatmap", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("heatmap")).toBeTruthy();
  });

  it("renders the remaining widgets and returns null for unknown ids", () => {
    const { rerender, container } = renderWidget("semesterOverview");
    expect(screen.getByTestId("semester").textContent).toContain('"row":2');

    rerender(<>{renderIntelligenceWidget("studyStreak", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("study-streak")).toBeTruthy();

    rerender(<>{renderIntelligenceWidget("weeklyGoal", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("weekly-goal")).toBeTruthy();

    rerender(<>{renderIntelligenceWidget("photo", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("photo").textContent).toContain('"editMode":true');

    rerender(<>{renderIntelligenceWidget("tinyTimeline", baseProps, { row: 5 })}</>);
    expect(screen.getByTestId("tiny-timeline").textContent).toContain('"row":5');

    rerender(<>{renderIntelligenceWidget("analyticsAttendance", baseProps, { row: 2 })}</>);
    expect(screen.getByTestId("attendance-chart")).toBeTruthy();

    rerender(<>{renderIntelligenceWidget("does-not-exist", baseProps, { row: 2 })}</>);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders analytics empty states when summary or heatmap data is absent", () => {
    const { rerender } = render(
      <>{renderIntelligenceWidget("analyticsProductivity", {
        ...baseProps,
        dashboard: { ...baseProps.dashboard, analytics: { ...baseProps.dashboard.analytics, data: null } },
      }, { row: 2 })}</>,
    );
    expect(screen.getByText("No productivity data yet.")).toBeTruthy();

    rerender(
      <>{renderIntelligenceWidget("analyticsHeatmap", {
        ...baseProps,
        dashboard: { ...baseProps.dashboard, analytics: { ...baseProps.dashboard.analytics, data: { heatmap: { data: [] } } } },
      }, { row: 2 })}</>,
    );
    expect(screen.getByText("No focus heatmap data yet.")).toBeTruthy();
  });
});
