import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshProfileMock = vi.hoisted(() => vi.fn());
const refreshTagsMock = vi.hoisted(() => vi.fn());

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    refreshProfile: refreshProfileMock,
  }),
}));

vi.mock("../../../context/TagContext", () => ({
  useTags: () => ({
    refreshTags: refreshTagsMock,
  }),
}));

import useOnboarding from "../../../components/onboarding/hooks/useOnboarding";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("useOnboarding catch paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "abc123");
    mockFetch.mockRejectedValue(new Error("submit failed"));
    refreshProfileMock.mockRejectedValue(new Error("profile failed"));
    refreshTagsMock.mockRejectedValue(new Error("tags failed"));
  });

  it("swallows submit, profile, and tag refresh errors while still finishing onboarding flow", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setYear("2");
      result.current.handleMajorChange("Physics");
      result.current.setConfirmed(true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(refreshProfileMock).toHaveBeenCalledTimes(1);
    expect(refreshTagsMock).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.done).toBe(true);
  });
});
