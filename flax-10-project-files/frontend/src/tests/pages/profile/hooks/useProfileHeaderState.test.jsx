import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const fetchApiMock = vi.fn();

vi.mock("../../../../api/client", () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import { useProfileHeaderState } from "../../../../pages/profile/hooks/useProfileHeaderState";

describe("useProfileHeaderState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates persona and peak hour state", () => {
    const { result } = renderHook(() => useProfileHeaderState({}, { canEditProfile: true }, vi.fn()));
    act(() => { result.current.setPersonaState("Deep Focus", "14:00"); });
    expect(result.current.persona).toBe("Deep Focus");
    expect(result.current.peakHour).toBe("14:00");
  });

  it("toggles achievements and societies collection visibility", () => {
    const { result } = renderHook(() => useProfileHeaderState({}, { canEditProfile: true }, vi.fn()));
    act(() => { result.current.openAchievements(); result.current.openSocieties(); });
    expect(result.current.showAchievements).toBe(true);
    expect(result.current.showSocieties).toBe(true);
    act(() => { result.current.closeAchievements(); result.current.closeSocieties(); });
    expect(result.current.showAchievements).toBe(false);
    expect(result.current.showSocieties).toBe(false);
  });

  it("stores badges via the exposed setter", () => {
    const { result } = renderHook(() => useProfileHeaderState({}, { canEditProfile: true }, vi.fn()));
    act(() => { result.current.setBadges([{ id: "badge-1", label: "Focus" }]); });
    expect(result.current.badges).toEqual([{ id: "badge-1", label: "Focus" }]);
  });

  it("prevents pinning badges when the profile is not editable", async () => {
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: "9" }, { canEditProfile: false }, vi.fn()));
    await act(async () => { await result.current.handlePinBadge("4"); });
    expect(fetchApiMock).not.toHaveBeenCalled();
  });

  it("pins and unpins badges when profile is editable", async () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: "9" }, { canEditProfile: true }, reload));

    await act(async () => { await result.current.handlePinBadge("4"); });
    expect(fetchApiMock).toHaveBeenCalledWith("/profile/", expect.objectContaining({ method: "PATCH", body: '{"pinned_badge_id":"4"}' }));
    expect(reload).toHaveBeenCalled();

    await act(async () => { await result.current.handlePinBadge("9"); });
    expect(fetchApiMock).toHaveBeenLastCalledWith("/profile/", expect.objectContaining({ method: "PATCH", body: '{"pinned_badge_id":""}' }));
  });

  it("sends an empty pinned badge id when unpinning with a missing badge id", async () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: "9" }, { canEditProfile: true }, reload));

    await act(async () => { await result.current.handlePinBadge(null); });

    expect(fetchApiMock).toHaveBeenCalledWith(
      "/profile/",
      expect.objectContaining({ method: "PATCH", body: '{"pinned_badge_id":""}' })
    );
    expect(reload).toHaveBeenCalled();
  });
});
