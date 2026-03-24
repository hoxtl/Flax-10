import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { HomepageFocusBanner } from "../../../pages/Homepage/components/HomepageFocusBanner";
import { HomepageTimelineSection } from "../../../pages/Homepage/components/HomepageTimelineSection";
import { HomepageSkeleton } from "../../../pages/Homepage/components/HomepageSkeleton";
import { HomepageDashboard } from "../../../pages/Homepage/components/HomepageDashboard";

const isTodayMock = vi.fn(() => true);

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

vi.mock("lucide-react", () => ({
  Calendar: () => <svg aria-hidden="true" />,
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../pages/Homepage/components/MiniTimeline", () => ({
  MiniTimeline: (props) => <div>MiniTimeline {props.selectedDate}</div>,
}));

vi.mock("../../../components/common/LoadingState/SkeletonBlock", () => ({
  default: ({ className }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock("../../../api/taskApi", () => ({
  createTask: vi.fn(),
  fetchTaskLists: vi.fn(),
  createTaskList: vi.fn(),
  deleteTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../../../components/Calendar/EventPopups", () => ({
  EventPopups: () => <div>Event popups</div>,
}));

vi.mock("../../../components/Pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../pages/Homepage/components/TaskWidgetSlot", () => ({
  TaskWidgetSlot: () => <div>Task widget slot</div>,
}));

vi.mock("../../../pages/Homepage/components/DeadlinesWidget", () => ({
  DeadlinesWidget: () => <div>Deadlines widget</div>,
}));

vi.mock("../../../pages/Homepage/components/IntelligenceRow", () => ({
  default: ({ slot1TodayTasks, slot3Urgent, slot6Timeline }) => <div>{slot1TodayTasks}{slot3Urgent}{slot6Timeline}</div>,
}));

vi.mock("../../../pages/Homepage/components/SleepBanner", () => ({
  default: () => <div>Sleep banner</div>,
}));

vi.mock("../../../pages/Homepage/components/HomepageModals", () => ({
  HomepageModals: () => <div>Homepage modals</div>,
}));

vi.mock("../../../pages/Homepage/components/HomepageOverlays", () => ({
  HomepageOverlays: () => <div>Homepage overlays</div>,
}));

vi.mock("../../../pages/Homepage/components/HomepageSkeleton", () => ({
  HomepageSkeleton: () => <div>Homepage skeleton mock</div>,
}));

vi.mock("../../../pages/Homepage/components", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    HomepageTimelineSection: (props) => <div>Timeline section {String(props.selectedDate)}</div>,
  };
});

vi.mock("../../../pages/Homepage/utils/homepageViewModel", () => ({
  getTaskCategoryColor: vi.fn(() => "#abc"),
  getTaskCategoryPillMeta: vi.fn(() => ({ label: "Coursework" })),
}));

describe("Homepage extra components", () => {
  it("renders focus banner states", () => {
    const navigate = vi.fn();
    const { rerender, container } = render(
      <HomepageFocusBanner hasTimerSession={false} navigate={navigate} timeLeft={0} timerMode="focus" timerTask="" />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<HomepageFocusBanner hasTimerSession={true} navigate={navigate} timeLeft={125} timerMode="break" timerTask="Essay" />);
    expect(screen.getByText("BREAK")).toBeInTheDocument();
    expect(screen.getByText("Essay")).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open timer →"));
    expect(navigate).toHaveBeenCalledWith("/timer");
  });

  it("renders timeline section widget and full layout actions", () => {
    const setCompletedEventIds = vi.fn();
    const onOpenQuickAddSchedule = vi.fn();
    const handleReplanDay = vi.fn();
    const props = {
      isWidget: false,
      styles: {
        bentoSpine: "bentoSpine",
        timelineBox: "timelineBox",
        timelineHeader: "timelineHeader",
        timelineHeaderLeft: "timelineHeaderLeft",
        timelineHeaderIconWrap: "timelineHeaderIconWrap",
        timelineTitle: "timelineTitle",
        timelineHeaderRight: "timelineHeaderRight",
        timelineHeaderActionLink: "timelineHeaderActionLink",
        timelineCalendarTextFull: "timelineCalendarTextFull",
        timelineCalendarTextMedium: "timelineCalendarTextMedium",
        timelineCalendarTextShort: "timelineCalendarTextShort",
        scheduleActionGroup: "scheduleActionGroup",
        manualScheduleBtn: "manualScheduleBtn",
        autoScheduleBtn: "autoScheduleBtn",
        timelineTrack: "timelineTrack",
        timelineTrackContent: "timelineTrackContent",
      },
      selectedDate: "2026-03-01",
      onOpenQuickAddSchedule,
      handleReplanDay,
      missedItems: [{ id: 1 }],
      overdueTasksForNow: [],
      replanLoading: false,
      setCompletedEventIds,
      completedEventIds: new Set(),
      dayTasks: [],
      deadlineSuggestions: [],
      getTag: vi.fn(),
      now: new Date(),
      sortedEvents: [],
      suggestableTasks: [],
      taskLists: [],
      tasksDueToday: [],
      openTimelinePopup: vi.fn(),
      handleConflictAutoMove: vi.fn(),
      handleTimelineDelete: vi.fn(),
      openModal: vi.fn(),
      handleConflictPushTomorrow: vi.fn(),
      handleQuickStartGap: vi.fn(),
      handleReschedule: vi.fn(),
      handleTaskToggle: vi.fn(),
      hasTimerSession: false,
      timeLeft: 0,
      timerMode: "focus",
      timerTask: "",
    };

    render(<HomepageTimelineSection {...props} />);
    fireEvent.click(screen.getByText("Manual Schedule"));
    fireEvent.click(screen.getByText("Auto Schedule"));
    fireEvent.click(screen.getByText("Re-plan"));
    expect(onOpenQuickAddSchedule).toHaveBeenCalledWith("schedule_manual");
    expect(onOpenQuickAddSchedule).toHaveBeenCalledWith("schedule_auto");
    expect(handleReplanDay).toHaveBeenCalled();
    expect(screen.getByText("MiniTimeline 2026-03-01")).toBeInTheDocument();
  });

  it("renders the homepage skeleton and dashboard branches", () => {
    const baseProps = {
      homeDataLoading: false,
      hasTimerSession: false,
      navigate: vi.fn(),
      timeLeft: 0,
      timerMode: "focus",
      timerTask: "",
      displayName: "Alex",
      state: {
        homepageRecommendation: null,
        deadlineSuggestions: [],
        navigatorContext: {},
        sortedEvents: [],
        tomorrowFirstEvent: null,
        taskWidgetItemsOnly: [],
        enrolledModules: [],
        missedItems: [],
        overdueTasksForNow: [],
        suggestableTasks: [],
        tasksDueToday: [],
        taskWidgetDueTodayCount: 0,
        taskWidgetList: [],
        taskWidgetOverdueCount: 0,
        taskWidgetSpineCompletedPct: 0,
      },
      upcomingDeadlines: [],
      modals: {
        setSelectedDeadline: vi.fn(),
        setSelectedModulePill: vi.fn(),
        selectedDeadline: null,
        selectedModulePill: null,
        lastCreatedListId: null,
        planTimelineReadItem: null,
        rescheduleTask: null,
        setLastCreatedListId: vi.fn(),
        setPlanTimelineReadItem: vi.fn(),
        setRescheduleTask: vi.fn(),
        setShowCreateListFromTask: vi.fn(),
        setShowCreateTaskModal: vi.fn(),
        showCreateListFromTask: false,
        showCreateTaskModal: false,
      },
      now: new Date(),
      selectedDate: "2026-03-01",
      completedEventIds: new Set(),
      setCompletedEventIds: vi.fn(),
      dayTasks: [],
      taskLists: [],
      getTag: vi.fn(),
      reschedule: {
        replanLoading: false,
        handleConflictAutoMove: vi.fn(),
        handleConflictPushTomorrow: vi.fn(),
        handleQuickStartGap: vi.fn(),
        handleReplanDay: vi.fn(),
        handleReschedule: vi.fn(),
        handleTimelineDelete: vi.fn(),
      },
      handleTaskToggle: vi.fn(),
      addEvent: vi.fn(),
      refetchTasks: vi.fn(),
      setTaskLists: vi.fn(),
      toast: { showToast: vi.fn() },
      tags: [],
      taskWidgetRef: { current: null },
      handleTaskWidgetComplete: vi.fn(),
      deleteTaskAndRefresh: vi.fn(),
      handleInlineTaskEdit: vi.fn(),
      openQuickAddSchedule: vi.fn(),
      openModal: vi.fn(),
      openTimelinePopup: vi.fn(),
      workTime: 25,
      breakTime: 5,
    };

    const { rerender } = render(<HomepageSkeleton />);
    expect(screen.getByText("Homepage skeleton mock")).toBeInTheDocument();

    rerender(<HomepageDashboard {...baseProps} homeDataLoading={true} />);
    expect(screen.getByText("Homepage skeleton mock")).toBeInTheDocument();

    rerender(<HomepageDashboard {...baseProps} />);
    expect(screen.getByText("Sleep banner")).toBeInTheDocument();
    expect(screen.getByText("Task widget slot")).toBeInTheDocument();
    expect(screen.getByText("Deadlines widget")).toBeInTheDocument();
    expect(screen.getByText(/Timeline section/)).toBeInTheDocument();
    expect(screen.getByText("Homepage overlays")).toBeInTheDocument();
    expect(screen.getByText("Homepage modals")).toBeInTheDocument();
    expect(screen.getByText("Back to top")).toBeInTheDocument();
    expect(screen.getByText("Event popups")).toBeInTheDocument();
  });
});
