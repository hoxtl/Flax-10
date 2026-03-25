import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const {
  fetchTasks,
  getAnotherUserProfile,
  getUserProfile,
  getEvents,
  analyticsService,
  fetchApi,
  getModules,
  getSharedWithMe,
  getSharingWith,
  refreshProfile,
} = vi.hoisted(() => ({
  fetchTasks: vi.fn(),
  getAnotherUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  getEvents: vi.fn(),
  analyticsService: { getSummary: vi.fn() },
  fetchApi: vi.fn(),
  getModules: vi.fn(),
  getSharedWithMe: vi.fn(),
  getSharingWith: vi.fn(),
  refreshProfile: vi.fn(),
}));

vi.mock("../../../api/taskApi", () => ({ fetchTasks: (...args) => fetchTasks(...args) }));
vi.mock("../../../api/userApi", () => ({
  getAnotherUserProfile: (...args) => getAnotherUserProfile(...args),
  getUserProfile: (...args) => getUserProfile(...args),
}));
vi.mock("../../../api/eventApi", () => ({ getEvents: (...args) => getEvents(...args) }));
vi.mock("../../../api/analyticsApi", () => ({ default: analyticsService }));
vi.mock("../../../api/client", () => ({ fetchApi: (...args) => fetchApi(...args) }));
vi.mock("../../../api/moduleApi", () => ({ getModules: (...args) => getModules(...args) }));
vi.mock("../../../api/socialApi", () => ({
  getSharedWithMe: (...args) => getSharedWithMe(...args),
  getSharingWith: (...args) => getSharingWith(...args),
}));
vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    profile: { id: 5, name: "Me" },
    loading: false,
    refreshProfile,
  }),
}));

import {
  loadProfile,
  loadTaskCount,
  tryLoadEvents,
  tryLoadProfile,
} from "../../../pages/Profile/hooks/profileDataLoaders";
import {
  saveWeeklyGoal,
  useCurrentUserSummary,
  usePeakHour,
  useProfileAnalytics,
  useSuggestionState,
} from "../../../pages/Profile/hooks/useProfileInsights";
import {
  socialDataFetchers,
  useModuleNameMap,
  useSocialUsers,
  useTasksModalData,
} from "../../../pages/Profile/hooks/useProfileModalsData";
import {
  useEventsData,
  useModalState,
  useProfileData,
  useTaskCountData,
} from "../../../pages/Profile/hooks/useProfileStatePieces";

