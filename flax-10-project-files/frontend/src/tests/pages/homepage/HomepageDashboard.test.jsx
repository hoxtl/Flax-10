import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const isTodayMock = vi.fn(() => false);
const useAuthMock = vi.fn(() => ({ profile: { role: "student" } }));
const taskWidgetSlotProps = vi.fn();
const deadlinesWidgetProps = vi.fn();
const intelligenceRowProps = vi.fn();
const timelineSectionProps = vi.fn();
const overlayProps = vi.fn();
const modalProps = vi.fn();
const backToTopProps = vi.fn();

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../api/taskApi", () => ({
  createTask: vi.fn(),
  fetchTaskLists: vi.fn(),
  createTaskList: vi.fn(),
  deleteTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../../../components/calendar/EventPopups", () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock("../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuthMock(...args),
}));

vi.mock("../../../components/common/back_to_top/BackToTop", () => ({
  default: (props) => {
    backToTopProps(props);
    return <div data-testid="back-to-top" />;
  },
}));

vi.mock("../../../pages/homepage/components/TaskWidgetSlot", () => ({
  TaskWidgetSlot: (props) => {
    taskWidgetSlotProps(props);
    return <div data-testid="task-widget-slot" />;
  },
}));

vi.mock("../../../pages/homepage/components/DeadlinesWidget", () => ({
  DeadlinesWidget: (props) => {
    deadlinesWidgetProps(props);
    return <div data-testid="deadlines-widget" />;
  },
}));

vi.mock("../../../pages/homepage/components/IntelligenceRow", () => ({
  default: (props) => {
    intelligenceRowProps(props);
    return (
      <div data-testid="intelligence-row">
        {props.slot1TodayTasks}
        {props.slot3Urgent}
        {props.slot6Timeline}
      </div>
    );
  },
}));

vi.mock("../../../pages/homepage/components/SleepBanner", () => ({
  default: () => <div data-testid="sleep-banner" />,
}));

vi.mock("../../../pages/homepage/components/HomepageModals", () => ({
  HomepageModals: (props) => {
    modalProps(props);
    return <div data-testid="homepage-modals" />;
  },
}));

vi.mock("../../../pages/homepage/components/HomepageOverlays", () => ({
  HomepageOverlays: (props) => {
    overlayProps(props);
    return <div data-testid="homepage-overlays" />;
  },
}));

vi.mock("../../../pages/homepage/components/HomepageSkeleton", () => ({
  HomepageSkeleton: () => <div data-testid="homepage-skeleton" />,
}));

vi.mock("../../../pages/homepage/components", () => ({
  HomepageTimelineSection: (props) => {
    timelineSectionProps(props);
    return <div data-testid="homepage-timeline-section" />;
  },
}));

vi.mock("../../../pages/homepage/styles/TaskWidget.module.css", () => ({
  default: { taskWidget: "task-widget" },
}));

vi.mock("../../../pages/homepage/Homepage.module.css", () => ({
  default: { page: "page", intelligenceRowWrap: "intelligence-row-wrap" },
}));

import { HomepageDashboard } from "../../../pages/homepage/components/HomepageDashboard";

