/* Tests for TaskFeedToolbar component sort and filter controls */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFeedToolbar from "../../../../pages/tasks/components/TaskFeedToolbar";
import { createFnMap } from "../../../utils/testBuilderUtils";

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ onChange, value }) => (
    <button data-testid="sort" onClick={() => onChange(value === "priority" ? "due" : "priority")}>sort</button>
  ),
}));

vi.mock("../../../../pages/tasks/components/TaskFilterPanel", () => ({
  default: () => <div data-testid="task-filter-panel" />,
}));

const toolbarActionNames = [
  "onSearchChange",
  "onSortChange",
  "onFilterOpenChange",
  "onFilterTabChange",
  "onFilterQueryChange",
  "onToggleList",
  "onToggleModule",
  "onClearAllFilters",
];

const baseToolbarProps = {
  search: "",
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
};

function props(overrides = {}) {
  return {
    ...baseToolbarProps,
    ...createFnMap(toolbarActionNames),
    ...overrides,
  };
}

describe("TaskFeedToolbar", () => {
  it("updates search and clears value", () => {
    const onSearchChange = vi.fn();
    render(<TaskFeedToolbar {...props({ search: "abc", onSearchChange })} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Clear search/i }));
    fireEvent.keyDown(screen.getByPlaceholderText(/Search/i), { key: "Escape" });
    expect(onSearchChange).toHaveBeenCalledWith("x");
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("toggles filter panel and sort", () => {
    const onFilterOpenChange = vi.fn();
    const onSortChange = vi.fn();
    const p = props({ onFilterOpenChange, onSortChange, isFilterOpen: true, activeFilterCount: 2 });
    render(<TaskFeedToolbar {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /Filter/i }));
    fireEvent.click(screen.getByTestId("sort"));
    expect(onFilterOpenChange).toHaveBeenCalled();
    expect(onSortChange).toHaveBeenCalledWith("due");
    expect(screen.getByTestId("task-filter-panel")).toBeInTheDocument();
  });

  it("hides the view lists button when no handler is provided", () => {
    render(<TaskFeedToolbar {...props({ onOpenLists: null })} />);
    expect(screen.queryByRole("button", { name: /View lists/i })).not.toBeInTheDocument();
  });
});
