import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const applyFiltersAndSort = vi.fn();
const addNotification = vi.fn();
const disenrolByModuleId = vi.fn();

vi.mock("../../../components/modules/utils/moduleUtils.js", () => ({
  applyFiltersAndSort: (...args) => applyFiltersAndSort(...args),
}));

vi.mock("../../../context/NotificationContext", () => ({
  useNotifications: () => ({ addNotification }),
}));

vi.mock("../../../api/moduleApi", () => ({
  disenrolByModuleId: (...args) => disenrolByModuleId(...args),
}));

import useModuleSorting from "../../../components/modules/hooks/useModuleSorting";
import { useModuleDisenrollment } from "../../../components/modules/hooks/useModuleDisenrollment";

describe("module hook extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("covers module sorting pagination, toggles, sort changes, and filter clearing", async () => {
    const modules = Array.from({ length: 20 }, (_, index) => ({ id: index + 1, module_code: `CS${index + 1}` }));
    applyFiltersAndSort.mockImplementation((items, selectedCourses, sortBy) =>
      items.map((item) => ({ ...item, selectedCourses, sortBy })),
    );

    const { result } = renderHook(() => useModuleSorting(modules));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.sortBy).toBe("name");
    expect(result.current.totalPages).toBe(2);
    expect(result.current.pageModules).toHaveLength(15);

    result.current.toggleCourse("Computer Science");
    await waitFor(() => {
      expect(result.current.selectedCourses).toEqual(["Computer Science"]);
      expect(result.current.currentPage).toBe(1);
    });

    result.current.setCurrentPage(2);
    await waitFor(() => {
      expect(result.current.pageModules).toHaveLength(5);
    });

    result.current.toggleCourse("Computer Science");
    result.current.handleNewSort("recent");
    await waitFor(() => {
      expect(result.current.selectedCourses).toEqual([]);
      expect(result.current.sortBy).toBe("recent");
      expect(result.current.currentPage).toBe(1);
    });

    result.current.toggleCourse("Maths");
    result.current.clearFilters();
    await waitFor(() => {
      expect(result.current.selectedCourses).toEqual([]);
      expect(result.current.currentPage).toBe(1);
    });
  });

  it("covers module disenrollment success and error notifications", async () => {
    const { result } = renderHook(() => useModuleDisenrollment());
    const onSuccess = vi.fn();

    disenrolByModuleId.mockResolvedValueOnce(undefined);
    await result.current.disenrollFromModule(7, onSuccess);
    expect(disenrolByModuleId).toHaveBeenCalledWith(7);
    expect(addNotification).toHaveBeenCalledWith({
      title: "✓ Done",
      message: "Successfully left the module!",
    });
    expect(onSuccess).toHaveBeenCalled();

    disenrolByModuleId.mockResolvedValueOnce(undefined);
    await result.current.disenrollFromModule(9);

    disenrolByModuleId.mockRejectedValueOnce(new Error("Cannot leave"));
    await result.current.disenrollFromModule(8);
    expect(addNotification).toHaveBeenCalledWith({
      title: "⚠️ Action failed",
      message: "Cannot leave",
    });
  });
});
