import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../../api/taskService", () => ({
  fetchTaskLists: vi.fn(),
  fetchArchivedTaskLists: vi.fn(),
}));

import useTaskListsLoad from "../../../../pages/Tasks/hooks/useTaskListsLoad";
import { fetchTaskLists, fetchArchivedTaskLists } from "../../../../api/taskService";

describe("useTaskListsLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads active and archived lists", async () => {
    fetchTaskLists.mockResolvedValueOnce([{ id: 1, name: "List" }]);
    fetchArchivedTaskLists.mockResolvedValueOnce([{ id: 2, name: "Old" }]);
    const { result } = renderHook(() => useTaskListsLoad());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists[0].name).toBe("List");
    expect(result.current.archivedLists[0].name).toBe("Old");
  });

  it("handles load failures", async () => {
    fetchTaskLists.mockRejectedValueOnce(new Error("x"));
    fetchArchivedTaskLists.mockRejectedValueOnce(new Error("y"));
    const { result } = renderHook(() => useTaskListsLoad());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists).toEqual([]);
    expect(result.current.archivedLists).toEqual([]);
  });
});
