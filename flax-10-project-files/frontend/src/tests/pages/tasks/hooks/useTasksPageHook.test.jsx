/* Tests for useTasksPage hook orchestrating task page state and side effects */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../pages/tasks/hooks/useTasks", () => ({
  default: vi.fn(() => ({ tasks: [], initialLoading: false })),
}));
vi.mock("../../../../pages/tasks/hooks/useTaskLists", () => ({
  default: vi.fn(() => ({ lists: [], archivedLists: [], loading: false })),
}));

const helpers = vi.hoisted(() => ({
  filterTasksByListAndFilter: vi.fn(() => []),
  getTodayEndISO: vi.fn(() => "today-end"),
  buildTasksPageHandlers: vi.fn(() => ({ x: 1 })),
  buildTasksPageViewProps: vi.fn((state, _listsApi, _tasksApi, _handlers, filteredTasks, defaultDueDateForNewTask, activeModuleCode) => ({
    showTaskModal: state.showTaskModal,
    activeListId: state.activeListId,
    activeFilter: state.activeFilter,
    filteredTasks,
    defaultDueDateForNewTask,
    activeModuleCode,
  })),
}));

vi.mock("../../../../pages/tasks/utils/tasksPageUtils", () => helpers);

import useTasksPage from "../../../../pages/tasks/hooks/useTasksPage";

function wrapperWithUrl(url) {
  return function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  };
}

describe("useTasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads list query param", async () => {
    const { result } = renderHook(() => useTasksPage(), { wrapper: wrapperWithUrl("/tasks?list=12") });
    await waitFor(() => expect(result.current.activeListId).toBe("12"));
  });

  it("opens modal from fullPlanning URL flag", async () => {
    const { result } = renderHook(() => useTasksPage(), { wrapper: wrapperWithUrl("/tasks?open=fullPlanning") });
    await waitFor(() => expect(result.current.showTaskModal).toBe(true));
  });

  it("applies filter and module query params to derived view props", async () => {
    helpers.filterTasksByListAndFilter.mockImplementation((_tasks, _activeListId, activeFilter) =>
      activeFilter === "today" ? [{ id: 5 }] : []
    );

    const { result } = renderHook(() => useTasksPage(), {
      wrapper: wrapperWithUrl("/tasks?filter=today&module=CS101"),
    });

    await waitFor(() => expect(result.current.activeFilter).toBe("today"));
    expect(result.current.defaultDueDateForNewTask).toBe("today-end");
    expect(result.current.activeModuleCode).toBe("CS101");
    expect(result.current.filteredTasks).toEqual([{ id: 5 }]);
    expect(helpers.filterTasksByListAndFilter).toHaveBeenCalledWith([], null, "today", []);
  });

  it("does not set a default due date for non-today filters", async () => {
    const { result } = renderHook(() => useTasksPage(), {
      wrapper: wrapperWithUrl("/tasks?filter=overdue"),
    });

    await waitFor(() => expect(result.current.activeFilter).toBe("overdue"));
    expect(result.current.defaultDueDateForNewTask).toBeNull();
    expect(result.current.activeModuleCode).toBeNull();
  });
});
