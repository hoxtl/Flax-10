import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useModulesMock = vi.fn();
const useModuleSortingMock = vi.fn();
const filterModulesMock = vi.fn();
const isEnrolledInMock = vi.fn();
const getDayCountMock = vi.fn();
const addDeadlineAddedMock = vi.fn();
const addReadingAddedMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

vi.mock("../../../components/Modules/hooks/useModules.js", () => ({
  default: function useModules(...args) {
    return useModulesMock(...args);
  },
}));

vi.mock("../../../components/Modules/hooks/useModuleSorting.js", () => ({
  default: function useModuleSorting(...args) {
    return useModuleSortingMock(...args);
  },
}));

vi.mock("../../../components/Modules/utils/moduleUtils.js", () => ({
  filterModules: (...args) => filterModulesMock(...args),
  isEnrolledIn: (...args) => isEnrolledInMock(...args),
}));

vi.mock("../../../components/Pagination/Pagination.jsx", () => ({
  BackToTop: () => <div>BackToTop</div>,
  Pagination: ({ currentPage, totalPages }) => <div>{`Page ${currentPage} of ${totalPages}`}</div>,
}));

vi.mock("../../../components/Modules/Modules/ModuleForm.jsx", () => ({
  default: ({ onSuccess, onCancel, module }) => (
    <div>
      <div>{module ? "Editing module" : "New module"}</div>
      <button onClick={() => onSuccess({ id: 9, module_code: "CS9" }, !module)}>Save module</button>
      <button onClick={onCancel}>Cancel module form</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Modules/ModuleDetails.jsx", () => ({
  default: ({ module, onBack, onEnroll, onUnenroll }) => (
    <div>
      <div>{module.module_code}</div>
      <button onClick={onBack}>Back from details</button>
      <button onClick={onEnroll}>Enroll now</button>
      <button onClick={onUnenroll}>Leave now</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Deadlines/DeadlineModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Deadline ${module.module_code}`}</div>
      <button onClick={onClose}>Close deadline</button>
    </div>
  ),
}));

vi.mock("../../../components/Modules/Readings/ReadingModal.jsx", () => ({
  default: ({ module, onClose }) => (
    <div>
      <div>{`Reading ${module.module_code}`}</div>
      <button onClick={onClose}>Close reading</button>
    </div>
  ),
}));

vi.mock("../../../components/common/PageTransition/PageTransition.jsx", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/LoadingState/SkeletonBlock", () => ({
  default: (props) => <div data-testid="skeleton-block" {...props} />,
}));

vi.mock("../../../components/Modules/shared/taskButtons.jsx", () => ({
  AddDeadlineToTasksButton: ({ deadline, onAdded }) => (
    <button onClick={() => { addDeadlineAddedMock(deadline.id); onAdded(deadline.id); }}>
      Add deadline
    </button>
  ),
  AddReadingToTasksButton: ({ readingId, onAdded }) => (
    <button onClick={() => { addReadingAddedMock(readingId); onAdded(readingId); }}>
      Add reading
    </button>
  ),
}));

vi.mock("../../../components/Modules/Deadlines/upcomingDeadlinesUtils", () => ({
  getDayCount: (...args) => getDayCountMock(...args),
}));

vi.mock("../../../components/Modules/Modules/ModuleGrid.jsx", () => ({
  default: ({ modules }) => <div data-testid="module-grid">{modules.map(m => <div key={m.id}>{m.module_code}</div>)}</div>,
}));

vi.mock("../../../components/Modules/Modules/ModuleCourseFilter", () => ({
  default: () => <div>CourseFilter</div>,
}));

vi.mock("../../../components/common/AppPage/AppPage", () => ({
  default: ({ children, title }) => <div><h1>{title}</h1>{children}</div>,
}));

vi.mock("../../../components/common/Tabs/Tabs", () => ({
  default: ({ tabs, activeTab, onTabChange }) => (
    <div>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}</button>
      ))}
      {tabs.find(t => t.id === activeTab)?.content}
    </div>
  ),
}));

vi.mock("../../../pages/Modules/MyModulesDashboard.jsx", () => ({
  default: () => <div>MyModulesDashboard</div>,
}));

vi.mock("../../../components/Common/HoldConfirmModal/HoldConfirmModal.jsx", () => ({
  default: ({ onConfirm, onCancel, title }) => (
    <div>
      <div>{title}</div>
      <button onClick={onConfirm}>Hold confirm</button>
      <button onClick={onCancel}>Cancel delete</button>
    </div>
  ),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState.jsx", () => ({
  default: ({ query, itemLabel, onClear, title, clearLabel }) => (
    <div>
      <div>{title || `No ${itemLabel} found`}</div>
      {(query || clearLabel) && <button onClick={onClear}>{clearLabel || "Clear"}</button>}
    </div>
  ),
}));

vi.mock("../../../components/common/EmptyState/EmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../components/common/SegmentedControl/SegmentedControl", () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div>
      {options.map(o => <button key={o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  ),
}));

vi.mock("../../../components/common/PageToolbar/PageToolbar", () => ({
  default: ({ searchSlot, controlsSlot }) => <div>{searchSlot}{controlsSlot}</div>,
  ToolbarSortControl: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../components/common/SearchBar/SearchBar.jsx", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  ),
}));

import SmartNudge from "../../../pages/Modules/SmartNudge";
import ReadingsPanel from "../../../pages/Modules/ReadingsPanel";
import {
  AnimatedContent,
  DetailsView,
  FormView,
  getViewKey,
  ModulesPageModals,
  ModulesSkeleton,
  TestModeContent,
} from "../../../pages/Modules/ModulesPageChrome";
import { useMainModuleView, useModulesPageState } from "../../../pages/Modules/modulesPageHooks";
import ModulesPage from "../../../pages/Modules/ModulesPage";
import {
  EmptyResults,
  MainView,
  ModuleToolbar,
  MyEnrollmentsTabContent,
} from "../../../pages/Modules/ModulesPageResults";

function wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function buildState(overrides = {}) {
  return {
    hook: {
      enrollments: [{ module: 1 }],
      handleModuleCreated: vi.fn(),
      handleModuleUpdated: vi.fn(),
      handleEnrollment: vi.fn(),
      handleDisenrol: vi.fn(),
      modules: [{ id: 1, module_code: "CS101", module_name: "Intro" }],
      ...overrides.hook,
    },
    editingModule: null,
    viewingModule: { id: 1, module_code: "CS101", module_name: "Intro" },
    showForm: false,
    isTeacher: false,
    setShowForm: vi.fn(),
    setEditingModule: vi.fn(),
    setViewingModule: vi.fn(),
    setSearchQuery: vi.fn(),
    deadlineModule: null,
    setDeadlineModule: vi.fn(),
    readingModule: null,
    setReadingModule: vi.fn(),
    ...overrides,
  };
}

describe("modules page extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));
    useModulesMock.mockReturnValue({
      loading: false,
      modules: [{ id: 1, module_code: "CS101", module_name: "Intro" }],
      enrollments: [{ module: 1 }],
    });
    filterModulesMock.mockImplementation((modules) => modules);
    isEnrolledInMock.mockReturnValue(true);
    useModuleSortingMock.mockReturnValue({
      results: [{ id: 1, module_code: "CS101", module_name: "Intro" }],
      pageModules: [{ id: 1, module_code: "CS101", module_name: "Intro" }],
      currentPage: 1,
      totalPages: 1,
      setCurrentPage: vi.fn(),
      sortBy: "name",
      handleNewSort: vi.fn(),
      selectedCourses: [],
      clearFilters: vi.fn(),
      toggleCourse: vi.fn(),
    });
  });

  it("covers view keys and skeleton rendering", () => {
    expect(getViewKey(true, null)).toBe("modules-form");
    expect(getViewKey(false, null)).toBe("modules-list");
    expect(getViewKey(false, { id: 7 })).toBe("modules-details-7");

    render(<ModulesSkeleton />);
    expect(screen.getByTestId("modules-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton-block")).toHaveLength(13);
  });

  it("form view handles create, update, and cancel paths", () => {
    const state = buildState({ showForm: true, viewingModule: null });
    const { rerender } = render(<FormView state={state} />);

    fireEvent.click(screen.getByText("Save module"));
    expect(state.hook.handleModuleCreated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });
    expect(state.setShowForm).toHaveBeenCalledWith(false);
    expect(state.setEditingModule).toHaveBeenCalledWith(null);

    const editState = buildState({ showForm: true, viewingModule: null, editingModule: { id: 3 } });
    rerender(<FormView state={editState} />);
    fireEvent.click(screen.getByText("Save module"));
    expect(editState.hook.handleModuleUpdated).toHaveBeenCalledWith({ id: 9, module_code: "CS9" });

    fireEvent.click(screen.getByText("Cancel module form"));
    expect(editState.setShowForm).toHaveBeenCalledWith(false);
  });

  it("details view wires back, enroll, and unenroll handlers", () => {
    const state = buildState();
    render(<DetailsView state={state} />);

    fireEvent.click(screen.getByText("Enroll now"));
    fireEvent.click(screen.getByText("Leave now"));
    fireEvent.click(screen.getByText("Back from details"));

    expect(state.hook.handleEnrollment).toHaveBeenCalledWith(state.viewingModule);
    expect(state.hook.handleDisenrol).toHaveBeenCalledWith(state.viewingModule);
    expect(state.setViewingModule).toHaveBeenCalledWith(null);
    expect(state.setSearchQuery).toHaveBeenCalledWith("");
  });

  it("renders and closes deadline and reading modals only in list mode", () => {
    const state = buildState({
      showForm: false,
      viewingModule: null,
      deadlineModule: { module_code: "CS101" },
      readingModule: { module_code: "CS101" },
    });
    const { rerender } = render(<ModulesPageModals state={state} />);

    fireEvent.click(screen.getByText("Close deadline"));
    fireEvent.click(screen.getByText("Close reading"));
    expect(state.setDeadlineModule).toHaveBeenCalledWith(null);
    expect(state.setReadingModule).toHaveBeenCalledWith(null);

    rerender(<ModulesPageModals state={{ ...state, showForm: true }} />);
    expect(screen.queryByText("Deadline CS101")).not.toBeInTheDocument();
  });

  it("test mode content and animated content switch between list, details, and form", () => {
    const MainView = () => <div>Main content</div>;
    const state = buildState({ viewingModule: null });
    const { rerender } = render(<TestModeContent state={state} MainView={MainView} />);
    expect(screen.getByText("Main content")).toBeInTheDocument();

    rerender(<TestModeContent state={{ ...state, showForm: true }} MainView={MainView} />);
    expect(screen.getByText("New module")).toBeInTheDocument();

    rerender(<TestModeContent state={{ ...state, viewingModule: { id: 1, module_code: "CS101" } }} MainView={MainView} />);
    expect(screen.getByText("Back from details")).toBeInTheDocument();

    rerender(<AnimatedContent state={state} viewKey="modules-list" MainView={MainView} />);
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("hook derives page state, consumes URL params, and responds to show-all event", async () => {
    const routeWrapper = ({ children }) => (
      <MemoryRouter initialEntries={["/modules?code=CS101&filter=enrolled"]}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useModulesPageState("ignored", false), { wrapper: routeWrapper });
    await waitFor(() => expect(result.current.viewingModule?.module_code).toBe("CS101"));
    expect(result.current.filterMode).toBe("enrolled");
    expect(result.current.isTeacher).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("modules:show-all"));
    });

    expect(result.current.searchQuery).toBe("");
    expect(result.current.filterMode).toBe("all");
  });

  it("main module view resets pagination when search or filter changes", () => {
    const setCurrentPage = vi.fn();
    useModuleSortingMock.mockReturnValueOnce({
      results: [],
      pageModules: [],
      currentPage: 2,
      totalPages: 3,
      setCurrentPage,
      sortBy: "name",
      handleNewSort: vi.fn(),
      selectedCourses: [],
      clearFilters: vi.fn(),
      toggleCourse: vi.fn(),
    });

    const state = {
      hook: { modules: [{ id: 1 }], enrollments: [] },
      searchQuery: "abc",
      setSearchQuery: vi.fn(),
      filterMode: "enrolled",
      setFilterMode: vi.fn(),
      isTeacher: false,
    };

    const { result } = renderHook(() => useMainModuleView(state), { wrapper });
    act(() => result.current.search.onQueryChange("next"));
    act(() => result.current.search.onFilterChange("all"));

    expect(filterModulesMock).toHaveBeenCalled();
    expect(state.setSearchQuery).toHaveBeenCalledWith("next");
    expect(state.setFilterMode).toHaveBeenCalledWith("all");
    expect(setCurrentPage).toHaveBeenCalledTimes(2);
  });

  it("ModulesPage renders skeleton while loading", () => {
    useModulesMock.mockReturnValue({ loading: true, modules: [], enrollments: [] });
    render(<MemoryRouter><ModulesPage /></MemoryRouter>);
    expect(screen.getByTestId("modules-skeleton")).toBeInTheDocument();
  });

  it("ModulesPage renders test-mode content (not skeleton) when loaded", () => {
    useModulesMock.mockReturnValue({ loading: false, modules: [], enrollments: [] });
    filterModulesMock.mockReturnValue([]);
    render(<MemoryRouter><ModulesPage /></MemoryRouter>);
    // In test env, should not show skeleton
    expect(screen.queryByTestId("modules-skeleton")).not.toBeInTheDocument();
  });

  it("EmptyResults: search query shows SearchResultEmpty", () => {
    const search = { query: "test", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: [], clearFilters: vi.fn() };
    render(<EmptyResults search={search} sorting={sorting} isTeacher={false} />);
    expect(screen.getByText(/No your modules found|No modules found/)).toBeInTheDocument();
  });

  it("EmptyResults: active filter shows FilterResultEmpty", () => {
    const search = { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: ["CS"], clearFilters: vi.fn() };
    render(<EmptyResults search={search} sorting={sorting} isTeacher={false} />);
    expect(screen.getByText("No modules matched your filters")).toBeInTheDocument();
  });

  it("EmptyResults: teacher empty state", () => {
    const search = { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: [], clearFilters: vi.fn() };
    render(<EmptyResults search={search} sorting={sorting} isTeacher={true} />);
    expect(screen.getByText("No modules yet")).toBeInTheDocument();
  });

  it("EmptyResults: student enrolled empty state", () => {
    const search = { query: "", filter: "enrolled", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: [], clearFilters: vi.fn() };
    render(<EmptyResults search={search} sorting={sorting} isTeacher={false} />);
    expect(screen.getByText("You're not enrolled in any modules yet")).toBeInTheDocument();
  });

  it("EmptyResults: fallback state when no modules and no conditions", () => {
    const search = { query: "", filter: "all", onQueryChange: vi.fn(), onFilterChange: vi.fn() };
    const sorting = { selectedCourses: [], clearFilters: vi.fn() };
    render(<EmptyResults search={search} sorting={sorting} isTeacher={false} />);
    expect(screen.getByText("No modules found")).toBeInTheDocument();
  });

  it("ModuleToolbar renders with course filter for student browse view", () => {
    const search = { query: "", onQueryChange: vi.fn() };
    const sorting = { sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], toggleCourse: vi.fn() };
    render(<ModuleToolbar search={search} sorting={sorting} isTeacher={false} isMyModules={false} />);
    expect(screen.getByText("CourseFilter")).toBeInTheDocument();
  });

  it("ModuleToolbar hides course filter for teacher", () => {
    const search = { query: "", onQueryChange: vi.fn() };
    const sorting = { sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], toggleCourse: vi.fn() };
    render(<ModuleToolbar search={search} sorting={sorting} isTeacher={true} isMyModules={false} />);
    expect(screen.queryByText("CourseFilter")).not.toBeInTheDocument();
  });

  it("MyEnrollmentsTabContent shows empty state when no enrolled modules", () => {
    filterModulesMock.mockReturnValue([]);
    useModuleSortingMock.mockReturnValue({ results: [], pageModules: [], currentPage: 1, totalPages: 1, setCurrentPage: vi.fn(), sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], clearFilters: vi.fn(), toggleCourse: vi.fn() });
    const state = buildState({ hook: { modules: [], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {} } });
    render(<MyEnrollmentsTabContent state={state} />);
    expect(screen.getByText(/No your modules found|No modules found/)).toBeInTheDocument();
  });

  it("MyEnrollmentsTabContent renders grid when enrolled modules exist", () => {
    filterModulesMock.mockReturnValue([{ id: 1, module_code: "CS101" }]);
    useModuleSortingMock.mockReturnValue({
      results: [{ id: 1, module_code: "CS101" }],
      pageModules: [{ id: 1, module_code: "CS101" }],
      currentPage: 1, totalPages: 1, setCurrentPage: vi.fn(),
      sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], clearFilters: vi.fn(), toggleCourse: vi.fn(),
    });
    const state = buildState({ hook: { modules: [{ id: 1, module_code: "CS101" }], enrollments: [{ module: 1 }], toggleEnrollment: vi.fn(), taskCountsByModule: {} } });
    render(<MyEnrollmentsTabContent state={state} />);
    expect(screen.getByTestId("module-grid")).toBeInTheDocument();
  });

  it("MainView renders browse modules toolbar for teacher", () => {
    filterModulesMock.mockReturnValue([{ id: 1, module_code: "CS101" }]);
    useModuleSortingMock.mockReturnValue({
      results: [{ id: 1, module_code: "CS101" }],
      pageModules: [{ id: 1, module_code: "CS101" }],
      currentPage: 1, totalPages: 1, setCurrentPage: vi.fn(),
      sortBy: "name", handleNewSort: vi.fn(), selectedCourses: [], clearFilters: vi.fn(), toggleCourse: vi.fn(),
    });
    const state = buildState({ filterMode: "all", isTeacher: true, hook: { modules: [{ id: 1, module_code: "CS101" }], enrollments: [], toggleEnrollment: vi.fn(), taskCountsByModule: {}, handleModuleCreated: vi.fn(), handleModuleUpdated: vi.fn(), handleEnrollment: vi.fn(), handleDisenrol: vi.fn() } });
    render(<MemoryRouter><MainView state={state} /></MemoryRouter>);
    expect(screen.getByTestId("module-grid")).toBeInTheDocument();
  });

  it("smart nudge prioritizes imminent deadlines and readings and dismisses them after add", () => {
    getDayCountMock.mockImplementation((date) => {
      if (date === "today") return 0;
      if (date === "tomorrow") return 1;
      if (date === "later") return 4;
      return 10;
    });

    const onReadingAdded = vi.fn();
    const { rerender } = render(
      <SmartNudge
        deadlines={[{ id: 1, assessment_title: "Essay", module_code: "CS101", start_due_date: "today" }]}
        readings={[{ id: 2, title: "Chapter", module_code: "MA102", deadline: "tomorrow" }]}
        onReadingAdded={onReadingAdded}
      />
    );

    expect(screen.getByText(/Essay/)).toBeInTheDocument();
    expect(screen.getByText(/due today/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add deadline"));
    expect(addDeadlineAddedMock).toHaveBeenCalledWith(1);

    rerender(
      <SmartNudge
        deadlines={[{ id: 1, assessment_title: "Essay", module_code: "CS101", start_due_date: "today" }]}
        readings={[{ id: 2, title: "Chapter", module_code: "MA102", deadline: "tomorrow" }]}
        onReadingAdded={onReadingAdded}
      />
    );

    expect(screen.getByText(/Chapter/)).toBeInTheDocument();
    expect(screen.getByText(/due tomorrow/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add reading"));
    expect(addReadingAddedMock).toHaveBeenCalledWith(2);
    expect(onReadingAdded).toHaveBeenCalledWith(2);
  });
});
