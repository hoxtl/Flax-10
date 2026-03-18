import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFeedToolbar from "../../../../pages/Tasks/components/TaskFeedToolbar";

vi.mock("../../../../components/common/AnimatedDropdown", () => ({
  default: ({ onChange, value }) => (
    <button data-testid="sort" onClick={() => onChange(value === "priority" ? "due" : "priority")}>sort</button>
  ),
}));

vi.mock("../../../../pages/Tasks/components/TaskFilterPanel", () => ({
  default: () => <div data-testid="task-filter-panel" />,
}));

function props(overrides = {}) {
  return {
    search: "",
    onSearchChange: vi.fn(),
    searchInputRef: { current: null },
    sortBy: "priority",
    onSortChange: vi.fn(),
    filterRef: { current: null },
    isFilterOpen: false,
    onFilterOpenChange: vi.fn(),
    activeFilterCount: 0,
    activeFilterTab: "lists",
    onFilterTabChange: vi.fn(),
    filterQuery: "",
    onFilterQueryChange: vi.fn(),
    visibleListItems: [],
    filterListIds: [],
    onToggleList: vi.fn(),
    moduleGroupKeys: [],
    groupedVisibleModuleItems: {},
    filterModuleCodes: [],
    onToggleModule: vi.fn(),
    onClearAllFilters: vi.fn(),
    ...overrides,
  };
}

describe("TaskFeedToolbar", () => {
  it("updates search and clears value", () => {
    const onSearchChange = vi.fn();
    render(<TaskFeedToolbar {...props({ search: "abc", onSearchChange })} />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /Clear search/i }));
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
});
