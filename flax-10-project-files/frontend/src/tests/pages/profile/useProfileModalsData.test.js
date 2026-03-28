import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("../../../api/socialApi", () => ({ getSharingWith: vi.fn(), getSharedWithMe: vi.fn() }));
vi.mock("../../../api/taskApi", () => ({ fetchTasks: vi.fn() }));
vi.mock("../../../api/moduleApi", () => ({ getModules: vi.fn() }));
import { useModuleNameMap, useSocialUsers, useTasksModalData, socialDataFetchers } from "../../../pages/profile/hooks/useProfileModalsData";
import { getSharingWith, getSharedWithMe } from "../../../api/socialApi";
import { fetchTasks } from "../../../api/taskApi";
import { getModules } from "../../../api/moduleApi";

describe("useProfileModalsData", () => {
  const gSW = getSharingWith, fT = fetchTasks;
  beforeEach(() => {
    vi.clearAllMocks();
    getSharingWith.mockResolvedValue([]);
    getSharedWithMe.mockResolvedValue([]);
    fetchTasks.mockResolvedValue([]);
    getModules.mockResolvedValue([]);
  });
  it("fetches social users per user and handles errors", async () => {
    gSW.mockRejectedValueOnce(new Error("err"));
    const { result } = renderHook(() => useSocialUsers(true, 99, socialDataFetchers.sharingWith));
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it("useTasksModalData fetches and clears", async () => {
    fT.mockResolvedValueOnce({ results: [{ id: 1 }] });
    const { result, rerender } = renderHook(({ isOpen }) => useTasksModalData(isOpen), { initialProps: { isOpen: true } });
    await waitFor(() => expect(result.current.tasks.length).toBe(1));
    rerender({ isOpen: false });
    expect(result.current.tasks).toEqual([]);
  });

  it("useTasksModalData handles empty results", async () => {
    fT.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTasksModalData(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("useTasksModalData clears tasks when the fetch rejects", async () => {
    fT.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useTasksModalData(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("builds a module name map when open and ignores invalid entries", async () => {
    getModules.mockResolvedValueOnce({
      results: [
        { module_code: "CS101", module_name: "Intro to CS" },
        { module_code: "", module_name: "Skip me" },
      ],
    });
    const { result } = renderHook(() => useModuleNameMap(true));
    await waitFor(() => expect(result.current).toEqual({ CS101: "Intro to CS" }));
  });

  it("builds a module name map from direct array payloads and ignores empty payloads", async () => {
    getModules
      .mockResolvedValueOnce([{ module_code: "CS102", module_name: "Data Structures" }])
      .mockResolvedValueOnce(undefined);

    const first = renderHook(() => useModuleNameMap(true));
    await waitFor(() => expect(first.result.current).toEqual({ CS102: "Data Structures" }));

    const second = renderHook(() => useModuleNameMap(true));
    await waitFor(() => expect(second.result.current).toEqual({}));
  });

  it("keeps the module name map empty when closed or when loading fails", async () => {
    getModules.mockRejectedValueOnce(new Error("boom"));
    const { result, rerender } = renderHook(({ isOpen }) => useModuleNameMap(isOpen), { initialProps: { isOpen: false } });
    expect(result.current).toEqual({});
    rerender({ isOpen: true });
    await waitFor(() => expect(result.current).toEqual({}));
  });

  it("sorts open tasks by due date and filters out completed ones", async () => {
    fetchTasks.mockResolvedValueOnce({
      results: [
        { id: 2, title: "Later", due_date: "2026-03-30T10:00:00Z", completed: false },
        { id: 1, title: "Soon", due_date: "2026-03-28T10:00:00Z", completed: false },
        { id: 3, title: "Done", due_date: "2026-03-27T10:00:00Z", completed: true },
        { id: 4, title: "No due", due_date: null, completed: false },
      ],
    });
    const { result } = renderHook(() => useTasksModalData(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks.map((task) => task.id)).toEqual([1, 2, 4]);
  });

  it("sorts direct array task payloads with dated tasks ahead of undated tasks", async () => {
    fetchTasks.mockResolvedValueOnce([
      { id: 2, title: "No due", due_date: null, completed: false },
      { id: 1, title: "Has due", due_date: "2026-03-28T10:00:00Z", completed: false },
    ]);

    const { result } = renderHook(() => useTasksModalData(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks.map((task) => task.id)).toEqual([1, 2]);
  });

  it("uses result payloads for social users and resets when closed", async () => {
    getSharedWithMe.mockResolvedValueOnce({ results: [{ id: 2, username: "sam" }] });
    const { result, rerender } = renderHook(({ isOpen, userId }) => useSocialUsers(isOpen, userId, socialDataFetchers.sharedWithMe), {
      initialProps: { isOpen: true, userId: 42 },
    });
    await waitFor(() => expect(result.current).toEqual([{ id: 2, username: "sam" }]));
    rerender({ isOpen: false, userId: 42 });
    expect(result.current).toEqual([]);
  });

  it("uses direct array payloads for social users", async () => {
    getSharingWith.mockResolvedValueOnce([{ id: 3, username: "lee" }]);

    const { result } = renderHook(() => useSocialUsers(true, 12, socialDataFetchers.sharingWith));

    await waitFor(() => expect(result.current).toEqual([{ id: 3, username: "lee" }]));
  });

  it("exports the social data fetchers", () => {
    expect(socialDataFetchers.sharedWithMe).toBe(getSharedWithMe);
    expect(socialDataFetchers.sharingWith).toBe(getSharingWith);
  });
});
