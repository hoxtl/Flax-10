import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const navigateMock = vi.fn();
const createTask = vi.fn();
const createTaskList = vi.fn();
const fetchTaskLists = vi.fn();
const deleteTask = vi.fn();
const updateTask = vi.fn();
const getEvents = vi.fn();
const getUpcomingDeadlines = vi.fn();
const isTodayMock = vi.fn(() => true);
const extractBaseEventId = vi.fn((value) => `base-${value}`);

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => navigateMock,
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isToday: (...args) => isTodayMock(...args),
}));

vi.mock("../../../components/Calendar/utils/eventUtils", () => ({
  extractBaseEventId: (...args) => extractBaseEventId(...args),
}));

vi.mock("../../../api/taskApi", () => ({
  createTask: (...args) => createTask(...args),
  createTaskList: (...args) => createTaskList(...args),
  fetchTaskLists: (...args) => fetchTaskLists(...args),
  deleteTask: (...args) => deleteTask(...args),
  updateTask: (...args) => updateTask(...args),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEvents(...args),
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlines(...args),
}));

vi.mock("../../../pages/Tasks/components/CreateTaskModal", () => ({
  default: ({ onSave, onClose, onOpenCreateList, showAddToScheduleToggle, addToScheduleLabel }) => (
    <div>
      <div>{String(showAddToScheduleToggle)}</div>
      <div>{addToScheduleLabel}</div>
      <button type="button" onClick={onOpenCreateList}>open-list</button>
      <button type="button" onClick={() => onSave({ title: "Breakfast prep", estimated_blocks: 2, description: "Cook" }, { addToSchedule: true })}>save-task</button>
      <button type="button" onClick={onClose}>close-task</button>
    </div>
  ),
}));

vi.mock("../../../pages/Tasks/components/CreateListModal", () => ({
  default: ({ onSave, onClose }) => (
    <div>
      <button type="button" onClick={() => onSave({ name: "Weekend" })}>save-list</button>
      <button type="button" onClick={onClose}>close-list</button>
    </div>
  ),
}));

vi.mock("../../../pages/Tasks/components/TaskCard", () => ({
  EditTaskModal: ({ onSave, onDelete, onClose }) => (
    <div>
      <button type="button" onClick={() => onSave({ title: "Edited task" })}>save-edit</button>
      <button type="button" onClick={onDelete}>delete-edit</button>
      <button type="button" onClick={onClose}>close-edit</button>
    </div>
  ),
}));

vi.mock("../../../pages/Homepage/components/PlanReadDetailModal", () => ({
  PlanReadDetailModal: ({ onClose, onEditTask, onDeleteTask, onEditEvent, onDeleteEvent }) => (
    <div>
      <button type="button" onClick={onClose}>close-plan</button>
      <button type="button" onClick={() => onEditTask({ id: 3 })}>edit-plan-task</button>
      <button type="button" onClick={() => onDeleteTask({ id: 5 })}>delete-plan-task</button>
      <button type="button" onClick={() => onEditEvent({ id: "evt-1", tag: "study" })}>edit-plan-event</button>
      <button type="button" onClick={() => onDeleteEvent({ id: "evt-2" })}>delete-plan-event</button>
    </div>
  ),
}));

import { HomepageModals } from "../../../pages/Homepage/components/HomepageModals";
import { HomepageOverlays } from "../../../pages/Homepage/components/HomepageOverlays";
import { useSemesterData, useSemesterRange } from "../../../pages/Homepage/components/useSemesterOverviewData";

const styles = new Proxy({}, { get: (_, key) => key });

