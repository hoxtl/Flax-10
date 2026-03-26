import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

const hoistedMocks = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getModulesMock: vi.fn(),
}));

export function getTaskFeedDataMocks() {
  return hoistedMocks;
}

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => hoistedMocks.navigateMock };
});

vi.mock("../../../../api/moduleApi", () => ({
  getModules: (...args) => hoistedMocks.getModulesMock(...args),
}));

vi.mock("../../../../components/Timer/taskInput/taskInputUtils", () => ({
  buildListItems: (lists = []) => lists.map((list) => ({ value: list.id, label: list.name })),
  filterListItems: (items) => items,
  groupModuleItems: (items) => ({ All: items }),
}));

vi.mock("../../../../lib/allTasksCompleteMessages", () => ({
  getClearMessage: () => "Great job",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedUtils", () => ({
  getHeaderTitle: () => "Header",
}));

vi.mock("../../../../pages/Tasks/utils/taskFeedDataUtils", () => ({
  buildDateBounds: vi.fn(() => ({
    now: new Date("2026-03-08T10:00:00Z"),
    dayStart: new Date("2026-03-08T00:00:00Z"),
    todayEnd: new Date("2026-03-08T23:59:59Z"),
    weekEnd: new Date("2026-03-15T23:59:59Z"),
  })),
  filterBySearch: vi.fn((arr) => arr),
  getOverdue: vi.fn(() => [{ id: 1 }]),
  getToday: vi.fn(() => [{ id: 2 }]),
  getThisWeek: vi.fn(() => [{ id: 3 }]),
  getLater: vi.fn(() => [{ id: 4 }]),
  getCompletedTodayCount: vi.fn(() => 1),
  getCompletedWeekCount: vi.fn(() => 2),
  getCompletedLaterCount: vi.fn(() => 3),
  getFilterHandlers: vi.fn(() => ({
    toggleListFilter: vi.fn(),
    toggleModuleFilter: vi.fn(),
    clearAllFilters: vi.fn(),
  })),
}));

import useTaskFeedData from "../../../../pages/Tasks/hooks/useTaskFeedData";
import * as taskFeedDataUtils from "../../../../pages/Tasks/utils/taskFeedDataUtils";

export function resetTaskFeedDataUtils({
  overdue = [{ id: 1 }],
  today = [{ id: 2 }],
  thisWeek = [{ id: 3 }],
  later = [{ id: 4 }],
  completedToday = 1,
  completedWeek = 2,
  completedLater = 3,
} = {}) {
  vi.clearAllMocks();
  vi.mocked(taskFeedDataUtils.filterBySearch).mockImplementation((arr) => arr);
  vi.mocked(taskFeedDataUtils.getOverdue).mockReturnValue(overdue);
  vi.mocked(taskFeedDataUtils.getToday).mockReturnValue(today);
  vi.mocked(taskFeedDataUtils.getThisWeek).mockReturnValue(thisWeek);
  vi.mocked(taskFeedDataUtils.getLater).mockReturnValue(later);
  vi.mocked(taskFeedDataUtils.getCompletedTodayCount).mockReturnValue(completedToday);
  vi.mocked(taskFeedDataUtils.getCompletedWeekCount).mockReturnValue(completedWeek);
  vi.mocked(taskFeedDataUtils.getCompletedLaterCount).mockReturnValue(completedLater);
  vi.mocked(taskFeedDataUtils.getFilterHandlers).mockImplementation(() => ({
    toggleListFilter: vi.fn(),
    toggleModuleFilter: vi.fn(),
    clearAllFilters: vi.fn(),
  }));
  hoistedMocks.getModulesMock.mockResolvedValue([]);
}

export function renderTaskFeedData(props = {}) {
  return renderHook(() =>
    useTaskFeedData({
      tasks: [],
      lists: [],
      activeFilter: "all",
      activeListId: null,
      filterListIds: [],
      ...props,
    }),
  );
}
