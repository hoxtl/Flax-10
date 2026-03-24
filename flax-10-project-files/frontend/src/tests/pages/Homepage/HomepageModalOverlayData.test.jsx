import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

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

describe("Homepage modal, overlay, and semester-data extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles homepage modal task, list, edit, and plan-read flows", async () => {
    const props = {
      addEvent: vi.fn().mockResolvedValue(undefined),
      createTask: createTask.mockResolvedValue({ id: 10, title: "Breakfast prep", description: "Cook" }),
      createTaskList: createTaskList.mockResolvedValue({ id: 22 }),
      deleteTask: deleteTask.mockResolvedValue(undefined),
      fetchTaskLists: fetchTaskLists.mockResolvedValue([{ id: 22, name: "Weekend" }]),
      refetchTasks: vi.fn(),
      setLastCreatedListId: vi.fn(),
      setPlanTimelineReadItem: vi.fn(),
      setRescheduleTask: vi.fn(),
      setShowCreateListFromTask: vi.fn(),
      setShowCreateTaskModal: vi.fn(),
      setTaskLists: vi.fn(),
      showToast: vi.fn(),
      updateTask: updateTask.mockResolvedValue(undefined),
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
    };

    render(<HomepageModals {...props} />);

    fireEvent.click(screen.getByText("open-list"));
    expect(props.setShowCreateListFromTask).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByText("save-task"));
    await waitFor(() => expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ tag: 99 })));
    expect(props.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "Breakfast prep" }));
    expect(props.showToast).toHaveBeenCalledWith('"Breakfast prep" added to today\'s schedule');
    expect(props.setShowCreateTaskModal).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByText("close-task"));
    expect(props.setLastCreatedListId).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByText("save-list"));
    await waitFor(() => expect(createTaskList).toHaveBeenCalledWith({ name: "Weekend" }));
    expect(props.setTaskLists).toHaveBeenCalledWith([{ id: 22, name: "Weekend" }]);

    fireEvent.click(screen.getByText("save-edit"));
    await waitFor(() => expect(updateTask).toHaveBeenCalledWith(8, { title: "Edited task" }));
    fireEvent.click(screen.getByText("delete-edit"));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(8));
    fireEvent.click(screen.getByText("close-edit"));
    expect(props.setRescheduleTask).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByText("delete-plan-task"));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith(5));
    fireEvent.click(screen.getByText("edit-plan-event"));
    expect(props.openModal).toHaveBeenCalledWith({ id: "base-evt-1", tag: "study" }, "study");
    fireEvent.click(screen.getByText("delete-plan-event"));
    await waitFor(() => expect(props.handleTimelineDelete).toHaveBeenCalledWith({ id: "evt-2" }));
    fireEvent.click(screen.getByText("close-plan"));
    expect(props.setPlanTimelineReadItem).toHaveBeenCalledWith(null);
  });

  it("covers homepage modal error and non-today branches", async () => {
    isTodayMock.mockReturnValueOnce(false);
    const props = {
      addEvent: vi.fn(),
      createTask: vi.fn().mockRejectedValue(new Error("nope")),
      createTaskList: vi.fn(),
      deleteTask: vi.fn().mockRejectedValue(new Error("nope")),
      fetchTaskLists: vi.fn(),
      refetchTasks: vi.fn(),
      setLastCreatedListId: vi.fn(),
      setPlanTimelineReadItem: vi.fn(),
      setRescheduleTask: vi.fn(),
      setShowCreateListFromTask: vi.fn(),
      setShowCreateTaskModal: vi.fn(),
      setTaskLists: vi.fn(),
      showToast: vi.fn(),
      updateTask: vi.fn().mockRejectedValue(new Error("nope")),
      openModal: vi.fn(),
      handleTimelineDelete: vi.fn(),
      taskLists: [],
      enrolledModules: [],
      tags: [],
      selectedDate: "2026-03-25T00:00:00.000Z",
      lastCreatedListId: null,
      showCreateTaskModal: true,
      showCreateListFromTask: false,
      rescheduleTask: { id: 8, title: "Move me" },
      planTimelineReadItem: null,
      styles,
    };

    render(<HomepageModals {...props} />);
    expect(screen.getByText("false")).toBeInTheDocument();
    fireEvent.click(screen.getByText("save-task"));
    await waitFor(() => expect(props.showToast).toHaveBeenCalledWith("Couldn't add task. Try again."));
    fireEvent.click(screen.getByText("save-edit"));
    fireEvent.click(screen.getByText("delete-edit"));
    await waitFor(() => expect(props.setRescheduleTask).not.toHaveBeenCalledWith(null));
  });

  it("renders module and deadline overlays and closes them through actions", () => {
    const setSelectedModulePill = vi.fn();
    const setSelectedDeadline = vi.fn();
    render(
      <HomepageOverlays
        styles={styles}
        enrolledModules={[{ id: 7, module_code: "CS101", module_name: "Algorithms", description: "A".repeat(140), module_leader: "Dr Ada", department: "Computing" }]}
        selectedModulePill={{ id: 7, code: "CS101" }}
        setSelectedModulePill={setSelectedModulePill}
        selectedDeadline={{ title: "Essay", module_code: "CS101", deadline_type: "exam", location: "Bush House", start_due_date: "2026-03-30T10:00:00.000Z", module_id: 7, description: "Submit online" }}
        setSelectedDeadline={setSelectedDeadline}
      />,
    );

    expect(screen.getAllByText("CS101").length).toBeGreaterThan(0);
    expect(screen.getByText(/Leader: Dr Ada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View module/ })).toHaveAttribute("href", "/modules?moduleId=7");
    fireEvent.click(screen.getByLabelText("Close"));
    expect(setSelectedModulePill).toHaveBeenCalledWith(null);

    expect(screen.getByText("Essay")).toBeInTheDocument();
    expect(screen.getByText("Submit online")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Go to module/ })).toHaveAttribute("href", "/modules?moduleId=7");
    fireEvent.click(screen.getAllByRole("dialog")[1]);
    expect(setSelectedDeadline).toHaveBeenCalledWith(null);
  });

  it("loads semester ranges and falls back cleanly on API failures", async () => {
    vi.useRealTimers();
    const { result: rangeResult } = renderHook(() => useSemesterRange("", 12));
    expect(rangeResult.current.semStart.toISOString()).toContain("2026-02-09");

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
