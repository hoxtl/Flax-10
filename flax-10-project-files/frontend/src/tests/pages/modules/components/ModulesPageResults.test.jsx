/*
 * Tests modules page result states, toolbars, and enrolment listings.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  buildSearchState,
  buildSorting,
  buildTestState,
  getModulesPageResultsMocks,
  resetModulesPageResultsMocks,
} from "./modulesPageResultsTestSetup.jsx";
import {
  EmptyResults,
  ModuleResults,
  ModuleToolbar,
  MyEnrolmentsTabContent,
} from "../../../../pages/modules/components/ModulesPageResults.jsx";

const { filterModulesMock, useModuleSortingMock } = getModulesPageResultsMocks();

function buildStudentEnrolmentState() {
  return buildTestState({
    isTeacher: false,
    hook: {
      modules: [{ id: 2, module_code: "CS202" }],
      enrollments: [{ module: 2 }],
      toggleEnrollment: vi.fn(),
      taskCountsByModule: {},
    },
  });
}

function setStudentEnrolmentSorting() {
  filterModulesMock.mockReturnValue([{ id: 2, module_code: "CS202" }]);
  useModuleSortingMock.mockReturnValue(buildSorting({
    results: [{ id: 2, module_code: "CS202" }],
    pageModules: [{ id: 2, module_code: "CS202" }],
  }));
}

describe("Modules page results", () => {
  beforeEach(() => {
    resetModulesPageResultsMocks();
  });

  it("clears search-driven empty results without changing the current student view", () => {
    const search = buildSearchState({ query: "physics", filter: "enrolled" });
    const sorting = buildSorting({ results: [], selectedCourses: [] });
    render(<ModuleResults state={{ isTeacher: false }} search={search} sorting={sorting} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(search.onQueryChange).toHaveBeenCalledWith("");
    expect(search.onFilterChange).not.toHaveBeenCalled();
    expect(sorting.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("clears active filters when the teacher empty state is shown", () => {
    const search = buildSearchState({ filter: "enrolled" });
    const sorting = buildSorting({ results: [], selectedCourses: ["CS"] });
    render(<EmptyResults search={search} sorting={sorting} isTeacher />);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(search.onQueryChange).not.toHaveBeenCalled();
    expect(search.onFilterChange).toHaveBeenCalledWith("all");
    expect(sorting.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("shows the student browse-empty action and switches back to browse view", () => {
    const search = buildSearchState({ filter: "enrolled" });
    render(<EmptyResults search={search} sorting={buildSorting({ results: [] })} isTeacher={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Browse modules" }));
    expect(search.onFilterChange).toHaveBeenCalledWith("all");
  });

  it("falls back to the generic modules empty state when browsing has no results", () => {
    const search = buildSearchState();
    render(<EmptyResults search={search} sorting={buildSorting({ results: [], selectedCourses: [] })} isTeacher={false} />);
    expect(screen.getByText("search-empty")).toBeInTheDocument();
  });

  it("renders module results with pagination and passes grid actions through", () => {
    const state = buildTestState();
    const sorting = buildSorting({ currentPage: 2, totalPages: 5 });
    render(<ModuleResults state={state} search={buildSearchState()} sorting={sorting} />);
    expect(screen.getAllByText("Page 2 / 5")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "view" }));
    expect(state.setDeletingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setViewingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setEditingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setShowForm).toHaveBeenCalledWith(true);
  });

  it("exposes the enrolled-search toolbar and resets pagination when typing", () => {
    const state = { hook: { modules: [{ id: 1, module_code: "CS101" }], enrollments: [{ module: 1 }], toggleEnrollment: vi.fn(), taskCountsByModule: {} } };
    render(<MyEnrolmentsTabContent state={state} />);
    fireEvent.change(screen.getByPlaceholderText("Search your enrolled modules..."), { target: { value: "cs" } });
    expect(useModuleSortingMock).toHaveBeenCalled();
    expect(filterModulesMock).toHaveBeenCalledWith(state.hook.modules, state.hook.enrollments, "", "enrolled");
  });

  it("shows the enrolled-modules empty state and clears its local search", () => {
    useModuleSortingMock.mockReturnValue(buildSorting({ results: [], pageModules: [] }));
    filterModulesMock.mockReturnValue([]);
    render(<MyEnrolmentsTabContent state={{ hook: { modules: [], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } }} />);
    expect(screen.getByText("search-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  });

  it("passes view and edit actions through the enrolments grid", () => {
    const state = buildStudentEnrolmentState();
    setStudentEnrolmentSorting();
    render(<MyEnrolmentsTabContent state={state} />);
    fireEvent.click(screen.getByRole("button", { name: "view" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    expect(state.setViewingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
    expect(state.setEditingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
    expect(state.setShowForm).toHaveBeenCalledWith(true);
  });

  it("passes delete actions through the enrolments grid", () => {
    const state = buildStudentEnrolmentState();
    setStudentEnrolmentSorting();
    render(<MyEnrolmentsTabContent state={state} />);
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    expect(state.setDeletingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
  });

  it("uses the enrolled-modules placeholder and hides the course filter for my-modules views", () => {
    render(<ModuleToolbar search={buildSearchState()} sorting={buildSorting({ selectedCourses: undefined, toggleCourse: undefined })} isTeacher={false} isMyModules />);
    expect(screen.getByPlaceholderText("Search your modules by name or code...")).toBeInTheDocument();
    expect(screen.queryByText("CourseFilter")).not.toBeInTheDocument();
  });

  it("falls back to a safe no-op course toggle when the sorting hook does not provide one", () => {
    render(<ModuleToolbar search={buildSearchState()} sorting={buildSorting({ selectedCourses: undefined, toggleCourse: undefined })} isTeacher={false} isMyModules={false} />);
    fireEvent.click(screen.getByRole("button", { name: "toggle course" }));
    expect(screen.getByText("CourseFilter")).toBeInTheDocument();
  });

  it("treats an undefined selectedCourses list as no active filters", () => {
    const search = buildSearchState();
    render(<EmptyResults search={search} sorting={buildSorting({ selectedCourses: undefined })} isTeacher={false} />);
    expect(screen.getByText("search-empty")).toBeInTheDocument();
  });
});
