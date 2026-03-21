/* Tests for useTasksPage hook orchestrating task page state and side effects */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../pages/Tasks/hooks/useTasks", () => ({
  default: vi.fn(() => ({ tasks: [], initialLoading: false })),
}));
vi.mock("../../../../pages/Tasks/hooks/useTaskLists", () => ({
  default: vi.fn(() => ({ lists: [], archivedLists: [], loading: false })),
}));

const helpers = vi.hoisted(() => ({
  filterTasksByListAndFilter: vi.fn(() => []),
  getTodayEndISO: vi.fn(() => "today-end"),
  buildTasksPageHandlers: vi.fn(() => ({ x: 1 })),
  buildTasksPageViewProps: vi.fn((state) => ({ showTaskModal: state.showTaskModal, activeListId: state.activeListId })),
}));

vi.mock("../../../../pages/Tasks/utils/tasksPageUtils", () => helpers);

import useTasksPage from "../../../../pages/Tasks/hooks/useTasksPage";

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
});
