import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFeedFilterPanel from "../../../../pages/Tasks/components/TaskFeedFilterPanel";

vi.mock("../../../../pages/Tasks/components/TaskFeedFilter.module.css", () => ({
  default: {
    filterPanelWrap: "wrap",
    filterBtn: "btn",
    filterCount: "count",
    filterPanel: "panel",
    filterTabs: "tabs",
    filterTab: "tab",
    filterTabActive: "active",
    filterSearchWrap: "searchWrap",
    filterSearchIcon: "icon",
    filterSearchInput: "searchInput",
    filterListContainer: "listContainer",
    filterItems: "items",
    filterEmptyText: "emptyText",
    filterGroups: "groups",
    filterGroup: "group",
    filterGroupTitle: "groupTitle",
    filterItemRow: "row",
    filterActions: "actions",
    filterClearBtn: "clearBtn",
  },
}));

describe("TaskFeedFilterPanel", () => {
  const defaultProps = {
    isOpen: false,
    onToggle: vi.fn(),
    activeFilterCount: 0,
    activeFilterTab: "lists",
    onTabChange: vi.fn(),
    filterQuery: "",
    onFilterQueryChange: vi.fn(),
    visibleListItems: [{ value: "1", label: "List A" }],
    filterListIds: [],
    onToggleList: vi.fn(),
    groupedVisibleModuleItems: { CS101: [{ value: "CS101", label: "CS101 — CS 101" }] },
    moduleGroupKeys: ["CS101"],
    filterModuleCodes: [],
    onToggleModule: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("renders filter button and toggles panel on click", () => {
    render(<TaskFeedFilterPanel {...defaultProps} />);
    expect(screen.getByText("Filter")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    expect(defaultProps.onToggle).toHaveBeenCalled();
  });

  it("shows active filter count when count > 0", () => {
    render(<TaskFeedFilterPanel {...defaultProps} activeFilterCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("when open renders dialog with Lists and Modules tabs", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.getByRole("dialog", { name: "Task filters" })).toBeInTheDocument();
    expect(screen.getByText("Lists")).toBeInTheDocument();
    expect(screen.getByText("Modules")).toBeInTheDocument();
  });

  it("tab change switches between lists and modules", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} />);
    fireEvent.click(screen.getByText("Modules"));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith("modules");
    fireEvent.click(screen.getByText("Lists"));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith("lists");
  });

  it("FilterSearch updates on change", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} />);
    const input = screen.getByPlaceholderText(/search lists\.\.\./i);
    fireEvent.change(input, { target: { value: "x" } });
    expect(defaultProps.onFilterQueryChange).toHaveBeenCalledWith("x");
  });

  it("lists tab shows list items and toggles", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} />);
    expect(screen.getByText("List A")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: /list a/i });
    fireEvent.click(checkbox);
    expect(defaultProps.onToggleList).toHaveBeenCalledWith("1");
  });

  it("lists tab shows No lists found when visibleListItems empty", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} visibleListItems={[]} />);
    expect(screen.getByText("No lists found.")).toBeInTheDocument();
  });

  it("modules tab shows module groups and toggles", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} activeFilterTab="modules" />);
    expect(screen.getByText("CS101")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: /cs101/i });
    fireEvent.click(checkbox);
    expect(defaultProps.onToggleModule).toHaveBeenCalledWith("CS101");
  });

  it("modules tab shows No modules found when moduleGroupKeys empty", () => {
    render(
      <TaskFeedFilterPanel
        {...defaultProps}
        isOpen={true}
        activeFilterTab="modules"
        groupedVisibleModuleItems={{}}
        moduleGroupKeys={[]}
      />
    );
    expect(screen.getByText("No modules found.")).toBeInTheDocument();
  });

  it("Clear all button calls onClearAll", () => {
    render(<TaskFeedFilterPanel {...defaultProps} isOpen={true} />);
    fireEvent.click(screen.getByText("Clear all"));
    expect(defaultProps.onClearAll).toHaveBeenCalled();
  });
});
