/*
 * Shared homepage test mocks, state, and reset hooks.
 */

import { beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Homepage from "../../../pages/homepage/Homepage";

export { expect, fireEvent, Homepage, MemoryRouter, render, screen, vi, waitFor, within };

export const {
  mockDispatch,
  mockOpenModal,
  mockRemoveEvent,
  mockAddEvent,
  mockEditEvent,
  mockLoadEvents,
  mockRefetchTasks,
  mockUseCalendarEvents,
  mockNavigate,
  mockGetTag,
  mockGetUpcomingDeadlines,
} = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockOpenModal: vi.fn(),
  mockRemoveEvent: vi.fn(),
  mockAddEvent: vi.fn(),
  mockEditEvent: vi.fn(),
  mockLoadEvents: vi.fn(),
  mockRefetchTasks: vi.fn(),
  mockUseCalendarEvents: vi.fn(),
  mockNavigate: vi.fn(),
  mockGetTag: vi.fn(() => ({ label: "Academic" })),
  mockGetUpcomingDeadlines: vi.fn().mockResolvedValue([{ id: 1, start_due_date: new Date(Date.now() + 2 * 86400000).toISOString() }]),
}));

export const homepageState = {
  selectedDate: new Date(),
  events: [],
  filter: "all",
  timeLeft: 0,
  timerActive: false,
  timerMode: "work",
  dayEvents: [],
  dayTasks: [],
  allTasks: [],
};

vi.mock("../../../components/calendar/utils/dateUtils", () => ({
  isToday: vi.fn((date) => {
    const today = new Date();
    return date && today.toDateString() === new Date(date).toDateString();
  }),
  overlapsDay: vi.fn((start, end, day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return start < dayEnd && end > dayStart;
  }),
}));

