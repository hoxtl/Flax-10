/*
 * Shared setup for modules page results and main view tests.
 */

import { vi } from "vitest";

const hoistedMocks = vi.hoisted(() => ({
  useModuleSortingMock: vi.fn(),
  filterModulesMock: vi.fn(),
  useMainModuleViewMock: vi.fn(),
}));

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
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
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
  default: (...args) => hoistedMocks.useModuleSortingMock(...args),
}));

vi.mock("../../../../components/modules/utils/moduleUtils.js", () => ({
  filterModules: (...args) => hoistedMocks.filterModulesMock(...args),
}));

vi.mock("../../../../pages/modules/components/MyModulesDashboard.jsx", () => ({
  default: () => <div>MyModulesDashboard</div>,
}));

vi.mock("../../../../pages/modules/hooks/modulesPageHooks.js", () => ({
  useMainModuleView: (...args) => hoistedMocks.useMainModuleViewMock(...args),
}));

function buildHookState(overrides = {}) {
  return {
    modules: [],
    enrollments: [{ module: 1 }],
    toggleEnrollment: vi.fn(),
    taskCountsByModule: {},
    ...overrides,
  };
}

function setDefaultSearchAndSortingMocks() {
  hoistedMocks.useModuleSortingMock.mockImplementation((modules) => buildSorting({ results: modules || [], pageModules: modules || [] }));
  hoistedMocks.filterModulesMock.mockImplementation((modules) => modules || []);
  hoistedMocks.useMainModuleViewMock.mockReturnValue({ search: buildSearchState(), sorting: buildSorting() });
}

/*
 * Returns the hoisted mock functions shared by modules page tests.
 */
export function getModulesPageResultsMocks() {
  return hoistedMocks;
}

/*
 * Builds modules page search state for result and main view tests.
 */
export function buildSearchState(overrides = {}) {
  return {
    query: "",
    filter: "all",
    onQueryChange: vi.fn(),
    onFilterChange: vi.fn(),
    ...overrides,
  };
}

/*
 * Builds sorting state used by the modules page result views.
 */
export function buildSorting(overrides = {}) {
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

/*
 * Builds the modules page state wrapper with mocked handlers.
 */
export function buildTestState(overrides = {}) {
  return {
    isTeacher: true,
    hook: buildHookState(),
    setEditingModule: vi.fn(),
    setShowForm: vi.fn(),
    setViewingModule: vi.fn(),
    setDeletingModule: vi.fn(),
    setDeadlineModule: vi.fn(),
    setReadingModule: vi.fn(),
    ...overrides,
  };
}

/*
 * Restores the shared modules page mocks to their default state.
 */
export function resetModulesPageResultsMocks() {
  vi.clearAllMocks();
  setDefaultSearchAndSortingMocks();
}
