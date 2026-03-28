import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, onClear }) => (
    <div data-testid="search-empty">
      <span>{query}</span>
      <button type="button" onClick={onClear}>clear-search</button>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskSection", () => ({
  default: ({ sectionType, onEditTask }) => (
    <div data-testid={`section-${sectionType}`}>
      <span>{sectionType}</span>
      <span>{typeof onEditTask}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/SuggestedReadingsSection", () => ({
  default: ({ activeList, onTaskAdded }) => (
    <div data-testid="suggested-readings">
      <span>{activeList?.name}</span>
      <button type="button" onClick={onTaskAdded}>added</button>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/CompletedTasksSection", () => ({
  default: ({ onEditTask }) => (
    <div data-testid="completed-section">
      <span>{typeof onEditTask}</span>
    </div>
  ),
}));

vi.mock("../../../../pages/tasks/components/taskFeedSectionConfigs", () => ({
  getVisibleSections: vi.fn(),
}));

import TaskFeedSections from "../../../../pages/tasks/components/TaskFeedSections";
import { useAuth } from "../../../../context/AuthContext";
import { getVisibleSections } from "../../../../pages/tasks/components/taskFeedSectionConfigs";

function buildDataProps() {
  return {
    search: "",
    setSearch: vi.fn(),
    showSearchEmptyState: false,
    pending: [{ id: 1 }],
    completed: [{ id: 2 }],
    filteredCompleted: [{ id: 2 }],
    sortBy: "priority",
    listMap: {},
  };
}

function buildProps(overrides = {}) {
  return {
    activeFilter: "all",
    activeListId: "7",
    activeList: { id: 7, name: "CS101 - Systems" },
    readingList: true,
    taskCount: 2,
    onTaskAdded: vi.fn(),
    onToggleComplete: vi.fn(),
    onDeleteTask: vi.fn(),
    onEditTask: vi.fn(),
    sectionPropsWithHandlers: { extra: "value" },
    data: buildDataProps(),
    lists: [{ id: 7, name: "CS101 - Systems" }],
    ...overrides,
  };
}

describe("TaskFeedSections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ profile: { role: "student" } });
    getVisibleSections.mockReturnValue([{ sectionType: "today" }]);
  });

  it("clears the search-empty state", () => {
    const props = buildProps({
      data: {
        search: "essay",
        setSearch: vi.fn(),
        showSearchEmptyState: true,
        pending: [],
        completed: [],
        filteredCompleted: [],
        sortBy: "priority",
        listMap: {},
      },
    });

    render(<TaskFeedSections {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "clear-search" }));

    expect(props.data.setSearch).toHaveBeenCalledWith("");
    expect(screen.queryByTestId("section-today")).not.toBeInTheDocument();
    expect(screen.queryByTestId("suggested-readings")).not.toBeInTheDocument();
  });

  it("hides edit handlers for reading lists and suppresses suggested readings for teachers", () => {
    useAuth.mockReturnValue({ profile: { role: "teacher" } });
    const props = buildProps();

    render(<TaskFeedSections {...props} />);

    expect(screen.getByTestId("section-today")).toHaveTextContent("undefined");
    expect(screen.getByTestId("completed-section")).toHaveTextContent("undefined");
    expect(screen.queryByTestId("suggested-readings")).not.toBeInTheDocument();
  });

  it("shows suggested readings for non-teachers and forwards the add handler", () => {
    const props = buildProps({
      activeList: { id: 3, name: "CS101 - Systems" },
      readingList: true,
      data: {
        search: "",
        setSearch: vi.fn(),
        showSearchEmptyState: false,
        pending: [],
        completed: [],
        filteredCompleted: [],
        sortBy: "priority",
        listMap: {},
      },
    });

    render(<TaskFeedSections {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "added" }));

    expect(screen.getByTestId("section-today")).toHaveTextContent("undefined");
    expect(screen.getByTestId("suggested-readings")).toHaveTextContent("CS101 - Systems");
    expect(props.onTaskAdded).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("completed-section")).not.toBeInTheDocument();
  });

  it("forwards edit handlers for non-reading lists and renders completed items", () => {
    const props = buildProps({
      readingList: false,
      data: {
        search: "",
        setSearch: vi.fn(),
        showSearchEmptyState: false,
        pending: [],
        completed: [{ id: 9 }],
        filteredCompleted: [{ id: 9 }],
        sortBy: "priority",
        listMap: {},
      },
    });

    render(<TaskFeedSections {...props} />);

    expect(screen.getByTestId("section-today")).toHaveTextContent("function");
    expect(screen.getByTestId("completed-section")).toHaveTextContent("function");
    expect(screen.queryByTestId("suggested-readings")).not.toBeInTheDocument();
  });

  it("uses the all-list motion key when there is no active list id", () => {
    const props = buildProps({
      activeListId: null,
      readingList: false,
      data: {
        search: "",
        setSearch: vi.fn(),
        showSearchEmptyState: false,
        pending: [],
        completed: [],
        filteredCompleted: [],
        sortBy: "priority",
        listMap: {},
      },
    });

    const { container } = render(<TaskFeedSections {...props} />);

    expect(container.querySelector('[key="sections-all"]')).not.toBeInTheDocument();
    expect(screen.getByTestId("section-today")).toBeInTheDocument();
  });
});