describe("profile hook extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("profile data loaders", () => {
    it("loads self and remote profiles", async () => {
      getUserProfile.mockResolvedValueOnce({ id: 5 });
      getAnotherUserProfile.mockResolvedValueOnce({ id: 7 });
      await expect(loadProfile()).resolves.toEqual({ id: 5 });
      await expect(loadProfile(7)).resolves.toEqual({ id: 7 });
    });

    it("clears loading when tryLoadProfile fails", async () => {
      const setProfileData = vi.fn();
      const setLoading = vi.fn();
      getAnotherUserProfile.mockRejectedValueOnce(new Error("x"));
      await tryLoadProfile(setProfileData, setLoading, 9);
      expect(setLoading).toHaveBeenCalledWith(false);
    });

    it("normalizes events when API errors occur", async () => {
      const setAllEvents = vi.fn();
      getEvents.mockResolvedValueOnce(null);
      await tryLoadEvents(setAllEvents);
      expect(setAllEvents).toHaveBeenCalledWith([]);
      getEvents.mockRejectedValueOnce(new Error("x"));
      await tryLoadEvents(setAllEvents, 2);
    });

    it("counts incomplete tasks with fallback on failure", async () => {
      const setTaskCount = vi.fn();
      fetchTasks.mockResolvedValueOnce({ results: [{ completed: false }, { completed: true }] });
      await loadTaskCount(setTaskCount);
      expect(setTaskCount).toHaveBeenCalledWith(1);
      fetchTasks.mockRejectedValueOnce(new Error("x"));
      await loadTaskCount(setTaskCount);
      expect(setTaskCount).toHaveBeenLastCalledWith(0);
    });
  });

  describe("analytics and suggestions", () => {
    it("fetches analytics summary only when enabled", async () => {
      analyticsService.getSummary.mockResolvedValueOnce({ total: 10 });
      const { result } = renderHook(() => useProfileAnalytics(true));
      await waitFor(() => expect(result.current).toEqual({ total: 10 }));
      renderHook(() => useProfileAnalytics(false));
      expect(analyticsService.getSummary).toHaveBeenCalledTimes(1);
    });

    it("computes peak hour and handles null input", () => {
      const { result: peak } = renderHook(() => usePeakHour([[0, 2], [0, 3]]));
      expect(peak.current).toBe(1);
      const { result: none } = renderHook(() => usePeakHour(null));
      expect(none.current).toBeNull();
    });

    it("loads current user summary unless disabled", async () => {
      fetchApi.mockResolvedValueOnce({ score: 2 });
      const { result } = renderHook(() => useCurrentUserSummary(false));
      await waitFor(() => expect(result.current).toEqual({ score: 2 }));
      renderHook(() => useCurrentUserSummary(true));
    });

    it("submits profile suggestions and reports errors", async () => {
      fetchApi.mockResolvedValueOnce({});
      const { result: success } = renderHook(() => useSuggestionState(55));
      await act(async () => success.current.submit());
      expect(success.current.state).toBe("sent");

      fetchApi.mockRejectedValueOnce(new Error("x"));
      const { result: failure } = renderHook(() => useSuggestionState(99));
      await act(async () => failure.current.submit());
      expect(failure.current.state).toBe("error");
    });

    it("saves weekly goals and refetches profile", async () => {
      const refetch = vi.fn();
      fetchApi.mockResolvedValueOnce({});
      await saveWeeklyGoal(12, refetch);
      expect(refetch).toHaveBeenCalled();
    });
  });

  describe("modal data hooks", () => {
    it("maps module codes only when the modal is open", async () => {
      getModules.mockResolvedValueOnce({ results: [{ module_code: "CS1", module_name: "Intro" }, { module_name: "Skip" }] });
      const { result: open } = renderHook(() => useModuleNameMap(true));
      await waitFor(() => expect(open.current).toEqual({ CS1: "Intro" }));
      const { result: closed } = renderHook(() => useModuleNameMap(false));
      expect(closed.current).toEqual({});
    });

    it("filters incomplete tasks for the tasks modal", async () => {
      fetchTasks.mockResolvedValueOnce({
        results: [
          { id: 1, completed: false, due_date: "2026-03-25T10:00:00" },
          { id: 2, completed: false, due_date: null },
          { id: 3, completed: true, due_date: "2026-03-24T10:00:00" },
        ],
      });
      const { result } = renderHook(() => useTasksModalData(true));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.tasks.map((task) => task.id)).toEqual([1, 2]);
    });

    it("returns empty modal data when closed", () => {
      const { result } = renderHook(() => useTasksModalData(false));
      expect(result.current).toEqual({ loading: false, tasks: [] });
    });

    it("fetches social users per user and handles errors", async () => {
      const fetchFn = vi.fn().mockResolvedValueOnce({ results: [{ id: 1 }] }).mockRejectedValueOnce(new Error("x"));
      const { result, rerender } = renderHook(({ isOpen, userId }) => useSocialUsers(isOpen, userId, fetchFn), {
        initialProps: { isOpen: true, userId: 5 },
      });
      await waitFor(() => expect(result.current).toEqual([{ id: 1 }]));
      rerender({ isOpen: true, userId: 6 });
      await waitFor(() => expect(result.current).toEqual([]));
      rerender({ isOpen: false, userId: 6 });
      expect(result.current).toEqual([]);
    });

    it("exposes social data fetcher helpers", () => {
      expect(typeof socialDataFetchers.sharedWithMe).toBe("function");
      expect(typeof socialDataFetchers.sharingWith).toBe("function");
    });
  });

  describe("profile state hooks", () => {
    it("loads the current profile and triggers reloads", async () => {
      getUserProfile.mockResolvedValue({ id: 5, is_sharing: false });
      const { result } = renderHook(() => useProfileData());
      await waitFor(() => expect(result.current.loading).toBe(false));
      act(() => result.current.setOptimisticShare(true));
      expect(result.current.profileData.is_sharing).toBe(true);
      await act(async () => result.current.reload());
      expect(refreshProfile).toHaveBeenCalled();
    });

    it("loads remote profile data when an id is provided", async () => {
      getAnotherUserProfile.mockResolvedValue({ id: 9, is_sharing: false });
      const { result } = renderHook(() => useProfileData(9));
      await waitFor(() => expect(result.current.profileData).toEqual({ id: 9, is_sharing: false }));
    });

    it("loads events and updates the selected range", async () => {
      getEvents.mockResolvedValueOnce([{ id: "event-1" }]);
      const { result } = renderHook(() => useEventsData(9));
      await waitFor(() => expect(result.current.allEvents).toEqual([{ id: "event-1" }]));
      act(() => result.current.setEventRange("week"));
      expect(result.current.eventRange).toBe("week");
    });

    it("toggles modal booleans through setters", () => {
      const { result } = renderHook(() => useModalState());
      act(() => {
        result.current.setShowModules(true);
        result.current.setShowTasks(true);
        result.current.setShowEvents(true);
        result.current.setShowEditProfile(true);
        result.current.setShowSharedWith(true);
        result.current.setShowSharedBy(true);
      });
      expect(result.current.showModules).toBe(true);
      expect(result.current.showTasks).toBe(true);
      expect(result.current.showEvents).toBe(true);
      expect(result.current.showEditProfile).toBe(true);
      expect(result.current.showSharedWith).toBe(true);
      expect(result.current.showSharedBy).toBe(true);
    });

    it("counts incomplete tasks for local and remote profiles", async () => {
      fetchTasks.mockResolvedValueOnce([{ completed: false }, { completed: true }]);
      const { result: local } = renderHook(() => useTaskCountData());
      await waitFor(() => expect(local.current.taskCount).toBe(1));
      const { result: remote } = renderHook(() => useTaskCountData(22));
      expect(remote.current.taskCount).toBe(0);
    });
  });

  it("polls remote profiles periodically", async () => {
    vi.useFakeTimers();
    getAnotherUserProfile
      .mockResolvedValueOnce({ id: 9, is_sharing: false })
      .mockResolvedValueOnce({ id: 9, is_sharing: true });

    const { result } = renderHook(() => useProfileData(9));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.profileData).toEqual({ id: 9, is_sharing: false });

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getAnotherUserProfile).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("reloads remote profiles without hitting the auth refresh hook", async () => {
    getAnotherUserProfile.mockResolvedValue({ id: 9, is_sharing: true });
    const { result } = renderHook(() => useProfileData(9));
    await act(async () => {
      await result.current.reload();
      await Promise.resolve();
    });
    expect(refreshProfile).not.toHaveBeenCalled();
    expect(getAnotherUserProfile).toHaveBeenCalled();
  });
});
