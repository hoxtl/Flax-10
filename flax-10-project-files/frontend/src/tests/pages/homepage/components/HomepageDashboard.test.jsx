<<<<<<< HEAD
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomepageDashboard } from '../../../../pages/homepage/components/HomepageDashboard';
import { useAuth } from '../../../../context/AuthContext';

// Mocks
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
  isToday: vi.fn(() => true),
}));

vi.mock('../../../../api/taskApi', () => ({
=======
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

vi.mock("../../../../components/calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../../api/taskApi", () => ({
>>>>>>> main
  createTask: vi.fn(),
  fetchTaskLists: vi.fn(),
  createTaskList: vi.fn(),
  deleteTask: vi.fn(),
  updateTask: vi.fn(),
}));

<<<<<<< HEAD
vi.mock('../../../../components/calendar/EventPopups', () => ({ EventPopups: () => <div data-testid="EventPopups">EventPopups</div> }));
vi.mock('../../../../components/common/back_to_top/BackToTop', () => ({ default: () => <div data-testid="BackToTop">BackToTop</div> }));
vi.mock('../../../../pages/homepage/components/TaskWidgetSlot', () => ({ TaskWidgetSlot: () => <div data-testid="TaskWidgetSlot">TaskWidgetSlot</div> }));
vi.mock('../../../../pages/homepage/components/DeadlinesWidget', () => ({ 
  DeadlinesWidget: ({ isTeacher }) => <div data-testid="DeadlinesWidget">{isTeacher ? 'teacher' : 'student'}</div> 
}));
vi.mock('../../../../pages/homepage/components/IntelligenceRow', () => ({ 
  default: ({ slot1TodayTasks, slot3Urgent, slot6Timeline, slot5Data }) => (
    <div data-testid="IntelligenceRow">
      {slot1TodayTasks}
      {slot3Urgent}
      {slot6Timeline}
      {slot5Data && <div data-testid="slot5Data">slot5Data</div>}
    </div>
  )
}));
vi.mock('../../../../pages/homepage/components/SleepBanner', () => ({ default: () => <div data-testid="SleepBanner">SleepBanner</div> }));
vi.mock('../../../../pages/homepage/components/HomepageModals', () => ({ HomepageModals: () => <div data-testid="HomepageModals">HomepageModals</div> }));
vi.mock('../../../../pages/homepage/components/HomepageOverlays', () => ({ HomepageOverlays: () => <div data-testid="HomepageOverlays">HomepageOverlays</div> }));
vi.mock('../../../../pages/homepage/components/HomepageSkeleton', () => ({ HomepageSkeleton: () => <div data-testid="HomepageSkeleton">HomepageSkeleton</div> }));
vi.mock('../../../../pages/homepage/components', () => ({
  HomepageTimelineSection: () => <div data-testid="HomepageTimelineSection">HomepageTimelineSection</div>,
}));

const defaultProps = {
  homeDataLoading: false,
  state: {
    homepageRecommendation: 'test-rec',
    navigatorContext: {},
    sortedEvents: [],
    tomorrowFirstEvent: null,
    taskWidgetItemsOnly: false,
    enrolledModules: [],
    deadlineSuggestions: [],
    suggestableTasks: [],
    tasksDueToday: [],
    taskWidgetDueTodayCount: 0,
    taskWidgetList: [],
  },
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
=======
vi.mock("../../../../components/calendar/EventPopups", () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuthMock(...args),
}));

vi.mock("../../../../components/common/back_to_top/BackToTop", () => ({
  default: (props) => {
    backToTopProps(props);
    return <div data-testid="back-to-top" />;
  },
}));

vi.mock("../../../../pages/homepage/components/TaskWidgetSlot", () => ({
  TaskWidgetSlot: (props) => {
    taskWidgetSlotProps(props);
    return <div data-testid="task-widget-slot" />;
  },
}));

vi.mock("../../../../pages/homepage/components/DeadlinesWidget", () => ({
  DeadlinesWidget: (props) => {
    deadlinesWidgetProps(props);
    return <div data-testid="deadlines-widget" />;
  },
}));

vi.mock("../../../../pages/homepage/components/IntelligenceRow", () => ({
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

vi.mock("../../../../pages/homepage/components/SleepBanner", () => ({
  default: () => <div data-testid="sleep-banner" />,
}));

vi.mock("../../../../pages/homepage/components/HomepageModals", () => ({
  HomepageModals: (props) => {
    modalProps(props);
    return <div data-testid="homepage-modals" />;
  },
}));

vi.mock("../../../../pages/homepage/components/HomepageOverlays", () => ({
  HomepageOverlays: (props) => {
    overlayProps(props);
    return <div data-testid="homepage-overlays" />;
  },
}));

vi.mock("../../../../pages/homepage/components/HomepageSkeleton", () => ({
  HomepageSkeleton: () => <div data-testid="homepage-skeleton" />,
}));

vi.mock("../../../../pages/homepage/components", () => ({
  HomepageTimelineSection: (props) => {
    timelineSectionProps(props);
    return <div data-testid="homepage-timeline-section" />;
  },
}));

vi.mock("../../../../pages/homepage/styles/TaskWidget.module.css", () => ({
  default: { taskWidget: "task-widget" },
}));

vi.mock("../../../../pages/homepage/Homepage.module.css", () => ({
  default: { page: "page", intelligenceRowWrap: "intelligence-row-wrap" },
}));

import { HomepageDashboard } from "../../../../pages/homepage/components/HomepageDashboard";

function buildBaseProps() {
  return {
    calendarEvents: [{ id: 1, title: "Lecture" }],
    completedEventIds: new Set(),
    dayTasks: [{ id: 4, title: "Essay plan" }],
    displayName: "Ava",
    getTag: vi.fn(() => ({ label: "Study" })),
    homeDataLoading: false,
    now: new Date("2026-03-27T10:00:00.000Z"),
    selectedDate: new Date("2026-03-27T10:00:00.000Z"),
    tags: [{ id: 1, name: "Important" }],
    taskLists: [{ id: 2, name: "Inbox" }],
    taskWidgetRef: { current: null },
    toast: { showToast: vi.fn() },
    upcomingDeadlines: [{ id: 9, title: "Essay" }],
  };
}

function buildActionProps() {
  return {
    addEvent: vi.fn(),
    deleteTaskAndRefresh: vi.fn(),
    handleInlineTaskEdit: vi.fn(),
    handleTaskToggle: vi.fn(),
    handleTaskWidgetComplete: vi.fn(),
    openModal: vi.fn(),
    openTimelinePopup: vi.fn(),
    refetchTasks: vi.fn(),
    setCompletedEventIds: vi.fn(),
    setTaskLists: vi.fn(),
  };
}

function buildTimerProps() {
  return {
    breakTime: 5,
    hasTimerSession: true,
    timeLeft: 1200,
    timerMode: "work",
    timerTask: "Essay",
    workTime: 25,
  };
}

function buildStateProps() {
  return {
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
  };
}

function buildModalsProps() {
  return {
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
>>>>>>> main
    setShowCreateListFromTask: vi.fn(),
    setShowCreateTaskModal: vi.fn(),
    showCreateListFromTask: false,
    showCreateTaskModal: false,
<<<<<<< HEAD
  },
  reschedule: {
    handleAutoSchedule: vi.fn(),
    autoScheduleLoading: false,
=======
  };
}

function buildRescheduleProps() {
  return {
    autoScheduleLoading: false,
    handleAutoSchedule: vi.fn(),
>>>>>>> main
    handleConflictAutoMove: vi.fn(),
    handleConflictPushTomorrow: vi.fn(),
    handleQuickStartGap: vi.fn(),
    handleResolveTimelineConflicts: vi.fn(),
    handleReschedule: vi.fn(),
    handleTimelineDelete: vi.fn(),
    resolveConflictsLoading: false,
<<<<<<< HEAD
  },
  toast: { showToast: vi.fn() },
  taskLists: [],
  now: new Date(),
  selectedDate: new Date(),
  handleTaskToggle: vi.fn(),
  openModal: vi.fn(),
  openTimelinePopup: vi.fn(),
  handleTaskWidgetComplete: vi.fn(),
  deleteTaskAndRefresh: vi.fn(),
  handleInlineTaskEdit: vi.fn(),
  taskWidgetRef: { current: null },
};

describe('HomepageDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton when loading', () => {
    render(<HomepageDashboard homeDataLoading={true} />);
    expect(screen.getByTestId('HomepageSkeleton')).toBeTruthy();
  });

  it('renders content when not loading', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('IntelligenceRow')).toBeTruthy();
    expect(screen.getByTestId('SleepBanner')).toBeTruthy();
    expect(screen.getByTestId('HomepageOverlays')).toBeTruthy();
    expect(screen.getByTestId('BackToTop')).toBeTruthy();
    expect(screen.getByTestId('HomepageModals')).toBeTruthy();
    expect(screen.getByTestId('EventPopups')).toBeTruthy();
  });

  it('renders sub-components inIntelligenceRow', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('TaskWidgetSlot')).toBeTruthy();
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
    expect(screen.getByTestId('HomepageTimelineSection')).toBeTruthy();
  });

  it('handles role-based logic in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: { role: 'teacher' } });
    const { rerender } = render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
    
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    rerender(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
  });

  it('handles role-based logic fallback in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: null });
    render(<HomepageDashboard {...defaultProps} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
  });

  it('handles missing upcomingDeadlines prop in HomepageDeadlines', () => {
    useAuth.mockReturnValue({ profile: { role: 'student' } });
    const propsWithoutDeadlines = { ...defaultProps, upcomingDeadlines: undefined };
    render(<HomepageDashboard {...propsWithoutDeadlines} />);
    expect(screen.getByTestId('DeadlinesWidget')).toBeTruthy();
=======
  };
}

function buildProps(overrides = {}) {
  return {
    ...buildBaseProps(),
    ...buildActionProps(),
    ...buildTimerProps(),
    state: buildStateProps(),
    modals: buildModalsProps(),
    reschedule: buildRescheduleProps(),
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
>>>>>>> main
  });
});
