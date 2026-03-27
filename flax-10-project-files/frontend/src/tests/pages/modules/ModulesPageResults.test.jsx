import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../components/modules/modules/ModuleGrid.jsx", () => ({
  default: ({ modules }) => <div data-testid="module-grid">{modules.map(m => <div key={m.id}>{m.module_code}</div>)}</div>,
}));

vi.mock("../../../components/modules/modules/ModuleCourseFilter", () => ({
  default: () => <div>CourseFilter</div>,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState.jsx", () => ({
  default: ({ itemLabel, title }) => <div>{title || `No ${itemLabel} found`}</div>,
}));

vi.mock("../../../components/common/page_toolbar/PageToolbar", () => ({
  default: ({ searchSlot, controlsSlot }) => <div>{searchSlot}{controlsSlot}</div>,
  ToolbarSortControl: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/search_bar/SearchBar.jsx", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  ),
}));

import {
  EmptyResults,
  ModuleToolbar,
} from "../../../pages/modules/ModulesPageResults";

describe("ModulesPageResults", () => {
  it("EmptyResults: handles various empty states", () => {
    const search = { query: "test", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: [], clearFilters: vi.fn() };
    const { rerender } = render(<EmptyResults search={search} sorting={sorting} isTeacher={false} />);
    expect(screen.getByText(/No your modules found|No modules found/)).toBeInTheDocument();

    rerender(<EmptyResults search={{ ...search, query: "" }} sorting={{ ...sorting, selectedCourses: ["CS"] }} isTeacher={false} />);
    expect(screen.getByText("No modules matched your filters")).toBeInTheDocument();

    rerender(<EmptyResults search={{ ...search, query: "" }} sorting={sorting} isTeacher={true} />);
    expect(screen.getByText("No modules yet")).toBeInTheDocument();
  });

  it("ModuleToolbar: renders course filter for students only", () => {
    const search = { query: "", onQueryChange: vi.fn() };
    const sorting = { sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], toggleCourse: vi.fn() };
    const { rerender } = render(<ModuleToolbar search={search} sorting={sorting} isTeacher={false} isMyModules={false} />);
    expect(screen.getByText("CourseFilter")).toBeInTheDocument();

    rerender(<ModuleToolbar search={search} sorting={sorting} isTeacher={true} isMyModules={false} />);
    expect(screen.queryByText("CourseFilter")).not.toBeInTheDocument();
  });
});
