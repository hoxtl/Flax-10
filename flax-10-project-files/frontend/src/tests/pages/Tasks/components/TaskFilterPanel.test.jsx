/*
 * Tests for TaskFilterPanel: tabs, search, lists tab, modules tab, clear.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskFilterPanel from "../../../../pages/Tasks/components/TaskFilterPanel";

describe("TaskFilterPanel", () => {
  const defaultProps = {
    activeFilterTab: "lists",
    onTabChange: vi.fn(),
    filterQuery: "",
    onQueryChange: vi.fn(),
    visibleListItems: [{ value: "1", label: "Work" }],
    filterListIds: [],
    onToggleList: vi.fn(),
    moduleGroupKeys: ["CS"],
    groupedModuleItems: { CS: [{ value: "cs101", label: "CS101" }] },
    filterModuleCodes: [],
    onToggleModule: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("renders Lists and Modules tabs", () => {
    render(<TaskFilterPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Lists/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modules/i })).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<TaskFilterPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Search lists/i)).toBeInTheDocument();
  });

  it("renders list items when lists tab active", () => {
    render(<TaskFilterPanel {...defaultProps} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("calls onTabChange when Modules tab clicked", () => {
    render(<TaskFilterPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Modules/i }));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith("modules");
  });

  it("calls onClearAll when Clear all clicked", () => {
    render(<TaskFilterPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(defaultProps.onClearAll).toHaveBeenCalled();
  });

  it("shows No lists found when visibleListItems empty", () => {
    render(<TaskFilterPanel {...defaultProps} visibleListItems={[]} />);
    expect(screen.getByText(/No lists found/i)).toBeInTheDocument();
  });
});
