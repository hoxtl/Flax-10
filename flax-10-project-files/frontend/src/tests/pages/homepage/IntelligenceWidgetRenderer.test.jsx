import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const getEventTypeMock = vi.fn((event) => event.kind || "other");

vi.mock("../../../pages/homepage/components/IntelligenceWidgets", () => ({
  IntelligenceHero: (props) => (
    <div data-testid="hero">
      <button type="button" onClick={props.onDismissCourseChange}>dismiss-course-change</button>
      {JSON.stringify(props)}
    </div>
  ),
}));

vi.mock("../../../pages/homepage/components/RightNowWidget", () => ({
  RightNowWidget: (props) => <div data-testid="right-now">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/homepage/components/HomepageTimelineSection", () => ({
  HomepageTimelineSection: (props) => <div data-testid="big-timeline">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/homepage/components/SemesterOverviewWidget", () => ({
  default: (props) => <div data-testid="semester">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/homepage/components/StudyStreakWidget", () => ({
  default: () => <div data-testid="study-streak">study streak</div>,
}));

vi.mock("../../../pages/homepage/components/WeeklyGoalWidget", () => ({
  default: () => <div data-testid="weekly-goal">weekly goal</div>,
}));

vi.mock("../../../pages/homepage/components/PhotoWidget", () => ({
  default: (props) => <div data-testid="photo">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/analytics/ProductivityCards", () => ({
  default: (props) => <div data-testid="productivity-cards">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/analytics/DailyBreakdownChart", () => ({
  default: (props) => <div data-testid="daily-breakdown">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/analytics/StudyHeatmap", () => ({
  default: (props) => <div data-testid="heatmap">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/analytics/AttendanceChart", () => ({
  default: () => <div data-testid="attendance-chart">attendance</div>,
}));

vi.mock("../../../components/analytics/InsightCards", () => ({
  ConsistencyScore: (props) => <div data-testid="consistency">{JSON.stringify(props)}</div>,
  PeakHoursCard: (props) => <div data-testid="peak-hours">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../pages/homepage/components/TinyTimelineWidget", () => ({
  TinyTimelineWidget: (props) => <div data-testid="tiny-timeline">{JSON.stringify(props)}</div>,
}));

vi.mock("../../../components/calendar/utils/eventUtils", () => ({
  getEventType: (...args) => getEventTypeMock(...args),
}));