function buildModalProps(overrides = {}) {
  return {
    addEvent: vi.fn().mockResolvedValue(undefined),
    createTask: vi.fn().mockResolvedValue({ id: 10, title: "Breakfast prep", description: "Cook" }),
    createTaskList: vi.fn().mockResolvedValue({ id: 22 }),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    fetchTaskLists: vi.fn().mockResolvedValue([{ id: 22, name: "Weekend" }]),
    refetchTasks: vi.fn(),
    setLastCreatedListId: vi.fn(),
    setPlanTimelineReadItem: vi.fn(),
    setRescheduleTask: vi.fn(),
    setShowCreateListFromTask: vi.fn(),
    setShowCreateTaskModal: vi.fn(),
    setTaskLists: vi.fn(),
    showToast: vi.fn(),
    updateTask: vi.fn().mockResolvedValue(undefined),
    openModal: vi.fn(),
    handleTimelineDelete: vi.fn().mockResolvedValue(undefined),
    taskLists: [],
    enrolledModules: [],
    tags: [{ id: 99, label: "Routine" }],
    selectedDate: "2026-03-24T00:00:00.000Z",
    lastCreatedListId: null,
    showCreateTaskModal: true,
    showCreateListFromTask: true,
    rescheduleTask: { id: 8, title: "Move me" },
    planTimelineReadItem: { id: 7, title: "Reading" },
    styles,
    ...overrides,
  };
}

function renderHomepageModals(overrides = {}) {
  const props = buildModalProps(overrides);
  render(<HomepageModals {...props} />);
  return props;
}

function buildOverlayProps(overrides = {}) {
  return {
    styles,
    enrolledModules: [
      {
        id: 7,
        module_code: "CS101",
        module_name: "Algorithms",
        description: "A".repeat(140),
        module_leader: "Dr Ada",
        department: "Computing",
      },
    ],
    selectedModulePill: { id: 7, code: "CS101" },
    setSelectedModulePill: vi.fn(),
    selectedDeadline: {
      title: "Essay",
      module_code: "CS101",
      deadline_type: "exam",
      location: "Bush House",
      start_due_date: "2026-03-30T10:00:00.000Z",
      module_id: 7,
      description: "Submit online",
    },
    setSelectedDeadline: vi.fn(),
    ...overrides,
  };
}

function renderHomepageOverlays(overrides = {}) {
  const props = buildOverlayProps(overrides);
  render(<HomepageOverlays {...props} />);
  return props;
}

function click(label) {
  fireEvent.click(screen.getByText(label));
}

