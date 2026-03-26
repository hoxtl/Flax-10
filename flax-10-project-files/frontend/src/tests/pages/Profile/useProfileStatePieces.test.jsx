import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const tryLoadProfileMock = vi.fn();
const tryLoadEventsMock = vi.fn();
const loadTaskCountMock = vi.fn();

let authState;

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../../../pages/profile/hooks/profileDataLoaders", () => ({
  loadTaskCount: (...args) => loadTaskCountMock(...args),
  tryLoadEvents: (...args) => tryLoadEventsMock(...args),
  tryLoadProfile: (...args) => tryLoadProfileMock(...args),
}));

import {
  useEventsData,
  useModalState,
  useProfileData,
  useTaskCountData,
} from "../../../pages/profile/hooks/useProfileStatePieces";

describe("useProfileStatePieces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      profile: { id: 5, username: "me" },
      loading: false,
      refreshProfile: vi.fn(),
    };
  });

  it("waits for auth to finish before loading the current profile", () => {
    authState.loading = true;

    const { rerender } = renderHook(() => useProfileData());

    expect(tryLoadProfileMock).not.toHaveBeenCalled();

    authState.loading = false;
    rerender();

    expect(tryLoadProfileMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), null, true);
  });

  it("keeps remote profile data marked as loading until the requested id matches", async () => {
    tryLoadProfileMock.mockImplementation(async (setProfileData, setLoading, userId) => {
      setProfileData({ id: "different", username: "remote" });
      if (userId) setLoading(false);
    });

    const { result } = renderHook(() => useProfileData("9"));

    await waitFor(() => expect(tryLoadProfileMock).toHaveBeenCalled());
    expect(result.current.profileData).toEqual({ id: "different", username: "remote" });
    expect(result.current.loading).toBe(true);
  });

  it("reloads the self profile through refreshProfile and loads remote profiles directly", async () => {
    const refreshProfile = vi.fn();
    authState.refreshProfile = refreshProfile;

    tryLoadProfileMock.mockResolvedValue(undefined);

    const { result: selfResult } = renderHook(() => useProfileData());
    await act(async () => {
      await selfResult.current.reload();
    });

    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(tryLoadProfileMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), null, true);

    tryLoadProfileMock.mockClear();

    const { result: remoteResult } = renderHook(() => useProfileData("9"));
    await act(async () => {
      await remoteResult.current.reload();
    });

    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(tryLoadProfileMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), "9", false);
  });

  it("skips task count loading for remote profiles", () => {
    const { result } = renderHook(() => useTaskCountData(22));

    expect(loadTaskCountMock).not.toHaveBeenCalled();
    expect(result.current.taskCount).toBe(0);
  });

  it("loads task counts for the current profile", async () => {
    const { result } = renderHook(() => useTaskCountData());

    await waitFor(() => expect(loadTaskCountMock).toHaveBeenCalled());
    expect(result.current.taskCount).toBe(0);
  });

  it("loads events for the viewed user", async () => {
    renderHook(() => useEventsData(99));

    await waitFor(() => expect(tryLoadEventsMock).toHaveBeenCalledWith(expect.any(Function), 99));
  });

  it("exposes modal state setters independently", () => {
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
});