vi.mock("../../../components/calendar/utils/eventUtils", () => ({
  extractBaseEventId: vi.fn((id) => (typeof id === "string" && id.includes("_") ? id.split("_")[0] : id)),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/homepage/homepageTestSetup.js
vi.mock("../../../pages/homepage/utils", () => ({
=======
vi.mock("../../../pages/homepage/utils/index", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Homepage/homepageTestSetup.js
  formatTime: vi.fn((date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
  isNow: vi.fn(() => false),
  isRoutineEvent: vi.fn(() => false),
  getNavigatorContext: vi.fn(() => ({ state: "gap", nextItem: null, gapMins: 30, overlaps: [], conflictAt: null })),
  getNextFreeSlotToday: vi.fn(() => ({ start: new Date(), end: new Date(Date.now() + 25 * 60000) })),
  getAllFreeWindowsToday: vi.fn(() => [{ start: new Date(), end: new Date(Date.now() + 60 * 60000), minutes: 60 }]),
  isRoutineOrEventTask: vi.fn(() => false),
}));

vi.mock("../../../context/CalendarContext", () => ({
  useCalendar: () => ({ selectedDate: homepageState.selectedDate, events: homepageState.events, filter: homepageState.filter }),
  useCalendarDispatch: () => mockDispatch,
  useEventModal: () => ({ openModal: mockOpenModal }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock("../../../components/calendar/hooks/useCalendarEvents", () => ({
  useCalendarEvents: () => mockUseCalendarEvents(),
  useEventActions: () => ({ removeEvent: mockRemoveEvent, addEvent: mockAddEvent, editEvent: mockEditEvent }),
  useEventPopup: () => ({ openPopup: vi.fn() }),
}));

vi.mock("../../../pages/homepage/hooks/useHomeData", () => ({
  useHomeData: () => ({
    dayEvents: homepageState.dayEvents,
    dayTasks: homepageState.dayTasks,
    allTasks: homepageState.allTasks,
    removePendingTask: vi.fn(),
    refetchTasks: mockRefetchTasks,
    loading: false,
  }),
}));

vi.mock("../../../context/TagContext", () => ({
  useTags: () => ({ getTag: mockGetTag, tags: [{ id: 1, label: "Routine" }] }),
}));

vi.mock("../../../context/TimerContext", () => ({
  useTimerContext: () => ({
    setActiveTaskId: vi.fn(),
    isActive: homepageState.timerActive,
    timeLeft: homepageState.timeLeft,
    task: homepageState.timerActive ? "My Task" : null,
    progress: 0,
    setIsActive: vi.fn(),
    mode: homepageState.timerMode,
    setMode: vi.fn(),
    setTimeLeft: vi.fn(),
    workTime: 25,
    breakTime: 5,
    resetTimer: vi.fn(),
    setTask: vi.fn(),
  }),
}));

vi.mock("../../../context/TaskCompletionContext", () => ({
  useTaskCompletion: () => ({ showCompletionToast: vi.fn() }),
}));

vi.mock("../../../context/NotificationContext", () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

vi.mock("../../../components/notifications/hooks/useNotify", () => ({
  useNotify: () => vi.fn(),
}));

vi.mock("../../../components/modules/hooks/useModuleDisenrollment", () => ({
  useModuleDisenrollment: () => ({ disenrollFromModule: vi.fn() }),
}));

vi.mock("../../../context/ConfirmContext", () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock("../../../pages/homepage/components/IntelligenceRow", () => ({
  __esModule: true,
  default: ({ displayName, slot1TodayTasks, slot3Urgent }) => (
    <div data-testid="intelligence-row">
      <div data-testid="display-name">{displayName || "anon"}</div>
      <div data-testid="slot1">{slot1TodayTasks}</div>
      <div data-testid="slot3">{slot3Urgent}</div>
    </div>
  ),
}));

vi.mock("../../../pages/homepage/components/TaskWidgetSlot", () => ({
  TaskWidgetSlot: ({ handleTaskWidgetComplete, onStartFocus, getTaskCategoryPill, getTaskCategoryColor, onEditTask, onDeleteTask, onInlineTaskEdit }) => (
    <div data-testid="task-widget-slot">
      <button type="button" onClick={() => handleTaskWidgetComplete({ id: "task-1", title: "Task A", completed: false, task_list: 123, tag: 1 })}>complete-task</button>
      <button type="button" onClick={() => onStartFocus?.()}>start-focus</button>
      <button type="button" onClick={() => onEditTask?.({ id: 1 })}>edit-task</button>
      <button type="button" onClick={() => onDeleteTask?.({ id: 1 })}>delete-task</button>
      <button type="button" onClick={() => onInlineTaskEdit?.({ id: 1 }, { title: "X" })}>inline-edit</button>
      <div data-testid="pill">{getTaskCategoryPill?.({ task_list: 123, tag: 1 })}</div>
      <div data-testid="pill-null">{getTaskCategoryPill?.({ task_list: 999 }) ?? "null"}</div>
      <div data-testid="pill-module-code">{getTaskCategoryPill?.({ module_code: "XY1" }) ?? "null"}</div>
      <div data-testid="pill-module-id">{getTaskCategoryPill?.({ module_id: 10 }) ?? "null"}</div>
      <div data-testid="color">{getTaskCategoryColor?.({ tag: 1 })}</div>
      <div data-testid="color-flax">{getTaskCategoryColor?.({})}</div>
      <div data-testid="color-module">{getTaskCategoryColor?.({ module_code: "CS101" })}</div>
    </div>
  ),
}));

vi.mock("../../../pages/homepage/components/DeadlinesWidget", () => ({
  DeadlinesWidget: ({ deadlines, onSelectDeadline, onSelectModule }) => (
    <div data-testid="deadlines-count">deadlines:{(deadlines || []).length}
      <button type="button" onClick={() => onSelectDeadline?.({ id: 1, assessment_title: "Essay", start_due_date: new Date().toISOString(), module_code: "AB1", deadline_type: "assignment", description: "D", location: "Room 1", module_id: 10 })}>select-deadline</button>
      <button type="button" onClick={() => onSelectDeadline?.({ id: 2, assessment_title: "Exam", start_due_date: new Date().toISOString(), module_code: "XY" })}>select-deadline-code-only</button>
      <button type="button" onClick={() => onSelectModule?.({ code: "AB1", id: 10, name: "Module A" })}>select-module</button>
    </div>
  ),
}));

vi.mock("../../../pages/homepage/components/SleepBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="sleep-banner">sleep</div>,
}));

vi.mock("../../../components/calendar/EventPopups", () => ({
  EventPopups: () => <div data-testid="event-popups" />,
}));

vi.mock("../../../components/common/back_to_top/BackToTop", () => ({
  __esModule: true,
  default: () => <div data-testid="back-to-top" />,
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/homepage/homepageTestSetup.js
vi.mock("../../../components/tags/components/PillFilters", () => ({
=======
vi.mock("../../../components/tags/pill_filters", () => ({
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Homepage/homepageTestSetup.js
  __esModule: true,
  default: () => <div data-testid="pill-filters" />,
}));

vi.mock("../../../pages/tasks/components/TaskCard", async () => {
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/homepage/homepageTestSetup.js
  const actual = await vi.importActual("../../../pages/Tasks/components/TaskCard");
=======
  const actual = await vi.importActual("../../../pages/tasks/components/TaskCard");
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Homepage/homepageTestSetup.js
  return {
    ...actual,
    EditTaskModal: ({ task, onSave, onDelete, onClose }) => (
      <div data-testid="edit-task-modal">
        <button type="button" onClick={() => onSave?.({ title: task?.title })}>edit-modal-save</button>
        <button type="button" onClick={() => onDelete?.()}>edit-modal-delete</button>
        <button type="button" onClick={onClose}>edit-modal-close</button>
      </div>
    ),
  };
});

vi.mock("../../../pages/homepage/components", () => ({
  MiniTimeline: ({ sortedEvents, onQuickStart, onTaskToggle, onCardClick, onEdit, onConflictAutoMove, onPushTomorrow, onDelete, onReschedule, onToggleComplete }) => (
    <div data-testid="mini-timeline">events:{(sortedEvents || []).length}
      <button type="button" onClick={() => onQuickStart?.(new Date(), 25, { id: 1, title: "T", estimated_blocks: 1 })}>quick-start</button>
      <button type="button" onClick={() => onQuickStart?.(new Date(), 25, null)}>quick-start-no-task</button>
      <button type="button" onClick={() => onTaskToggle?.({ id: 1 }, true)}>task-toggle</button>
      <button type="button" onClick={() => onCardClick?.({ id: 1, title: "E" })}>card-click</button>
      <button type="button" onClick={() => onCardClick?.(null)}>card-click-null</button>
      <button type="button" onClick={() => onEdit?.({ id: 1 })}>timeline-edit</button>
      <button type="button" onClick={() => onConflictAutoMove?.({ id: 1 }, new Date(), new Date())}>conflict-auto-move</button>
      <button type="button" onClick={() => onPushTomorrow?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: "E" })}>push-tomorrow</button>
      <button type="button" onClick={() => onPushTomorrow?.({ id: 1 })}>push-tomorrow-no-time</button>
      <button type="button" onClick={() => onDelete?.({ id: 1, title: "E" })}>timeline-delete</button>
      <button type="button" onClick={() => onDelete?.({ id: "ev-1", source: "task", external_id: 99, title: "Task Event" })}>timeline-delete-task</button>
      <button type="button" onClick={() => onReschedule?.({ id: 1, start_time: new Date().toISOString(), end_time: new Date().toISOString(), title: "E" })}>reschedule</button>
      <button type="button" onClick={() => onToggleComplete?.(1)}>toggle-complete</button>
    </div>
  ),
  HomepageTimelineSection: ({ handleResolveTimelineConflicts, onTaskToggle, onQuickStart, onConflictAutoMove, onPushTomorrow, onDelete, onReschedule, sortedEvents }) => (
    <div data-testid="homepage-timeline-section">
      <button type="button" onClick={() => handleResolveTimelineConflicts?.()}>resolve-overlaps</button>
      <button type="button" onClick={() => onTaskToggle?.({ id: 1 })}>task-toggle</button>
      <button type="button" onClick={() => onQuickStart?.(new Date(), 25, { id: 1 })}>quick-start</button>
      <button type="button" onClick={() => onConflictAutoMove?.({ id: 1 })}>conflict-auto-move</button>
      <button type="button" onClick={() => onPushTomorrow?.({ id: 1 })}>push-tomorrow</button>
      <button type="button" onClick={() => onDelete?.({ id: 1 })}>timeline-delete</button>
      <button type="button" onClick={() => onDelete?.({ id: "ev-1", source: "task", external_id: 99 })}>timeline-delete-task</button>
      <button type="button" onClick={() => onReschedule?.({ id: 1 })}>reschedule</button>
      <div data-testid="mini-timeline">events:{(sortedEvents || []).length}</div>
    </div>
  ),
}));

vi.mock("../../../api/taskApi", () => ({
  updateTask: vi.fn().mockResolvedValue({}),
  createTask: vi.fn(),
  fetchTaskLists: vi.fn().mockResolvedValue([{ id: 123, name: "University" }]),
  createTaskList: vi.fn(),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../pages/tasks/components/CreateTaskModal", () => ({
  __esModule: true,
  default: ({ onSave, onClose, onOpenCreateList }) => (
    <div data-testid="create-task-modal">
      <button type="button" onClick={() => onSave({ title: "New Task" }, {})}>create-task-save</button>
      <button type="button" onClick={() => onSave({ title: "breakfast" }, {})}>create-task-routine</button>
      <button type="button" onClick={() => onSave({ title: "Task", estimated_blocks: 2 }, { addToSchedule: true })}>create-task-with-schedule</button>
      <button type="button" onClick={onOpenCreateList}>create-task-open-list</button>
      <button type="button" onClick={onClose}>create-task-close</button>
    </div>
  ),
}));

vi.mock("../../../pages/tasks/components/CreateListModal", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="create-list-modal">
      <button type="button" onClick={() => onSave({ name: "My List" })}>create-list-save</button>
      <button type="button" onClick={onClose}>create-list-close</button>
    </div>
  ),
}));

vi.mock("../../../pages/homepage/components/PlanReadDetailModal", () => ({
  PlanReadDetailModal: ({ item, onClose, onEditTask, onDeleteTask, onEditEvent, onDeleteEvent }) => (
    <div data-testid="plan-read-detail-modal">
      <button type="button" onClick={onClose}>plan-read-close</button>
      <button type="button" onClick={() => item?.task && onEditTask?.(item.task)}>plan-read-edit-task</button>
      <button type="button" onClick={() => item?.task && onDeleteTask?.(item.task)}>plan-read-delete-task</button>
      <button type="button" onClick={() => item?.event && onEditEvent?.(item.event)}>plan-read-edit-event</button>
      <button type="button" onClick={() => item?.event && onDeleteEvent?.(item.event)}>plan-read-delete-event</button>
    </div>
  ),
}));

vi.mock("../../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
  getEnrollments: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: mockGetUpcomingDeadlines,
}));

vi.mock("../../../lib/completionMessages", () => ({
  getCompletionMessage: () => "Nice",
  isRoutineTask: () => false,
}));

vi.mock("../../../lib/sounds", () => ({
  playCompletionChime: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  homepageState.selectedDate = new Date();
  homepageState.events = [];
  homepageState.filter = "all";
  homepageState.timeLeft = 0;
  homepageState.timerActive = false;
  homepageState.timerMode = "work";
  homepageState.dayEvents = [];
  homepageState.dayTasks = [];
  homepageState.allTasks = [];
  vi.clearAllMocks();
  mockGetTag.mockReturnValue({ label: "Academic" });
  mockUseCalendarEvents.mockReturnValue({ loadEvents: mockLoadEvents });
  mockAddEvent.mockResolvedValue(undefined);
  mockEditEvent.mockResolvedValue(undefined);
  mockRemoveEvent.mockResolvedValue(undefined);
  mockLoadEvents.mockResolvedValue(undefined);
  mockRefetchTasks.mockResolvedValue(undefined);
  mockGetUpcomingDeadlines.mockResolvedValue([{ id: 1, start_due_date: new Date(Date.now() + 2 * 86400000).toISOString() }]);
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
