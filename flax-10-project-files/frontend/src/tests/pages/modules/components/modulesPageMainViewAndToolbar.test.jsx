import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useModuleSortingMock = vi.fn();
const filterModulesMock = vi.fn();
const useMainModuleViewMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
}));

vi.mock("../../../../components/common/app_page/AppPage", () => ({
  default: ({ children, title, action }) => (
    <div>
      <h1>{title}</h1>
      <div data-testid="app-action">{action}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("../../../../components/common/page_toolbar/PageToolbar", () => ({
  default: ({ searchSlot, controlsSlot }) => (
    <div>
      <div data-testid="toolbar-search">{searchSlot}</div>
      <div data-testid="toolbar-controls">{controlsSlot}</div>
    </div>
  ),
  ToolbarSortControl: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("../../../../components/common/page_transition/PageTransition.jsx", () => ({
  default: ({ children }) => <div data-testid="page-transition">{children}</div>,
}));

vi.mock("../../../../components/common/search_bar/SearchBar.jsx", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  ),
}));

vi.mock("../../../../components/common/tabs/Tabs", () => ({
  default: ({ tabs, activeTab, onTabChange }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}>
          {tab.label}
        </button>
      ))}
      <div data-testid="active-tab">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../../../components/common/segmented_control/SegmentedControl", () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div>
      <div data-testid="segment-value">{value}</div>
      {options.map((option) => (
        <button key={option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState.jsx", () => ({
  default: ({ title, hint, onClear, clearLabel }) => (
    <div>
      <div>{title || "search-empty"}</div>
      <div>{hint}</div>
      <button onClick={onClear}>{clearLabel || "Clear"}</button>
    </div>
  ),
}));

vi.mock("../../../../components/pagination/Pagination.jsx", () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) => (
    <div>
      <div>{`Page ${currentPage} / ${totalPages}`}</div>
      <button onClick={() => onPageChange(currentPage + 1)}>next page</button>
    </div>
  ),
  BackToTop: () => <div>BackToTop</div>,
}));

vi.mock("../../../../components/modules/modules/ModuleCourseFilter", () => ({
  default: ({ onToggleCourse }) => (
    <div>
      <div>CourseFilter</div>
      <button onClick={() => onToggleCourse("CS")}>toggle course</button>
    </div>
  ),
}));

vi.mock("../../../../components/modules/modules/ModuleGrid.jsx", () => ({
  default: ({ modules, onDelete, onEdit, onViewModule }) => (
    <div data-testid="module-grid">
      {modules.map((module) => (
        <div key={module.id}>
          <span>{module.module_code}</span>
          <button onClick={() => onViewModule(module)}>view</button>
          <button onClick={() => onEdit(module)}>edit</button>
          <button onClick={() => onDelete(module)}>delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/modules/hooks/useModuleSorting.js", () => ({
  default: function UseModuleSortingMock(...args) {
    return useModuleSortingMock(...args);
  },
}));

vi.mock("../../../../components/modules/utils/moduleUtils.js", () => ({
  filterModules: (...args) => filterModulesMock(...args),
}));

vi.mock("../../../../pages/modules/components/MyModulesDashboard.jsx", () => ({
  default: () => <div>MyModulesDashboard</div>,
}));

vi.mock("../../../../pages/modules/hooks/modulesPageHooks.js", () => ({
  useMainModuleView: (...args) => useMainModuleViewMock(...args),
}));

import { MainView, ModuleToolbar } from "../../../../pages/modules/components/ModulesPageResults.jsx";

function buildSorting(overrides = {}) {
  return {
    results: [{ id: 1, module_code: "CS101" }],
    pageModules: [{ id: 1, module_code: "CS101" }],
    currentPage: 1,
    totalPages: 3,
    setCurrentPage: vi.fn(),
    sortBy: "name",
    handleNewSort: vi.fn(),
    selectedCourses: [],
    clearFilters: vi.fn(),
    toggleCourse: vi.fn(),
    ...overrides,
  };
}

function buildTestState(overrides = {}) {
  return {
    isTeacher: true,
    hook: { enrollments: [{ module: 1 }], toggleEnrollment: vi.fn(), taskCountsByModule: {} },
    setEditingModule: vi.fn(),
    setShowForm: vi.fn(),
    setViewingModule: vi.fn(),
    setDeletingModule: vi.fn(),
    setDeadlineModule: vi.fn(),
    setReadingModule: vi.fn(),
    ...overrides,
  };
}

describe("Modules main view and toolbar coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModuleSortingMock.mockImplementation((modules) => buildSorting({ results: modules || [], pageModules: modules || [] }));
    filterModulesMock.mockImplementation((modules) => modules || []);
    useMainModuleViewMock.mockReturnValue({
      search: { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() },
      sorting: buildSorting(),
    });
  });

  it("shows the student overview tab content", () => {
    useMainModuleViewMock.mockReturnValueOnce({
      search: { query: "", filter: "enrolled", onQueryChange: vi.fn(), onFilterChange: vi.fn() },
      sorting: buildSorting(),
    });
    const state = buildTestState({
      isTeacher: false,
      hook: {
        modules: [{ id: 1, module_code: "CS101" }],
        enrollments: [{ module: 1 }],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    render(<MainView state={state} />);
    expect(screen.getByText("MyModulesDashboard")).toBeInTheDocument();
    expect(screen.getByText("BackToTop")).toBeInTheDocument();
  });

  it("renders the teacher page title and opens the create module form", () => {
    const state = buildTestState({
      isTeacher: true,
      hook: {
        modules: [{ id: 1, module_code: "CS101" }],
        enrollments: [],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    render(<MainView state={state} />);
    expect(screen.getByText("Modules")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /\+ Create Module/i }));
    expect(state.setEditingModule).toHaveBeenCalledWith(null);
    expect(state.setShowForm).toHaveBeenCalledWith(true);
  });

  it("renders the student browse view title, subtitle, and toolbar placeholder", () => {
    const state = buildTestState({
      isTeacher: false,
      hook: {
        modules: [{ id: 3, module_code: "CS303" }],
        enrollments: [],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    render(<MainView state={state} />);
    expect(screen.getByRole("heading", { name: "Browse Modules" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search King's modules by name or code...")).toBeInTheDocument();
    expect(screen.getByText("My Modules")).toBeInTheDocument();
    expect(screen.getAllByText("Browse Modules").length).toBeGreaterThan(0);
  });

  it("uses the enrolled-modules placeholder and hides the course filter for my-modules views", () => {
    const search = { query: "", onQueryChange: vi.fn() };
    const sorting = buildSorting({ selectedCourses: undefined, toggleCourse: undefined });
    render(<ModuleToolbar search={search} sorting={sorting} isTeacher={false} isMyModules />);
    expect(screen.getByPlaceholderText("Search your modules by name or code...")).toBeInTheDocument();
    expect(screen.queryByText("CourseFilter")).not.toBeInTheDocument();
  });

  it("falls back to a safe no-op course toggle when the sorting hook does not provide one", () => {
    const search = { query: "", onQueryChange: vi.fn() };
    const sorting = buildSorting({ selectedCourses: undefined, toggleCourse: undefined });
    render(<ModuleToolbar search={search} sorting={sorting} isTeacher={false} isMyModules={false} />);
    fireEvent.click(screen.getByRole("button", { name: "toggle course" }));
    expect(screen.getByText("CourseFilter")).toBeInTheDocument();
  });

  it("wraps the student browse view in a page transition outside the test environment", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const state = buildTestState({
      isTeacher: false,
      hook: {
        modules: [{ id: 4, module_code: "CS404" }],
        enrollments: [],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    render(<MainView state={state} />);
    expect(screen.getByTestId("page-transition")).toBeInTheDocument();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("switches the student overview to the enrolments tab", () => {
    const state = buildTestState({
      isTeacher: false,
      hook: {
        modules: [{ id: 2, module_code: "CS202" }],
        enrollments: [{ module: 2 }],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    useMainModuleViewMock.mockReturnValueOnce({
      search: { query: "", filter: "enrolled", onQueryChange: vi.fn(), onFilterChange: vi.fn() },
      sorting: buildSorting(),
    });
    render(<MainView state={state} />);
    fireEvent.click(screen.getByRole("button", { name: /My Enrolments/i }));
    expect(screen.getByPlaceholderText("Search your enrolled modules...")).toBeInTheDocument();
    expect(screen.getByTestId("module-grid")).toBeInTheDocument();
  });
});
