import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, waitFor } from "@testing-library/react";

import { HomepageTimelineSection, MiniTimeline } from "../../../pages/Homepage/components";
import { renderIntelligenceWidget } from "../../../pages/Homepage/components/IntelligenceWidgetRenderer";
import {
  TaskWidgetAllDone,
  TaskWidgetEmpty,
  TaskWidgetHiddenLink,
  TaskWidgetCompletedSection,
} from "../../../pages/Homepage/components/TaskWidgetSections";
import { TaskWidgetRow } from "../../../pages/Homepage/components/TaskWidgetRow";
import {
  getCategoryStyle,
  getEstTime,
  getUrgencyMeta,
} from "../../../pages/Homepage/components/TaskWidgetUtils";
import {
  ActiveEventCard,
  TflDelayCard,
  ConflictSummary,
  CommuteContextCard,
} from "../../../pages/Homepage/components/RightNowSubComponents";
import {
  getTimeLeftBand,
  getCurrentBlock,
  getNextEvent,
  hasCampusCommute,
  formatTimeLeft,
  getJourneySummary,
  getLeaveByInfo,
} from "../../../pages/Homepage/components/RightNowUtils";
import IntelligenceHero from "../../../pages/Homepage/components/IntelligenceWidgets";
import WeeklyGoalWidget from "../../../pages/Homepage/components/WeeklyGoalWidget";
import StudyStreakWidget from "../../../pages/Homepage/components/StudyStreakWidget";
import TinyTimelineWidget from "../../../pages/Homepage/components/TinyTimelineWidget";
import SemesterOverviewWidget from "../../../pages/Homepage/components/SemesterOverviewWidget";
import {
  useSemesterRange,
  useSemesterData,
} from "../../../pages/Homepage/components/useSemesterOverviewData";

const fetchApiMock = vi.fn();
const getEventsMock = vi.fn();
const getUpcomingDeadlinesMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.layout;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock("lucide-react", () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AlertTriangle: Icon,
    BookOpen: Icon,
    Calendar: Icon,
    Clock3: Icon,
    GraduationCap: Icon,
    Train: Icon,
    BarChart3: Icon,
    LayoutGrid: Icon,
    Presentation: Icon,
    TrendingUp: Icon,
    Zap: Icon,
    Target: Icon,
    Flame: Icon,
    Clock: Icon,
    MapPin: Icon,
    CalendarDays: Icon,
    MapPinned: Icon,
    ArrowUpRight: Icon,
    ChevronDown: Icon,
    X: Icon,
  };
});

vi.mock("../../../pages/Homepage/components/IntelligenceWidgets", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, IntelligenceHero: (props) => <div>Hero {props.displayName}</div> };
});

vi.mock("../../../pages/Homepage/components/RightNowWidget", () => ({
  RightNowWidget: () => <div>Right now widget</div>,
}));

vi.mock("../../../pages/Homepage/components/HomepageTimelineSection", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    HomepageTimelineSection: (props) => <div>Timeline widget {String(props.isWidget)}</div>,
  };
});

vi.mock("../../../pages/Homepage/components/SemesterOverviewWidget", () => ({
  default: () => <div>Semester overview widget</div>,
}));

vi.mock("../../../pages/Homepage/components/StudyStreakWidget", () => ({
  default: () => <div>Study streak widget</div>,
}));

vi.mock("../../../pages/Homepage/components/WeeklyGoalWidget", () => ({
  default: () => <div>Weekly goal widget</div>,
}));

vi.mock("../../../pages/Homepage/components/PhotoWidget", () => ({
  default: () => <div>Photo widget</div>,
}));

vi.mock("../../../components/Analytics/ProductivityCards", () => ({
  default: () => <div>Productivity cards</div>,
}));

vi.mock("../../../components/Analytics/DailyBreakdownChart", () => ({
  default: () => <div>Daily breakdown chart</div>,
}));

vi.mock("../../../components/Analytics/StudyHeatmap", () => ({
  default: () => <div>Study heatmap</div>,
}));

vi.mock("../../../components/Analytics/AttendanceChart", () => ({
  default: () => <div>Attendance chart</div>,
}));

vi.mock("../../../components/Analytics/InsightCards", () => ({
  ConsistencyScore: () => <div>Consistency score</div>,
  PeakHoursCard: () => <div>Peak hours</div>,
}));

vi.mock("../../../pages/Homepage/components/TinyTimelineWidget", () => ({
  TinyTimelineWidget: () => <div>Tiny timeline widget</div>,
  default: () => <div>Tiny timeline widget</div>,
}));

