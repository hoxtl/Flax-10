import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchTaskLists = vi.fn();
const getModules = vi.fn();
const getEnrollments = vi.fn();
const isEnrolledIn = vi.fn();

vi.mock("../../api/taskApi", () => ({
  fetchTaskLists: (...args) => fetchTaskLists(...args),
}));

vi.mock("../../api/moduleApi", () => ({
  getModules: (...args) => getModules(...args),
  getEnrollments: (...args) => getEnrollments(...args),
}));

vi.mock("../../components/modules/utils/moduleUtils", () => ({
  isEnrolledIn: (...args) => isEnrolledIn(...args),
}));

import { useDashboardTaskModalOptions } from "../../layout/dashboard_layout/useDashboardTaskModalOptions";

describe("useDashboardTaskModalOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads task lists, modules, and enrolled modules", async () => {
    fetchTaskLists.mockResolvedValue([{ id: 1, name: "Inbox" }]);
    getModules.mockResolvedValue([
      { id: 10, module_code: "CS101" },
      { id: 11, module_code: "MA102" },
    ]);
    getEnrollments.mockResolvedValue([{ module: 10 }]);
    isEnrolledIn.mockImplementation((id, enrollments) => enrollments.some((item) => item.module === id));

    const { result } = renderHook(() => useDashboardTaskModalOptions());

    await waitFor(() => {
      expect(result.current.lists).toEqual([{ id: 1, name: "Inbox" }]);
      expect(result.current.enrolledModules).toEqual([{ id: 10, module_code: "CS101" }]);
    });
  });

  it("falls back to empty arrays for non-array payloads", async () => {
    fetchTaskLists.mockResolvedValue({ results: [] });
    getModules.mockResolvedValue({ results: [] });
    getEnrollments.mockResolvedValue("bad payload");
    isEnrolledIn.mockReturnValue(false);

    const { result } = renderHook(() => useDashboardTaskModalOptions());

    await waitFor(() => {
      expect(result.current.lists).toEqual([]);
      expect(result.current.enrolledModules).toEqual([]);
    });
  });

  it("swallows rejected requests and keeps the default empty collections", async () => {
    fetchTaskLists.mockRejectedValue(new Error("no lists"));
    getModules.mockRejectedValue(new Error("no modules"));
    getEnrollments.mockRejectedValue(new Error("no enrollments"));
    isEnrolledIn.mockReturnValue(false);

    const { result } = renderHook(() => useDashboardTaskModalOptions());

    await waitFor(() => {
      expect(fetchTaskLists).toHaveBeenCalled();
      expect(getModules).toHaveBeenCalled();
      expect(getEnrollments).toHaveBeenCalled();
      expect(result.current.lists).toEqual([]);
      expect(result.current.enrolledModules).toEqual([]);
    });
  });
});
