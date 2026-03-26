/**
 * Covers TaskFeedSubHeader mobile and desktop controls.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFnMap } from "../../../utils/factoryUtils";

vi.mock("lucide-react", () => ({
  Plus: () => <span>plus-icon</span>,
}));

vi.mock("../../../../components/common/AnimatedDropdown", () => ({
  default: ({ value, onChange, options = [] }) => (
    <select aria-label="mobile-view-dropdown" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  ),
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../pages/Tasks/components/CreateTaskBar", () => ({
  default: (props) => <div data-testid="create-task-bar">{props.defaultListId}</div>,
}));

vi.mock("../../../../pages/Tasks/components/TaskFeedToolbar", () => ({
  default: (props) => <div data-testid="task-feed-toolbar">{props.search}</div>,
}));

import TaskFeedSubHeader from "../../../../pages/Tasks/components/TaskFeedSubHeader";

const dataActionNames = [
  "setSearch",
  "setSortBy",
  "setIsFilterOpen",
  "setActiveFilterTab",
  "setFilterQuery",
  "toggleListFilter",
  "toggleModuleFilter",
  "clearAllFilters",
];

function buildData(overrides = {}) {
  return {
    search: "abc",
    searchInputRef: { current: null },
    sortBy: "priority",
    filterRef: { current: null },
    isFilterOpen: false,
    activeFilterCount: 0,
    activeFilterTab: "lists",
    filterQuery: "",
    visibleListItems: [],
    filterListIds: [],
    moduleGroupKeys: [],
    groupedVisibleModuleItems: {},
    filterModuleCodes: [],
    ...createFnMap(dataActionNames),
    ...overrides,
  };
}

function buildProps(overrides = {}) {
  const { data, ...rest } = overrides;
  return {
    isMobile: true,
    activeFilter: "all",
    onSelectFilter: vi.fn(),
    onSelectList: vi.fn(),
    lists: [{ id: 1, name: "Inbox" }],
    activeListId: "1",
    defaultDueDateForNewTask: "2026-03-25",
    onAddTask: vi.fn(),
    onCreateTask: vi.fn(),
    onOpenLists: vi.fn(),
    data: buildData(data),
    ...rest,
  };
}

describe("TaskFeedSubHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders mobile controls, create bar, and desktop/mobile plan labels", () => {
    const props = buildProps();
    const { rerender } = render(<TaskFeedSubHeader {...props} />);

    expect(screen.getByLabelText("mobile-view-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("create-task-bar")).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Plan/i })).toBeInTheDocument();
    expect(screen.getByTestId("task-feed-toolbar")).toHaveTextContent("abc");

    rerender(<TaskFeedSubHeader {...buildProps({ isMobile: false })} />);
    expect(screen.getByRole("button", { name: /Full Planning/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("mobile-view-dropdown")).not.toBeInTheDocument();
  });

  it("clears the selected list when the mobile filter changes", () => {
    const props = buildProps();
    render(<TaskFeedSubHeader {...props} />);

    fireEvent.change(screen.getByLabelText("mobile-view-dropdown"), { target: { value: "today" } });

    expect(props.onSelectList).toHaveBeenCalledWith(null);
    expect(props.onSelectFilter).toHaveBeenCalledWith("today");
  });

  it("renders spacer and hides planning CTA when create actions are unavailable", () => {
    render(<TaskFeedSubHeader {...buildProps({ onAddTask: null, onCreateTask: null, isMobile: false })} />);

    expect(document.querySelector("[aria-hidden='true']")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Full Planning/i })).not.toBeInTheDocument();
  });
});