describe("Homepage modal, overlay, and semester-data extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HomepageModals interactions", () => {
    it("opens the create-list modal from the task modal", () => {
      const props = renderHomepageModals();
      click("open-list");
      expect(props.setShowCreateListFromTask).toHaveBeenCalledWith(true);
    });

    it("saves a scheduled task and closes the modal", async () => {
      const props = renderHomepageModals();
      click("save-task");
      await waitFor(() => expect(props.createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 99 })));
      expect(props.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "Breakfast prep" }));
      expect(props.showToast).toHaveBeenCalledWith('"Breakfast prep" added to today\'s schedule');
      expect(props.setShowCreateTaskModal).toHaveBeenCalledWith(false);
    });

    it("closes the task modal and clears the last created list id", () => {
      const props = renderHomepageModals();
      click("close-task");
      expect(props.setLastCreatedListId).toHaveBeenCalledWith(null);
    });

    it("creates a list and refreshes stored task lists", async () => {
      const props = renderHomepageModals();
      click("save-list");
      await waitFor(() => expect(props.createTaskList).toHaveBeenCalledWith({ name: "Weekend" }));
      expect(props.setTaskLists).toHaveBeenCalledWith([{ id: 22, name: "Weekend" }]);
    });

    it("saves the reschedule task edits and closes the modal", async () => {
      const props = renderHomepageModals();
      click("save-edit");
      await waitFor(() => expect(props.updateTask).toHaveBeenCalledWith(8, { title: "Edited task" }));
      click("close-edit");
      expect(props.setRescheduleTask).toHaveBeenCalledWith(null);
    });

    it("deletes the reschedule task from the modal", async () => {
      const props = renderHomepageModals();
      click("delete-edit");
      await waitFor(() => expect(props.deleteTask).toHaveBeenCalledWith(8));
    });

    it("handles plan read task actions", async () => {
      const props = renderHomepageModals();
      click("delete-plan-task");
      await waitFor(() => expect(props.deleteTask).toHaveBeenCalledWith(5));
      click("close-plan");
      expect(props.setPlanTimelineReadItem).toHaveBeenCalledWith(null);
    });

    it("handles plan event edit and delete actions", async () => {
      const props = renderHomepageModals();
      click("edit-plan-event");
      expect(props.openModal).toHaveBeenCalledWith({ id: "base-evt-1", tag: "study" }, "study");
      click("delete-plan-event");
      await waitFor(() => expect(props.handleTimelineDelete).toHaveBeenCalledWith({ id: "evt-2" }));
    });
  });

  describe("HomepageModals error and date branches", () => {
    it("shows add-to-schedule toggle as false when selected date isn't today", () => {
      isTodayMock.mockReturnValueOnce(false);
      renderHomepageModals({ showCreateListFromTask: false, planTimelineReadItem: null, tags: [] });
      expect(screen.getByText("false")).toBeInTheDocument();
    });

    it("surfaces an error toast when saving a task fails", async () => {
      const props = renderHomepageModals({
        createTask: vi.fn().mockRejectedValue(new Error("nope")),
        showCreateListFromTask: false,
        tags: [],
      });
      click("save-task");
      await waitFor(() => expect(props.showToast).toHaveBeenCalledWith("Couldn't add task. Try again."));
    });

    it("keeps the reschedule modal open when save or delete fail", async () => {
      const props = renderHomepageModals({
        updateTask: vi.fn().mockRejectedValue(new Error("nope")),
        deleteTask: vi.fn().mockRejectedValue(new Error("nope")),
      });
      click("save-edit");
      click("delete-edit");
      await waitFor(() => expect(props.setRescheduleTask).not.toHaveBeenCalledWith(null));
    });
  });

  describe("HomepageOverlays interactions", () => {
    it("clears module selection when closing or viewing the module", () => {
      const props = renderHomepageOverlays();
      expect(screen.getByText(/Leader: Dr Ada/)).toBeInTheDocument();
      fireEvent.click(screen.getAllByRole("dialog")[0]);
      expect(props.setSelectedModulePill).toHaveBeenCalledWith(null);
      fireEvent.click(screen.getByRole("button", { name: /View module/i }));
      expect(props.setSelectedModulePill).toHaveBeenCalledWith(null);
      expect(navigateMock).toHaveBeenCalledWith("/modules?moduleId=7");
    });

    it("clears deadline selection after navigation and backdrop clicks", () => {
      const props = renderHomepageOverlays();
      expect(screen.getByText("Essay")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Go to module/i }));
      expect(props.setSelectedDeadline).toHaveBeenCalledWith(null);
      expect(navigateMock).toHaveBeenCalledWith("/modules?moduleId=7");
      fireEvent.click(screen.getAllByRole("dialog")[1]);
      expect(props.setSelectedDeadline).toHaveBeenCalledWith(null);
    });
  });

  it("computes semester ranges from the given week span", () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useSemesterRange("", 12));
    expect(result.current.semStart.toISOString()).toContain("2026-02-09");
  });

  it("loads semester data and falls back on fetch failures", async () => {
    vi.useRealTimers();
    getEvents.mockResolvedValueOnce([{ id: 1 }]);
    getUpcomingDeadlines.mockResolvedValueOnce([{ id: 2 }]);
    const success = renderHook(() => useSemesterData(new Date("2026-01-01"), new Date("2026-04-01")));
    await waitFor(() => expect(success.result.current.loading).toBe(false));
    expect(getEvents).toHaveBeenCalledWith({ start: "2026-01-01", end: "2026-04-01" });
    expect(success.result.current.events).toEqual([{ id: 1 }]);
    expect(success.result.current.deadlines).toEqual([{ id: 2 }]);

    getEvents.mockRejectedValueOnce(new Error("offline"));
    const failure = renderHook(() => useSemesterData(new Date("2026-01-01"), new Date("2026-04-01")));
    await waitFor(() => expect(failure.result.current.loading).toBe(false));
    expect(failure.result.current.events).toEqual([]);
    expect(failure.result.current.deadlines).toEqual([]);
  });
});