function buildProps(overrides = {}) {
  return {
    homeDataLoading: false,
    calendarEvents: [{ id: 1, title: "Lecture" }],
    completedEventIds: new Set(),
    dayTasks: [{ id: 4, title: "Essay plan" }],
    displayName: "Ava",
    getTag: vi.fn(() => ({ label: "Study" })),
    hasTimerSession: true,
    now: new Date("2026-03-27T10:00:00.000Z"),
    openModal: vi.fn(),
    openTimelinePopup: vi.fn(),
    refetchTasks: vi.fn(),
    selectedDate: new Date("2026-03-27T10:00:00.000Z"),
    setCompletedEventIds: vi.fn(),
    setTaskLists: vi.fn(),
    tags: [{ id: 1, name: "Important" }],
    taskLists: [{ id: 2, name: "Inbox" }],
    taskWidgetRef: { current: null },
    timeLeft: 1200,
    timerMode: "work",
    timerTask: "Essay",
    upcomingDeadlines: [{ id: 9, title: "Essay" }],
    workTime: 25,
    breakTime: 5,
    addEvent: vi.fn(),
    deleteTaskAndRefresh: vi.fn(),
    handleInlineTaskEdit: vi.fn(),
    handleTaskToggle: vi.fn(),
    handleTaskWidgetComplete: vi.fn(),
    toast: { showToast: vi.fn() },
    state: {
      deadlineSuggestions: [{ id: 6 }],
      enrolledModules: [{ id: 7, code: "CS101" }],
      homepageRecommendation: "Take a break",
      navigatorContext: { source: "dashboard" },
      sortedEvents: [{ id: 8, title: "Lecture" }],
      suggestableTasks: [{ id: 10, title: "Revise" }],
      taskWidgetDueTodayCount: 2,
      taskWidgetItemsOnly: [{ id: 11, title: "Flashcards" }],
      taskWidgetList: [{ id: 12, title: "Task" }],
      tasksDueToday: [{ id: 13, title: "Readings" }],
      tomorrowFirstEvent: { id: 14, title: "Tutorial" },
    },
    modals: {
      lastCreatedListId: null,
      planTimelineReadItem: null,
      rescheduleTask: null,
      selectedDeadline: null,
      selectedModulePill: null,
      setLastCreatedListId: vi.fn(),
      setPlanTimelineReadItem: vi.fn(),
      setRescheduleTask: vi.fn(),
      setSelectedDeadline: vi.fn(),
      setSelectedModulePill: vi.fn(),
      setShowCreateListFromTask: vi.fn(),
      setShowCreateTaskModal: vi.fn(),
      showCreateListFromTask: false,
      showCreateTaskModal: false,
    },
    reschedule: {
      autoScheduleLoading: false,
      handleAutoSchedule: vi.fn(),
      handleConflictAutoMove: vi.fn(),
      handleConflictPushTomorrow: vi.fn(),
      handleQuickStartGap: vi.fn(),
      handleResolveTimelineConflicts: vi.fn(),
      handleReschedule: vi.fn(),
      handleTimelineDelete: vi.fn(),
      resolveConflictsLoading: false,
    },
    ...overrides,
  };
}

describe("HomepageDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTodayMock.mockReturnValue(false);
    useAuthMock.mockReturnValue({ profile: { role: "student" } });
  });

  it("renders the skeleton while homepage data is loading", () => {
    render(<HomepageDashboard {...buildProps({ homeDataLoading: true })} />);

    expect(screen.getByTestId("homepage-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("intelligence-row")).toBeNull();
  });

  it("wires dashboard content for students with the supplied deadlines", () => {
    const props = buildProps();
    isTodayMock.mockReturnValue(true);

    render(<HomepageDashboard {...props} />);

    expect(screen.getByTestId("sleep-banner")).toBeInTheDocument();
    expect(screen.getByTestId("intelligence-row")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-timeline-section")).toBeInTheDocument();
    expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-modals")).toBeInTheDocument();
    expect(screen.getByTestId("homepage-overlays")).toBeInTheDocument();
    expect(screen.getByTestId("event-popups")).toBeInTheDocument();

    expect(taskWidgetSlotProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      onDeleteTask: props.deleteTaskAndRefresh,
      onEditTask: props.modals.setRescheduleTask,
      onInlineTaskEdit: props.handleInlineTaskEdit,
      taskLists: props.taskLists,
    }));

    expect(deadlinesWidgetProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      deadlines: props.upcomingDeadlines,
      isTeacher: false,
      onSelectDeadline: props.modals.setSelectedDeadline,
      onSelectModule: props.modals.setSelectedModulePill,
    }));

    expect(intelligenceRowProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      calendarEvents: props.calendarEvents,
      displayName: "Ava",
      recommendation: props.state.homepageRecommendation,
      slot5Data: expect.objectContaining({
        isToday: true,
        navigatorContext: props.state.navigatorContext,
        sortedEvents: props.state.sortedEvents,
      }),
    }));

    expect(timelineSectionProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      handleReschedule: props.reschedule.handleReschedule,
      resolveConflictsLoading: props.reschedule.resolveConflictsLoading,
      sortedEvents: props.state.sortedEvents,
      styles: expect.any(Object),
    }));

    expect(backToTopProps.mock.calls[0][0]).toEqual({ containerSelector: "[data-dashboard-main]" });
    expect(overlayProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      enrolledModules: props.state.enrolledModules,
      setSelectedDeadline: props.modals.setSelectedDeadline,
      setSelectedModulePill: props.modals.setSelectedModulePill,
    }));
    expect(modalProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      addEvent: props.addEvent,
      openModal: props.openModal,
      refetchTasks: props.refetchTasks,
      setTaskLists: props.setTaskLists,
      showToast: props.toast.showToast,
    }));
  });

  it("falls back to an empty deadline list for teachers when no upcoming deadlines are supplied", () => {
    const props = buildProps({ upcomingDeadlines: undefined });
    useAuthMock.mockReturnValue({ profile: { role: "teacher" } });

    render(<HomepageDashboard {...props} />);

    expect(deadlinesWidgetProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      deadlines: [],
      isTeacher: true,
    }));
  });
});
