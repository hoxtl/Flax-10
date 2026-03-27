/**
 * Covers state syncing and reset paths for module page hooks.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useModulesMock = vi.fn();
const useModuleSortingMock = vi.fn();
const filterModulesMock = vi.fn();

vi.mock("../../../components/Modules/hooks/useModules.js", () => ({
  default: function UseModulesMock(...args) {
    return useModulesMock(...args);
  },
}));

vi.mock("../../../components/Modules/hooks/useModuleSorting.js", () => ({
  default: function UseModuleSortingMock(...args) {
    return useModuleSortingMock(...args);
  },
}));

vi.mock("../../../components/Modules/utils/moduleUtils.js", () => ({
  filterModules: (...args) => filterModulesMock(...args),
}));

import { useMainModuleView, useModulesPageState } from "../../../pages/Modules/modulesPageHooks.js";

function wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function routerWrapper(initialEntry) {
  return ({ children }) => <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
}

function seedModulePageState(result) {
  act(() => {
    result.current.setShowForm(true);
    result.current.setEditingModule({ id: 2 });
    result.current.setViewingModule({ id: 1 });
    result.current.setDeadlineModule({ id: 1 });
    result.current.setReadingModule({ id: 1 });
    result.current.setSearchQuery("AA200");
    result.current.setFilterMode("enrolled");
  });
}

function expectResetModuleState(state) {
  expect(state.showForm).toBeNull();
  expect(state.editingModule).toBeNull();
  expect(state.viewingModule).toBeNull();
  expect(state.deadlineModule).toBeNull();
  expect(state.readingModule).toBeNull();
  expect(state.searchQuery).toBe("");
  expect(state.filterMode).toBe("all");
}

const dispatchShowAll = () => window.dispatchEvent(new Event("modules:show-all"));

describe("modulesPageHooks coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useModulesMock.mockReturnValue({
      loading: false,
      modules: [
        { id: 1, module_code: "CS101" },
        { id: 2, module_code: "AA200" },
      ],
      enrollments: [{ module: 1 }],
    });
    useModuleSortingMock.mockImplementation((filtered) => ({
      results: filtered,
      pageModules: filtered,
      currentPage: 3,
      totalPages: 4,
      setCurrentPage: vi.fn(),
      sortBy: "name",
      handleNewSort: vi.fn(),
      selectedCourses: [],
      clearFilters: vi.fn(),
      toggleCourse: vi.fn(),
    }));
    filterModulesMock.mockImplementation((modules) => modules || []);
  });

  it("defaults the filter by role and respects initialCreate", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));

    const teacherHook = renderHook(() => useModulesPageState(), {
      wrapper: routerWrapper("/modules?filter=all"),
    });

    await waitFor(() => expect(teacherHook.result.current.isTeacher).toBe(true));
    expect(teacherHook.result.current.filterMode).toBe("all");
    expect(teacherHook.result.current.showForm).toBe(false);

    localStorage.setItem("user", JSON.stringify({ role: "student" }));
    const studentHook = renderHook(() => useModulesPageState("", true), {
      wrapper: routerWrapper("/modules"),
    });

    await waitFor(() => expect(studentHook.result.current.isTeacher).toBe(false));
    expect(studentHook.result.current.filterMode).toBe("enrolled");
    expect(studentHook.result.current.showForm).toBe(true);
  });

  it("treats missing user storage as a student role", async () => {
    const hook = renderHook(() => useModulesPageState(), {
      wrapper: routerWrapper("/modules"),
    });

    await waitFor(() => expect(hook.result.current.isTeacher).toBe(false));
    expect(hook.result.current.filterMode).toBe("enrolled");
  });

  it("syncs moduleId and code query params into the viewing state", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));

    const moduleIdHook = renderHook(() => useModulesPageState(), {
      wrapper: routerWrapper("/modules?moduleId=2"),
    });

    await waitFor(() => expect(moduleIdHook.result.current.viewingModule?.id).toBe(2));

    const codeHook = renderHook(() => useModulesPageState("unused"), {
      wrapper: routerWrapper("/modules?code=aa 200"),
    });

    await waitFor(() => expect(codeHook.result.current.viewingModule?.module_code).toBe("AA200"));
  });

  it("falls back from an unmatched moduleId to the code search param", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));
    useModulesMock.mockReturnValue({
      loading: false,
      modules: [
        { id: 1, module_code: undefined },
        { id: 2, module_code: "AA200" },
      ],
      enrollments: [{ module: 1 }],
    });

    const hook = renderHook(() => useModulesPageState(), {
      wrapper: routerWrapper("/modules?moduleId=999&code=aa200"),
    });

    await waitFor(() => expect(hook.result.current.viewingModule?.module_code).toBe("AA200"));
  });

  it("leaves the current view unchanged when only an unknown moduleId is provided", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));

    const hook = renderHook(() => useModulesPageState(), {
      wrapper: routerWrapper("/modules?moduleId=999"),
    });

    await waitFor(() => expect(hook.result.current.filterMode).toBe("all"));
    expect(hook.result.current.viewingModule).toBeNull();
    expect(hook.result.current.searchQuery).toBe("");
  });

  it("uses the URL code as search text when unmatched while preserving an initial module match", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "student" }));

    const hook = renderHook(() => useModulesPageState("cs101"), {
      wrapper: routerWrapper("/modules?code=missing"),
    });

    await waitFor(() => expect(hook.result.current.searchQuery).toBe("missing"));
    expect(hook.result.current.viewingModule).toEqual({ id: 1, module_code: "CS101" });
  });

  it("filters out enrolled modules for student browse mode and resets pagination on search changes", () => {
    localStorage.setItem("user", JSON.stringify({ role: "student" }));
    const hook = { modules: [{ id: 1 }, { id: 2 }], enrollments: [{ module: 1 }] };
    const state = {
      hook, searchQuery: "", setSearchQuery: vi.fn(),
      filterMode: "all", setFilterMode: vi.fn(), isTeacher: false,
    };
    const { result } = renderHook(() => useMainModuleView(state), { wrapper });
    expect(filterModulesMock).toHaveBeenCalledWith(hook.modules, hook.enrollments, "", "all", { excludeEnrolled: true });
    result.current.search.onQueryChange("AA");
    result.current.search.onFilterChange("enrolled");
    expect(state.setSearchQuery).toHaveBeenCalledWith("AA");
    expect(state.setFilterMode).toHaveBeenCalledWith("enrolled");
    expect(useModuleSortingMock).toHaveBeenCalledWith(hook.modules);
  });

  const setupTestState = (current) => act(() => {
    current.setShowForm(true);
    current.setEditingModule({ id: 2 });
    current.setViewingModule({ id: 1 });
    current.setDeadlineModule({ id: 1 });
    current.setReadingModule({ id: 1 });
    current.setSearchQuery("AA200");
    current.setFilterMode("enrolled");
  });

  const verifyResetState = (current) => {
    expect(current.showForm).toBeNull();
    expect(current.editingModule).toBeNull();
    expect(current.viewingModule).toBeNull();
    expect(current.deadlineModule).toBeNull();
    expect(current.readingModule).toBeNull();
    expect(current.searchQuery).toBe("");
    expect(current.filterMode).toBe("all");
  };

  it("resets module page state when the show-all event fires", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "teacher" }));
    const { result } = renderHook(() => useModulesPageState("", false), {
      wrapper: routerWrapper("/modules?filter=enrolled"),
    });
    await waitFor(() => expect(result.current.filterMode).toBe("enrolled"));
    seedModulePageState(result);
    act(dispatchShowAll);
    await waitFor(() => expectResetModuleState(result.current));
  });
});