import { renderIntelligenceWidget } from "../../../pages/homepage/components/IntelligenceWidgetRenderer";

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
    const props = { ...baseProps, upcomingDeadlines: [{ id: 1, start_due_date: "2026-03-09T10:00:00Z" }, { id: 2 }], calendarEvents: [{ id: 10, kind: "society", society_id: 5, start_time: "2024-03-10T10:00:00Z" }] };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"deadlinesCount":1');
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
  });

  it("counts society events from the timeline fallback when calendar events are absent", () => {
    const props = {
      ...baseProps,
      calendarEvents: [],
      slot5Data: {
        now: "2024-03-08T10:00:00Z",
        sortedEvents: [
          { id: 11, kind: "society", society_id: 7, start_time: "2024-03-10T10:00:00Z" },
          { id: 12, kind: "club", start_time: "2024-03-11T10:00:00Z" },
        ],
      },
      profile: { role: "student", summary: { societies: [{ society_id: 7, name: "Robotics Society" }] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
  });

  it("counts society events matched by name and ignores events missing a start time", () => {
    const props = {
      ...baseProps,
      calendarEvents: [],
      slot5Data: {
        now: "2024-03-08T10:00:00Z",
        sortedEvents: [
          { id: 21, kind: "society", society_name: "Robotics Society", start_time: "2024-03-10T10:00:00Z" },
          { id: 22, kind: "society", society_id: 7 },
        ],
      },
      profile: { role: "student", summary: { societies: [{ name: "Robotics Society" }] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
  });

  it("counts mixed hero inputs across deadline and society event branches", () => {
    const props = {
      ...baseProps,
      upcomingDeadlines: [
        { id: 1, start_due_date: "2026-03-09T10:00:00Z" },
        { id: 2 },
      ],
      calendarEvents: [
        { id: 31, kind: "society", society_id: 7, start_time: "2024-03-10T10:00:00Z" },
        { id: 32, kind: "society", society_name: "Robotics Society", start_time: "2024-03-11T10:00:00Z" },
        { id: 33, kind: "society", society_id: 7 },
      ],
      profile: { role: "student", summary: { societies: [{ society_id: 7, name: "Robotics Society" }] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"deadlinesCount":1');
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":2');
  });

  it("falls back to empty hero counts when the supporting data is missing", () => {
    const props = {
      ...baseProps,
      upcomingDeadlines: undefined,
      calendarEvents: undefined,
      slot5Data: undefined,
      profile: { role: "student", summary: { societies: [] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"deadlinesCount":0');
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":0');
  });

  it("counts society memberships using the id fallback when the name is empty", () => {
    const props = {
      ...baseProps,
      calendarEvents: [{ id: 41, kind: "society", society_id: 99, start_time: "2024-03-10T10:00:00Z" }],
      profile: { role: "student", summary: { societies: [{ id: 99, name: "" }] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
  });

  it("counts society memberships from the timeline fallback using the id fallback", () => {
    const props = {
      ...baseProps,
      calendarEvents: [],
      slot5Data: {
        now: "2024-03-08T10:00:00Z",
        sortedEvents: [{ id: 51, kind: "society", society_id: 99, start_time: "2024-03-10T10:00:00Z" }],
      },
      profile: { role: "student", summary: { societies: [{ id: 99, name: "" }] } },
    };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"upcomingSocietyEventsCount":1');
  });

  it("handles course change dismissal and teacher role in hero", () => {
    const props = { ...baseProps, profile: { role: "teacher", summary: { societies: [] } } };
    renderWidget("hero", props);
    expect(screen.getByTestId("hero").textContent).toContain('"isTeacher":true');
    screen.getByText("dismiss-course-change").click();
    expect(props.dashboard.setShowCourseChange).toHaveBeenCalledWith(false);
  });

  it("renders the right-now widget with slot data and tfl delays", () => {
    renderWidget("rightNow");
    expect(screen.getByTestId("right-now").textContent).toContain('"now":"2024-03-08T10:00:00Z"');
    expect(screen.getByTestId("right-now").textContent).toContain('"tflDelays":[{"id":"delay-1"}]');
  });

  it("renders the populated insights widget", () => {
    renderWidget("analyticsInsights", baseProps, { row: 2 });
    expect(screen.getByTestId("consistency")).toBeInTheDocument();
    expect(screen.getByTestId("peak-hours")).toBeInTheDocument();
  });

  it("clones task and deadline slots with the requested row size", () => {
    const { rerender } = render(<>{renderIntelligenceWidget("todayTasks", baseProps, { row: 1 })}</>);
    expect(screen.getByTestId("slot1-base")).toHaveAttribute("row", "1");

    rerender(<>{renderIntelligenceWidget("deadlines", baseProps, { row: 3 })}</>);
    expect(screen.getByTestId("slot3-base")).toHaveAttribute("row", "3");
  });

  it("returns the original slot when it is not a valid React element", () => {
    const { container } = render(<>{renderIntelligenceWidget("todayTasks", { ...baseProps, slot1TodayTasks: null }, { row: 1 })}</>);
    expect(container).toBeEmptyDOMElement();
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

  it("renders empty states for analytics breakdown widgets", () => {
    const emptyProps = {
      ...baseProps,
      dashboard: {
        ...baseProps.dashboard,
        analytics: {
          ...baseProps.dashboard.analytics,
          loading: false,
          data: {},
        },
      },
    };
    render(<>{renderIntelligenceWidget("analyticsDailyBreakdown", emptyProps, { row: 2 })}</>);
    expect(screen.getByText("No daily-breakdown data yet.")).toBeTruthy();

    render(<>{renderIntelligenceWidget("analyticsHeatmap", emptyProps, { row: 2 })}</>);
    expect(screen.getByText("No focus heatmap data yet.")).toBeTruthy();
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
