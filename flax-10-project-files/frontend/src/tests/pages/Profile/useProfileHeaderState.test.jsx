import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const fetchApiMock = vi.fn();

vi.mock("../../../api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import { useProfileHeaderState } from "../../../pages/Profile/useProfileHeaderState";

describe("useProfileHeaderState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens and closes header collections and persona state", () => {
    const { result } = renderHook(() =>
      useProfileHeaderState({ pinned_badge_id: "9" }, { canEditProfile: true }, vi.fn()),
    );

    act(() => {
      result.current.openAchievements();
      result.current.openSocieties();
      result.current.setPersonaState("Deep Focus", "14:00");
      result.current.setSocieties([{ id: 1, name: "Chess" }]);
    });

    expect(result.current.showAchievements).toBe(true);
    expect(result.current.showSocieties).toBe(true);
    expect(result.current.persona).toBe("Deep Focus");
    expect(result.current.peakHour).toBe("14:00");
    expect(result.current.societies).toEqual([{ id: 1, name: "Chess" }]);
    expect(result.current.pinnedBadgeId).toBe("9");

    act(() => {
      result.current.closeAchievements();
      result.current.closeSocieties();
    });

    expect(result.current.showAchievements).toBe(false);
    expect(result.current.showSocieties).toBe(false);
  });

  it("pins and unpins badges only when the profile is editable", async () => {
    const reload = vi.fn();
    const { result, rerender } = renderHook(
      ({ profileData, visibility }) => useProfileHeaderState(profileData, visibility, reload),
      {
        initialProps: {
          profileData: { pinned_badge_id: "9" },
          visibility: { canEditProfile: false },
        },
      },
    );

    await act(async () => {
      await result.current.handlePinBadge("4");
    });
    expect(fetchApiMock).not.toHaveBeenCalled();

    rerender({
      profileData: { pinned_badge_id: "9" },
      visibility: { canEditProfile: true },
    });

    await act(async () => {
      await result.current.handlePinBadge("4");
    });
    expect(fetchApiMock).toHaveBeenCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ pinned_badge_id: "4" }),
    });
    expect(reload).toHaveBeenCalled();

    await act(async () => {
      await result.current.handlePinBadge("9");
    });
    expect(fetchApiMock).toHaveBeenLastCalledWith("/profile/", {
      method: "PATCH",
      body: JSON.stringify({ pinned_badge_id: "" }),
    });
  });
});
