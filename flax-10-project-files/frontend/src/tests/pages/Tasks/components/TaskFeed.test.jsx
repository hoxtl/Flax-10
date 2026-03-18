import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFeed from "../../../../pages/Tasks/components/TaskFeed";

const useTaskFeedDataMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useTaskFeedData", () => ({
  default: useTaskFeedDataMock,
}));

vi.mock("../../../../pages/Tasks/components/CreateTaskBar", () => ({
  default: () => <div data-testid="create-task-bar" />,
}));
vi.mock("../../../../pages/Tasks/components/TaskFeedToolbar", () => ({
  default: () => <div data-testid="task-feed-toolbar" />,
}));
vi.mock("../../../../pages/Tasks/components/CompletedTasksSection", () => ({
  default: ({ tasks }) => <div data-testid="completed-block">{tasks.length}</div>,
}));
vi.mock("../../../../pages/Tasks/components/TaskSection", () => ({
  default: ({ title }) => <div data-testid="task-section">{title}</div>,
}));
vi.mock("../../../../components/ui/EstTimeHelpBanner", () => ({
  default: () => <div data-testid="est-time-help" />,
}));

function data(overrides = {}) {
  return {
    headerTitle: "Inbox",
    search: "",
    setSearch: vi.fn(),
    sortBy: "priority",
    setSortBy: vi.fn(),
    searchInputRef: { current: null },
    filterRef: { current: null },
    isFilterOpen: false,
    setIsFilterOpen: vi.fn(),
    activeFilterCount: 0,
    activeFilterTab: "lists",
    setActiveFilterTab: vi.fn(),
    filterQuery: "",
    setFilterQuery: vi.fn(),
    visibleListItems: [],
    filterListIds: [],
    toggleListFilter: vi.fn(),
    moduleGroupKeys: [],
    groupedVisibleModuleItems: {},
    filterModuleCodes: [],
    toggleModuleFilter: vi.fn(),
    clearAllFilters: vi.fn(),
    showSearchEmptyState: false,
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    completed: [],
    filtered: [],
    filteredCompleted: [],
    completedTodayCount: 0,
    completedWeekCount: 0,
    completedLaterCount: 0,
    allTasksCombined: [],
    todayEmptyCardProps: null,
    sectionProps: { sortBy: "priority", listMap: {}, lists: [], hideListBadge: false, searchQuery: "" },
    ...overrides,
  };
}

describe("TaskFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders today view sections", () => {
    useTaskFeedDataMock.mockReturnValue(data({ overdue: [{ id: 1 }], today: [{ id: 2 }] }));
    render(<TaskFeed activeFilter="today" lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} onCreateTask={vi.fn()} onAddTask={vi.fn()} />);
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getAllByTestId("task-section").length).toBe(2);
  });

  it("renders this week sections", () => {
    useTaskFeedDataMock.mockReturnValue(data({ today: [{ id: 1 }], thisWeek: [{ id: 2 }] }));
    render(<TaskFeed activeFilter="this_week" lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    expect(screen.getAllByTestId("task-section").length).toBe(2);
  });

  it("renders all tasks section by default", () => {
    useTaskFeedDataMock.mockReturnValue(data({ allTasksCombined: [{ id: 1 }] }));
    render(<TaskFeed activeFilter="all" lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    expect(screen.getByText("All tasks")).toBeInTheDocument();
  });

  it("renders search empty state and clears query", () => {
    const setSearch = vi.fn();
    useTaskFeedDataMock.mockReturnValue(data({ showSearchEmptyState: true, search: "abc", setSearch }));
    render(<TaskFeed activeFilter="all" lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Clear search/i }));
    expect(setSearch).toHaveBeenCalledWith("");
  });

  it("renders completed block when completed tasks are filtered", () => {
    useTaskFeedDataMock.mockReturnValue(data({ filteredCompleted: [{ id: 99 }] }));
    render(<TaskFeed activeFilter="all" lists={[]} onToggleComplete={vi.fn()} onDeleteTask={vi.fn()} onEditTask={vi.fn()} />);
    expect(screen.getByTestId("completed-block")).toHaveTextContent("1");
  });
});
