import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
vi.mock("../../../api/socialApi", () => ({ getSharingWith: vi.fn(), getSharedWithMe: vi.fn() }));
vi.mock("../../../api/taskApi", () => ({ fetchTasks: vi.fn() }));
vi.mock("../../../api/moduleApi", () => ({ getModules: vi.fn() }));
import { useSocialUsers, useTasksModalData, socialDataFetchers } from "../../../pages/profile/hooks/useProfileModalsData";
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
});