vi.mock("../../../components/Tasks/components/AllTasksCompleteCard", () => ({
  default: ({ message, sub, children }) => <div>{message} {sub} {children}</div>,
}));

vi.mock("../../../lib/allTasksCompleteMessages", () => ({
  getClearMessage: () => "All clear",
}));

vi.mock("../../../pages/Homepage/components/EmptyStateCard", () => ({
  default: ({ message, action }) => <div>{message} {action}</div>,
}));

vi.mock("../../../components/common/InlineTitleField/InlineTitleField", () => ({
  default: ({ value, onStart }) => <button onClick={onStart}>{value}</button>,
  useInlineEdit: () => ({
    isEditing: false,
    draft: "Essay",
    setDraft: vi.fn(),
    start: vi.fn(),
    save: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock("../../../pages/Homepage/components/ModulePill", () => ({
  getModulePillColors: vi.fn(() => ({ bg: "#eee", text: "#111" })),
}));

vi.mock("../../../pages/Homepage/utils/eventUtils", () => ({
  isNow: vi.fn((start, end) => new Date(start).getTime() <= Date.now() && new Date(end).getTime() >= Date.now()),
}));

vi.mock("../../../pages/Homepage/utils/kclTflMapping", () => ({
  getTflLinesForLocation: vi.fn((location) => location?.includes("Strand") ? ["Northern"] : []),
  isSevereDisruption: vi.fn((severity) => /severe/i.test(severity || "")),
}));

vi.mock("../../../api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlinesMock(...args),
}));

describe("Homepage widgets", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00Z"));
    localStorage.clear();
    fetchApiMock.mockReset();
    getEventsMock.mockReset();
    getUpcomingDeadlinesMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers the homepage barrel export and intelligence widget registry", () => {
    expect(HomepageTimelineSection).toBeTruthy();
    expect(MiniTimeline).toBeTruthy();

    const dashboardProps = {
      displayName: "Alex",
      dashboard: {
        live: {
          liveContext: { iconKey: "Clock3" },
          eventsCount: 2,
          tasksCount: 3,
          nextStep: "Focus",
          nextStepMeta: "Now",
          weeklyProgress: "60%",
          currentStreak: "4 days",
        },
        courseChangeRequest: null,
        teacherRequestPending: false,
        setShowCourseChange: vi.fn(),
        setShowTeacherRequest: vi.fn(),
        tflDelays: [],
        analytics: { loading: false, data: { summary: {}, daily_breakdown: [{}], heatmap: { data: [1] } }, progressData: {} },
        edit: false,
      },
      slot1TodayTasks: <div>Slot 1</div>,
      slot3Urgent: <div>Slot 3</div>,
      slot5Data: {},
      slot6Timeline: <div>Slot 6</div>,
      timelineProps: { selectedDate: "2026-03-24" },
    };

    expect(renderIntelligenceWidget("hero", dashboardProps, { row: 2 })).toBeTruthy();
    render(<div>{renderIntelligenceWidget("rightNow", dashboardProps, { row: 2 })}</div>);
    expect(screen.getByText("Right now widget")).toBeInTheDocument();
    render(<div>{renderIntelligenceWidget("todayTasks", dashboardProps, { row: 1 })}</div>);
    expect(screen.getByText("Slot 1")).toBeInTheDocument();
    render(<div>{renderIntelligenceWidget("deadlines", dashboardProps, { row: 1 })}</div>);
    expect(screen.getByText("Slot 3")).toBeInTheDocument();
    render(<div>{renderIntelligenceWidget("tinyTimeline", dashboardProps, { row: 1 })}</div>);
    expect(screen.getByText("Tiny timeline widget")).toBeInTheDocument();
    render(<div>{renderIntelligenceWidget("bigTimeline", dashboardProps, { row: 1 })}</div>);
    expect(screen.getByText("Timeline widget true")).toBeInTheDocument();
    expect(renderIntelligenceWidget("unknown", dashboardProps, { row: 1 })).toBeNull();
  });

  it("covers task widget sections, rows, and utils", () => {
    const setShowCompleted = vi.fn();
    const setCtxMenu = vi.fn();
    const handleTaskWidgetComplete = vi.fn();
    const onInlineTaskEdit = vi.fn();

    render(
      <>
        <TaskWidgetAllDone itemCount={2} styles={{ taskWidgetSlotAllDoneWrap: "wrap", taskWidgetPlanTomorrowPill: "pill" }} />
        <TaskWidgetEmpty styles={{ taskWidgetLink: "link" }} />
        <ul><TaskWidgetHiddenLink hiddenCount={2} styles={{ taskWidgetMoreText: "more" }} /></ul>
        <TaskWidgetCompletedSection
          visibleCompleted={[{ id: 1, title: "Done task" }]}
          completedTasks={[{ id: 1 }]}
          showCompleted={true}
          setShowCompleted={setShowCompleted}
          styles={{
            taskWidgetCompletedSection: "section",
            taskWidgetCompletedToggle: "toggle",
            taskWidgetCompletedLabel: "label",
            taskWidgetCompletedStats: "stats",
            taskWidgetCompletedCount: "count",
            taskWidgetCompletedChevronWrap: "wrap",
            taskWidgetCompletedChevron: "chev",
            taskWidgetCompletedList: "list",
            taskWidgetCompletedRow: "row",
            taskWidgetCompletedCheck: "check",
            taskWidgetCompletedTitle: "title",
          }}
        />
        <ul>
          <TaskWidgetRow
            idx={0}
            isOverdue={true}
            rowAccent="#f00"
            task={{ id: 9, title: "Essay" }}
            setCtxMenu={setCtxMenu}
            handleTaskWidgetComplete={handleTaskWidgetComplete}
            onInlineTaskEdit={onInlineTaskEdit}
            categoryLabel="Study"
            categoryStyle={{ bg: "#eee", text: "#111" }}
            urgency={{ label: "Urgent", tone: "urgent" }}
            styles={{
              taskWidgetTaskRow: "row",
              taskWidgetTaskRowOverdue: "overdue",
              taskWidgetTaskRowNext: "next",
              taskWidgetCheckbox: "checkbox",
              taskWidgetCheckboxCircle: "circle",
              taskWidgetTaskBody: "body",
              taskWidgetTaskTopRow: "top",
              taskWidgetCategoryPill: "cat",
              taskWidgetTaskTitle: "title",
              taskWidgetUrgencyPill: "urgency",
              taskWidgetUrgencyPillUrgent: "urgency-urgent",
            }}
          />
        </ul>
      </>
    );

    expect(screen.getByText("All clear")).toBeInTheDocument();
    expect(screen.getByText(/2 tasks completed today/)).toBeInTheDocument();
    expect(screen.getByText("No tasks need attention.")).toBeInTheDocument();
    expect(screen.getByText(/\+ 2 more/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/1 done/));
    expect(setShowCompleted).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Complete Essay"));
    expect(handleTaskWidgetComplete).toHaveBeenCalledWith({ id: 9, title: "Essay" });
    fireEvent.contextMenu(screen.getByText("Essay").closest("li"), { clientX: 10, clientY: 20 });
    expect(setCtxMenu).toHaveBeenCalled();

    expect(getCategoryStyle("study").text).toBeTruthy();
    expect(getCategoryStyle("CS1010").bg).toBeTruthy();
    expect(getEstTime([{ completed: false, estimated_minutes: 90 }])).toBe("~1h 30m left");
    expect(getEstTime([{ completed: true, estimated_minutes: 30 }])).toBeNull();
    expect(getUrgencyMeta({ taskWidgetStatus: "overdue" }).label).toBe("Urgent");
    expect(getUrgencyMeta({ priority: "high" }).tone).toBe("high");
    expect(getUrgencyMeta({ taskWidgetStatus: "now" }).tone).toBe("now");
    expect(getUrgencyMeta({})).toBeNull();
  });

  it("covers right-now subcomponents and utility helpers", () => {
    const onDismiss = vi.fn();
    render(
      <>
        <ActiveEventCard
          currentBlock={{ title: "Lecture", end_time: "2026-03-24T12:20:00Z" }}
          timeRangeStr="12:00-13:00"
          timeLeftStr="20m left"
          currentProgressPct={50}
        />
        <TflDelayCard leaveByInfo={{ message: "Leave now" }} onDismiss={onDismiss} />
        <ConflictSummary conflicts={[{ a: { start_time: "2026-03-24T13:00:00Z" } }]} onDismiss={onDismiss} />
        <CommuteContextCard
          campus={{ shortName: "Strand", name: "Strand Campus" }}
          journey={{ duration: 24, legs: [{ mode: "tube", routeOptions: [{ name: "Northern" }] }] }}
          loading={false}
          leaveByInfo={{ leaveByStr: "12:15" }}
        />
      </>
    );

    expect(screen.getByText("Lecture")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Dismiss delay alert"));
    fireEvent.click(screen.getByLabelText("Dismiss warning"));
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Strand commute/)).toBeInTheDocument();

    const events = [
      { title: "Current", location: "Strand", start_time: "2026-03-24T11:30:00Z", end_time: "2026-03-24T12:30:00Z" },
      { title: "Next", start_time: "2026-03-24T13:30:00Z" },
    ];
    expect(getTimeLeftBand(null)).toBe("over");
    expect(getTimeLeftBand(5)).toBe("under10");
    expect(getTimeLeftBand(20)).toBe("10to30");
    expect(getCurrentBlock(events, new Date())).toEqual(events[0]);
    expect(getNextEvent(events, new Date("2026-03-24T12:00:00Z"))).toEqual(events[1]);
    expect(hasCampusCommute(events[0])).toBe(true);
    expect(formatTimeLeft("2026-03-24T11:00:00Z", Date.now())).toBe("Ended");
    expect(getJourneySummary({ duration: 22, legs: [{ mode: "tube", routeOptions: [{ name: "Northern" }, { name: "Northern" }] }] }).lines).toEqual(["Northern"]);
    expect(getLeaveByInfo({ start_time: "2026-03-24T13:00:00Z", title: "Seminar" }, [{ lineName: "Northern", severityDescription: "Severe delays" }], new Date("2026-03-24T12:00:00Z").getTime()).hasSevere).toBe(true);
  });

  it("covers the hero, weekly goal, streak, tiny timeline, and semester overview widgets", async () => {
    fetchApiMock.mockResolvedValue([{ completed: true, updated_at: "2026-03-24T09:00:00Z" }]);
    getEventsMock.mockResolvedValue([{ title: "Lecture", source: "timetable", start_time: "2026-03-24T09:00:00Z", end_time: "2026-03-24T10:00:00Z" }]);
    getUpcomingDeadlinesMock.mockResolvedValue([{ title: "Exam", start_due_date: "2026-03-25" }]);
    localStorage.setItem("weeklyStudyGoalHours", "12");
    localStorage.setItem("pomodoroSessions", JSON.stringify([{ endedAt: "2026-03-24T10:00:00Z", durationMins: 60 }]));

    render(
      <>
        <IntelligenceHero
          displayName="Alex"
          liveContext={{ label: "Status", text: "Focused", iconKey: "Train" }}
          eventsCount={3}
          tasksCount={4}
          nextWindowMeta={{ duration: "2h" }}
          nextStep="Keep going"
          nextStepMeta="Top priority"
          weeklyProgress="75%"
          currentStreak="4 day streak"
          courseChangeRequest={{ requested_course: "Medicine" }}
          teacherRequestPending={true}
          onDismissCourseChange={vi.fn()}
          onDismissTeacherRequest={vi.fn()}
        />
        <WeeklyGoalWidget />
        <StudyStreakWidget />
        <TinyTimelineWidget
          now={new Date("2026-03-24T12:00:00Z")}
          row={2}
          sortedEvents={[
            { id: 1, title: "Current", type: "Task", start_time: "2026-03-24T11:30:00Z", end_time: "2026-03-24T12:30:00Z" },
            { id: 2, title: "Next", location: "Library", start_time: "2026-03-24T13:00:00Z", end_time: "2026-03-24T14:00:00Z" },
          ]}
        />
        <SemesterOverviewWidget semesterStart="2026-02-02" numWeeks={4} readingWeekIndices={[1]} semesterLabel="Spring" row={1} />
      </>
    );

    expect(screen.getByText(/Course switch pending to/)).toBeInTheDocument();
    expect(screen.getByText("Teacher application is under review")).toBeInTheDocument();
    expect(screen.getByText("Weekly goal widget")).toBeInTheDocument();
    expect(screen.getByText("Study streak widget")).toBeInTheDocument();
    expect(screen.getByText("Tiny timeline widget")).toBeInTheDocument();
    expect(screen.getByText("Semester overview widget")).toBeInTheDocument();
  });

  it("covers semester hooks directly", async () => {
    vi.useRealTimers();
    getEventsMock.mockResolvedValue([]);
    getUpcomingDeadlinesMock.mockRejectedValue(new Error("no deadlines"));
    const { result: range } = renderHook(() => useSemesterRange(null, 12));
    expect(range.current.semStart).toBeInstanceOf(Date);
    expect(range.current.semEnd).toBeInstanceOf(Date);

    const { result } = renderHook(() => useSemesterData(new Date("2026-02-02"), new Date("2026-03-02")));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
    expect(result.current.deadlines).toEqual([]);
  });
});
