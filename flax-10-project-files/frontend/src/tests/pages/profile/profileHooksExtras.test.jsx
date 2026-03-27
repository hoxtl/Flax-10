import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchApi = vi.fn();
const getAnotherUserProfile = vi.fn();
const getUserProfile = vi.fn();
const getEvents = vi.fn();
const fetchTasks = vi.fn();

vi.mock("../../../api/client", () => ({
  fetchApi: (...args) => fetchApi(...args),
}));

vi.mock("../../../api/userApi", () => ({
  getAnotherUserProfile: (...args) => getAnotherUserProfile(...args),
  getUserProfile: (...args) => getUserProfile(...args),
}));

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEvents(...args),
}));

vi.mock("../../../api/taskApi", () => ({
  fetchTasks: (...args) => fetchTasks(...args),
}));

import { useProfileVisibility } from "../../../pages/profile/hooks/useProfileVisibility";
import { useProfileHeaderState } from "../../../pages/profile/hooks/useProfileHeaderState";
import {
  loadProfile,
  loadTaskCount,
  tryLoadEvents,
  tryLoadProfile,
} from "../../../pages/profile/hooks/profileDataLoaders";

describe("profile hook extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("covers profile visibility for self, shared, and non-self viewers", () => {
    expect(useProfileVisibility(null, { username: "ada" })).toMatchObject({
      isSelf: true,
      canEditProfile: true,
      canViewCalendar: false,
    });

    expect(
      useProfileVisibility(
        { username: "grace", is_shared_with_me: true },
        { username: "ada" },
      ),
    ).toMatchObject({
      isSelf: false,
      isShared: true,
      canViewCalendar: true,
      canViewTasks: false,
      canEditProfile: false,
    });
  });

  it("opens/closes header collections, updates persona state, and handles badge pinning", async () => {
    const reload = vi.fn();
    const { result } = renderHook(() =>
      useProfileHeaderState(
        { pinned_badge_id: 7 },
        { canEditProfile: true },
        reload,
      ),
    );

    expect(result.current.pinnedBadgeId).toBe(7);
    result.current.openAchievements();
    result.current.openSocieties();
    result.current.setSocieties([{ id: 1 }]);
    result.current.setBadges([{ id: 7 }]);
    result.current.setPersonaState("Night owl", 23);

    await waitFor(() => {
      expect(result.current.showAchievements).toBe(true);
      expect(result.current.showSocieties).toBe(true);
      expect(result.current.societies).toEqual([{ id: 1 }]);
      expect(result.current.badges).toEqual([{ id: 7 }]);
      expect(result.current.persona).toBe("Night owl");
      expect(result.current.peakHour).toBe(23);
    });

    await result.current.handlePinBadge(7);
    expect(fetchApi).toHaveBeenCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ pinned_badge_id: "" }),
    });
    expect(reload).toHaveBeenCalled();

    await result.current.handlePinBadge(11);
    expect(fetchApi).toHaveBeenCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ pinned_badge_id: "11" }),
    });

    const readOnly = renderHook(() =>
      useProfileHeaderState(
        { pinned_badge_id: "" },
        { canEditProfile: false },
        reload,
      ),
    );
    await readOnly.result.current.handlePinBadge(4);
    expect(fetchApi).toHaveBeenCalledTimes(2);

    result.current.closeAchievements();
    result.current.closeSocieties();
    await waitFor(() => {
      expect(result.current.showAchievements).toBe(false);
      expect(result.current.showSocieties).toBe(false);
    });
  });

  it("uses empty pinned badge ids when profile data or badge ids are missing", async () => {
    const reload = vi.fn();
    const { result } = renderHook(() =>
      useProfileHeaderState(
        null,
        { canEditProfile: true },
        reload,
      ),
    );

    expect(result.current.pinnedBadgeId).toBe("");
    await result.current.handlePinBadge(null);
    expect(fetchApi).toHaveBeenCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ pinned_badge_id: "" }),
    });
  });

  it("loads profiles, events, and task counts across success and failure paths", async () => {
    getUserProfile.mockResolvedValue({ username: "ada" });
    getAnotherUserProfile.mockResolvedValue({ username: "grace" });
    await expect(loadProfile()).resolves.toEqual({ username: "ada" });
    await expect(loadProfile(9)).resolves.toEqual({ username: "grace" });

    const setProfileData = vi.fn();
    const setLoading = vi.fn();
    getAnotherUserProfile.mockRejectedValueOnce(new Error("no profile"));
    await tryLoadProfile(setProfileData, setLoading, 5, false);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setProfileData).not.toHaveBeenCalledWith(undefined);

    getUserProfile.mockResolvedValueOnce({ username: "ada" });
    await tryLoadProfile(setProfileData, setLoading, null, true);
    expect(setProfileData).toHaveBeenCalledWith({ username: "ada" });
    expect(setLoading).toHaveBeenCalledTimes(1);

    getUserProfile.mockResolvedValueOnce({ username: "ada-default" });
    await tryLoadProfile(setProfileData, setLoading);
    expect(setProfileData).toHaveBeenCalledWith({ username: "ada-default" });
    expect(setLoading).toHaveBeenCalledTimes(2);

    const setAllEvents = vi.fn();
    getEvents.mockResolvedValueOnce([{ id: 1 }]);
    await tryLoadEvents(setAllEvents, 8);
    expect(getEvents).toHaveBeenCalledWith({ user_id: 8 });
    expect(setAllEvents).toHaveBeenCalledWith([{ id: 1 }]);

    getEvents.mockResolvedValueOnce(null);
    await tryLoadEvents(setAllEvents);
    expect(getEvents).toHaveBeenCalledWith({});
    expect(setAllEvents).toHaveBeenCalledWith([]);

    getEvents.mockRejectedValueOnce(new Error("events failed"));
    await tryLoadEvents(setAllEvents);

    const setTaskCount = vi.fn();
    fetchTasks.mockResolvedValueOnce([
      { completed: false },
      { completed: true },
      { completed: false },
    ]);
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenCalledWith(2);

    fetchTasks.mockResolvedValueOnce({ results: [{ completed: false }, { completed: true }] });
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenCalledWith(1);

    fetchTasks.mockResolvedValueOnce(null);
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenCalledWith(0);

    fetchTasks.mockRejectedValueOnce(new Error("tasks failed"));
    await loadTaskCount(setTaskCount);
    expect(setTaskCount).toHaveBeenCalledWith(0);
  });
});
