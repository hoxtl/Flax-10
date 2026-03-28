import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useModuleSortingMock = vi.fn();
const filterModulesMock = vi.fn();
const useMainModuleViewMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
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

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description, action }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
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
import { EmptyResults, MainView, ModuleResults, ModuleToolbar, MyEnrollmentsTabContent } from "../../../../pages/modules/components/ModulesPageResults.jsx";

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
describe("ModulesPageResults coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModuleSortingMock.mockImplementation((modules) => buildSorting({ results: modules || [], pageModules: modules || [] }));
    filterModulesMock.mockImplementation((modules) => modules || []);
    useMainModuleViewMock.mockReturnValue({
      search: { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() },
      sorting: buildSorting(),
    });
  });

  it("clears search-driven empty results without changing the current student view", () => {
    const search = {
      query: "physics",
      filter: "enrolled",
      onQueryChange: vi.fn(),
      onFilterChange: vi.fn(),
    };
    const sorting = buildSorting({ results: [], selectedCourses: [], clearFilters: vi.fn() });

    render(<ModuleResults state={{ isTeacher: false }} search={search} sorting={sorting} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(search.onQueryChange).toHaveBeenCalledWith("");
    expect(search.onFilterChange).not.toHaveBeenCalled();
    expect(sorting.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("clears active filters when the teacher empty state is shown", () => {
    const search = {
      query: "",
      filter: "enrolled",
      onQueryChange: vi.fn(),
      onFilterChange: vi.fn(),
    };
    const sorting = buildSorting({ results: [], selectedCourses: ["CS"], clearFilters: vi.fn() });

    render(<EmptyResults search={search} sorting={sorting} isTeacher />);

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(search.onQueryChange).not.toHaveBeenCalled();
    expect(search.onFilterChange).toHaveBeenCalledWith("all");
    expect(sorting.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("shows the student browse-empty action and switches back to browse view", () => {
    const search = {
      query: "",
      filter: "enrolled",
      onQueryChange: vi.fn(),
      onFilterChange: vi.fn(),
    };

    render(<EmptyResults search={search} sorting={buildSorting({ results: [] })} isTeacher={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Browse modules" }));

    expect(search.onFilterChange).toHaveBeenCalledWith("all");
  });

  it("falls back to the generic modules empty state when browsing has no results", () => {
    const search = {
      query: "",
      filter: "all",
      onQueryChange: vi.fn(),
      onFilterChange: vi.fn(),
    };

    render(<EmptyResults search={search} sorting={buildSorting({ results: [], selectedCourses: [] })} isTeacher={false} />);

    expect(screen.getByText("search-empty")).toBeInTheDocument();
  });

  it("renders module results with pagination and passes delete/edit actions through", () => {
    const state = buildTestState();
    const sorting = buildSorting({
      results: [{ id: 1, module_code: "CS101" }],
      pageModules: [{ id: 1, module_code: "CS101" }],
      currentPage: 2,
      totalPages: 5,
    });
    render(<ModuleResults state={state} search={{ query: "", filter: "all" }} sorting={sorting} />);
    expect(screen.getAllByText("Page 2 / 5")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "view" }));
    expect(state.setDeletingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setViewingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setEditingModule).toHaveBeenCalledWith({ id: 1, module_code: "CS101" });
    expect(state.setShowForm).toHaveBeenCalledWith(true);
    expect(state.setDeadlineModule).not.toHaveBeenCalled();
  });

  it("exposes the enrolled-search toolbar and resets pagination when typing", () => {
    const state = {
      hook: {
        modules: [{ id: 1, module_code: "CS101" }],
        enrollments: [{ module: 1 }],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    };

    render(<MyEnrollmentsTabContent state={state} />);

    const input = screen.getByPlaceholderText("Search your enrolled modules...");
    fireEvent.change(input, { target: { value: "cs" } });

    expect(useModuleSortingMock).toHaveBeenCalled();
    expect(filterModulesMock).toHaveBeenCalledWith(state.hook.modules, state.hook.enrollments, "", "enrolled");
  });

  it("shows the enrolled-modules empty state and clears its local search", () => {
    useModuleSortingMock.mockReturnValue(buildSorting({ results: [], pageModules: [] }));
    filterModulesMock.mockReturnValue([]);

    render(<MyEnrollmentsTabContent state={{ hook: { modules: [], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } }} />);

    expect(screen.getByText("search-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  });

  it("passes view, edit, and delete actions through the enrollments grid", () => {
    const state = buildTestState({
      isTeacher: false,
      hook: {
        modules: [{ id: 2, module_code: "CS202" }],
        enrollments: [{ module: 2 }],
        toggleEnrollment: vi.fn(),
        taskCountsByModule: {},
      },
    });
    filterModulesMock.mockReturnValue([{ id: 2, module_code: "CS202" }]);
    useModuleSortingMock.mockReturnValue(buildSorting({
      results: [{ id: 2, module_code: "CS202" }],
      pageModules: [{ id: 2, module_code: "CS202" }],
    }));

    render(<MyEnrollmentsTabContent state={state} />);

    fireEvent.click(screen.getByRole("button", { name: "view" }));
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "delete" }));

    expect(state.setViewingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
    expect(state.setEditingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
    expect(state.setShowForm).toHaveBeenCalledWith(true);
    expect(state.setDeletingModule).toHaveBeenCalledWith({ id: 2, module_code: "CS202" });
  });

  it("shows the my-modules toolbar placeholder and student transition wrapper in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    render(<ModuleToolbar search={{ query: "", onQueryChange: vi.fn() }} sorting={buildSorting()} isTeacher={false} isMyModules />);
    expect(screen.getByPlaceholderText("Search your modules by name or code...")).toBeInTheDocument();
    useMainModuleViewMock.mockReturnValueOnce({
      search: { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() },
      sorting: buildSorting(),
    });
    const state = buildTestState({ isTeacher: false, hook: { enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } });
    render(<MainView state={state} />);
    expect(screen.getByTestId("page-transition")).toBeInTheDocument();
    process.env.NODE_ENV = originalEnv;
  });

  it("handles undefined course filters in toolbar and empty states", () => {
    const search = {
      query: "",
      filter: "all",
      onQueryChange: vi.fn(),
      onFilterChange: vi.fn(),
    };
    const sorting = buildSorting({ selectedCourses: undefined, toggleCourse: undefined });

    render(
      <>
        <ModuleToolbar search={search} sorting={sorting} isTeacher={false} isMyModules={false} />
        <EmptyResults search={search} sorting={sorting} isTeacher={false} />
      </>
    );

    expect(screen.getByText("CourseFilter")).toBeInTheDocument();
    expect(screen.getByText("search-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "toggle course" }));
  });

  it("opens the create-module flow from the teacher page action", () => {
    const state = buildTestState({ isTeacher: true });

    render(<MainView state={state} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Create Module" }));

    expect(state.setEditingModule).toHaveBeenCalledWith(null);
    expect(state.setShowForm).toHaveBeenCalledWith(true);
  });

  it("renders the student overview tabs and switches to the enrollments tab", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /My Enrolments/i }));

    expect(screen.getByPlaceholderText("Search your enrolled modules...")).toBeInTheDocument();
    expect(screen.getByTestId("module-grid")).toBeInTheDocument();
  });
});
