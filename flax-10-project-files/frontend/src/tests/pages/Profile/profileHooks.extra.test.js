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

  it("covers profile data loaders and task counting fallbacks", async () => {
    getUserProfile.mockResolvedValueOnce({ id: 5 });
    getAnotherUserProfile.mockResolvedValueOnce({ id: 7 });
    expect(await loadProfile()).toEqual({ id: 5 });
    expect(await loadProfile(7)).toEqual({ id: 7 });

    const setProfileData = vi.fn();
    const setLoading = vi.fn();
    getAnotherUserProfile.mockRejectedValueOnce(new Error("x"));
    await tryLoadProfile(setProfileData, setLoading, 9);
    expect(setLoading).toHaveBeenCalledWith(false);

    const setAllEvents = vi.fn();
    getEvents.mockResolvedValueOnce(null);
    await tryLoadEvents(setAllEvents);
    expect(setAllEvents).toHaveBeenCalledWith([]);

    getEvents.mockRejectedValueOnce(new Error("x"));
    await tryLoadEvents(setAllEvents, 2);

    const setTaskCount = vi.fn();
    fetchTasks.mockResolvedValueOnce({ results: [{ completed: false }, { completed: true }] });
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenCalledWith(1);

    fetchTasks.mockRejectedValueOnce(new Error("x"));
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenLastCalledWith(0);
  });

  it("covers analytics, summaries, suggestions, and weekly goal saving", async () => {
    analyticsService.getSummary.mockResolvedValueOnce({ total: 10 });
    const { result: analyticsResult } = renderHook(() => useProfileAnalytics(true));
    await waitFor(() => expect(analyticsResult.current).toEqual({ total: 10 }));
    renderHook(() => useProfileAnalytics(false));
    expect(analyticsService.getSummary).toHaveBeenCalledTimes(1);

    const { result: peakResult } = renderHook(() => usePeakHour([[0, 2], [0, 3]]));
    expect(peakResult.current).toBe(1);
    const { result: noPeak } = renderHook(() => usePeakHour(null));
    expect(noPeak.current).toBeNull();

    fetchApi.mockResolvedValueOnce({ score: 2 });
    const { result: summaryResult } = renderHook(() => useCurrentUserSummary(false));
    await waitFor(() => expect(summaryResult.current).toEqual({ score: 2 }));
    renderHook(() => useCurrentUserSummary(true));

    fetchApi.mockResolvedValueOnce({});
    const { result: suggestionResult } = renderHook(() => useSuggestionState(55));
    await act(async () => {
      await suggestionResult.current.submit();
    });
    expect(suggestionResult.current.state).toBe("sent");

    fetchApi.mockRejectedValueOnce(new Error("x"));
    const { result: failedSuggestion } = renderHook(() => useSuggestionState(99));
    await act(async () => {
      await failedSuggestion.current.submit();
    });
    expect(failedSuggestion.current.state).toBe("error");

    const refetch = vi.fn();
    fetchApi.mockResolvedValueOnce({});
    await saveWeeklyGoal(12, refetch);
    expect(refetch).toHaveBeenCalled();
  });

  it("covers modal data hooks and social fetcher branches", async () => {
    getModules.mockResolvedValueOnce({ results: [{ module_code: "CS1", module_name: "Intro" }, { module_name: "Skip" }] });
    const { result: moduleMap } = renderHook(() => useModuleNameMap(true));
    await waitFor(() => expect(moduleMap.current).toEqual({ CS1: "Intro" }));
    const { result: closedModuleMap } = renderHook(() => useModuleNameMap(false));
    expect(closedModuleMap.current).toEqual({});

    fetchTasks.mockResolvedValueOnce({
      results: [
        { id: 1, completed: false, due_date: "2026-03-25T10:00:00" },
        { id: 2, completed: false, due_date: null },
        { id: 3, completed: true, due_date: "2026-03-24T10:00:00" },
      ],
    });
    const { result: tasksModal } = renderHook(() => useTasksModalData(true));
    await waitFor(() => expect(tasksModal.current.loading).toBe(false));
    expect(tasksModal.current.tasks.map((task) => task.id)).toEqual([1, 2]);

    const { result: closedTasksModal } = renderHook(() => useTasksModalData(false));
    expect(closedTasksModal.current).toEqual({ loading: false, tasks: [] });

    const fetchFn = vi.fn().mockResolvedValueOnce({ results: [{ id: 1 }] }).mockRejectedValueOnce(new Error("x"));
    const { result: socialUsers, rerender } = renderHook(({ isOpen, userId }) => useSocialUsers(isOpen, userId, fetchFn), {
      initialProps: { isOpen: true, userId: 5 },
    });
    await waitFor(() => expect(socialUsers.current).toEqual([{ id: 1 }]));
    rerender({ isOpen: true, userId: 6 });
    await waitFor(() => expect(socialUsers.current).toEqual([]));
    rerender({ isOpen: false, userId: 6 });
    expect(socialUsers.current).toEqual([]);

    expect(typeof socialDataFetchers.sharedWithMe).toBe("function");
    expect(typeof socialDataFetchers.sharingWith).toBe("function");
  });

  it("covers profile state hooks for self, remote, modal state, events, and task count", async () => {
    getUserProfile.mockResolvedValue({ id: 5, is_sharing: false });
    const { result: selfProfile } = renderHook(() => useProfileData());
    await waitFor(() => expect(selfProfile.current.loading).toBe(false));
    act(() => selfProfile.current.setOptimisticShare(true));
    expect(selfProfile.current.profileData.is_sharing).toBe(true);
    await act(async () => {
      await selfProfile.current.reload();
    });
    expect(refreshProfile).toHaveBeenCalled();

    getAnotherUserProfile.mockResolvedValue({ id: 9, is_sharing: false });
    const { result: remoteProfile } = renderHook(() => useProfileData(9));
    await waitFor(() => expect(remoteProfile.current.profileData).toEqual({ id: 9, is_sharing: false }));

    getEvents.mockResolvedValueOnce([{ id: "event-1" }]);
    const { result: eventsData } = renderHook(() => useEventsData(9));
    await waitFor(() => expect(eventsData.current.allEvents).toEqual([{ id: "event-1" }]));
    act(() => eventsData.current.setEventRange("week"));
    expect(eventsData.current.eventRange).toBe("week");

    const { result: modalState } = renderHook(() => useModalState());
    act(() => {
      modalState.current.setShowModules(true);
      modalState.current.setShowTasks(true);
      modalState.current.setShowEvents(true);
      modalState.current.setShowEditProfile(true);
      modalState.current.setShowSharedWith(true);
      modalState.current.setShowSharedBy(true);
    });
    expect(modalState.current.showModules).toBe(true);
    expect(modalState.current.showTasks).toBe(true);
    expect(modalState.current.showEvents).toBe(true);
    expect(modalState.current.showEditProfile).toBe(true);
    expect(modalState.current.showSharedWith).toBe(true);
    expect(modalState.current.showSharedBy).toBe(true);

    fetchTasks.mockResolvedValueOnce([{ completed: false }, { completed: true }]);
    const { result: taskCountData } = renderHook(() => useTaskCountData());
    await waitFor(() => expect(taskCountData.current.taskCount).toBe(1));
    const { result: remoteTaskCountData } = renderHook(() => useTaskCountData(22));
    expect(remoteTaskCountData.current.taskCount).toBe(0);
  });
});
