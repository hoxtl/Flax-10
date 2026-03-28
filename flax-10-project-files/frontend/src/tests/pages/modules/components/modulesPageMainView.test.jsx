/*
 * Tests modules page main view states for teacher and student flows.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  buildSearchState,
  buildSorting,
  buildTestState,
  getModulesPageResultsMocks,
  resetModulesPageResultsMocks,
} from "./modulesPageResultsTestSetup.jsx";
import { MainView } from "../../../../pages/modules/components/ModulesPageResults.jsx";

const { useMainModuleViewMock } = getModulesPageResultsMocks();

function buildStudentState(overrides = {}) {
  return buildTestState({
    isTeacher: false,
    hook: {
      modules: [{ id: 1, module_code: "CS101" }],
      enrollments: [{ module: 1 }],
      toggleEnrollment: vi.fn(),
      taskCountsByModule: {},
      ...overrides.hook,
    },
    ...overrides,
  });
}

describe("Modules page main view", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resetModulesPageResultsMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("shows the student overview tab content", () => {
    useMainModuleViewMock.mockReturnValueOnce({ search: buildSearchState({ filter: "enrolled" }), sorting: buildSorting() });
    render(<MainView state={buildStudentState()} />);
    expect(screen.getByText("MyModulesDashboard")).toBeInTheDocument();
    expect(screen.getByText("BackToTop")).toBeInTheDocument();
  });

  it("renders the teacher page title and opens the create module form", () => {
    const state = buildTestState({
      hook: { modules: [{ id: 1, module_code: "CS101" }], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} },
    });
    render(<MainView state={state} />);
    expect(screen.getByText("Modules")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /\+ Create Module/i }));
    expect(state.setEditingModule).toHaveBeenCalledWith(null);
    expect(state.setShowForm).toHaveBeenCalledWith(true);
  });

  it("renders the student browse view title, subtitle, and toolbar placeholder", () => {
    useMainModuleViewMock.mockReturnValueOnce({ search: buildSearchState(), sorting: buildSorting() });
    render(<MainView state={buildStudentState({ hook: { modules: [{ id: 3, module_code: "CS303" }], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } })} />);
    expect(screen.getByRole("heading", { name: "Browse Modules" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search King's modules by name or code...")).toBeInTheDocument();
    expect(screen.getByText("My Modules")).toBeInTheDocument();
    expect(screen.getAllByText("Browse Modules").length).toBeGreaterThan(0);
  });

  it("wraps the student browse view in a page transition outside the test environment", () => {
    process.env.NODE_ENV = "production";
    useMainModuleViewMock.mockReturnValueOnce({ search: buildSearchState(), sorting: buildSorting() });
    render(<MainView state={buildStudentState({ hook: { modules: [{ id: 4, module_code: "CS404" }], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } })} />);
    expect(screen.getByTestId("page-transition")).toBeInTheDocument();
  });

  it("switches the student overview to the enrolments tab", () => {
    const state = buildStudentState({ hook: { modules: [{ id: 2, module_code: "CS202" }], enrollments: [{ module: 2 }], toggleEnrollment: vi.fn(), taskCountsByModule: {} } });
    useMainModuleViewMock.mockReturnValueOnce({ search: buildSearchState({ filter: "enrolled" }), sorting: buildSorting() });
    render(<MainView state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /My Enrolments/i }));
    expect(screen.getByPlaceholderText("Search your enrolled modules...")).toBeInTheDocument();
    expect(screen.getByTestId("module-grid")).toBeInTheDocument();
  });
});
