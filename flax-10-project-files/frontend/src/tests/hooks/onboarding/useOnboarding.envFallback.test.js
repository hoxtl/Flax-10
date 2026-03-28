import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderHook } from "../../../utils/testUtils";

const refreshProfileMock = vi.hoisted(() => vi.fn());
const refreshTagsMock = vi.hoisted(() => vi.fn());

vi.mock("../../../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({
      refreshProfile: refreshProfileMock,
    }),
  };
});

vi.mock("../../../context/TagContext", () => ({
  useTags: () => ({
    refreshTags: refreshTagsMock,
  }),
}));

describe("useOnboarding env fallback", () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "");
    localStorage.clear();
    localStorage.setItem("token", "fallback-token");
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    refreshProfileMock.mockResolvedValue(undefined);
    refreshTagsMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the /api fallback and creates a stored user object when none exists", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { default: useOnboarding } = await import("../../../components/onboarding/hooks/useOnboarding");
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setYear("1");
      result.current.handleMajorChange("History");
      result.current.setConfirmed(true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/onboarding/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Token fallback-token",
        }),
      }),
    );
    expect(JSON.parse(localStorage.getItem("user"))).toEqual(
      expect.objectContaining({
        year: "1",
        major: "History",
        has_completed_onboarding: true,
      }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(result.current.done).toBe(true);
  });
});
