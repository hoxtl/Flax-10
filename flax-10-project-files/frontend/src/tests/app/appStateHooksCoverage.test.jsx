import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const useAuthMock = vi.fn();
const readActiveNavMock = vi.fn();
const persistActiveNavMock = vi.fn();
const hasSeenWelcomeMock = vi.fn();
const isBannedFromStorageMock = vi.fn();
const readStoredThemePrefsMock = vi.fn();
const loadThemeMock = vi.fn();

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("../../app/storage", async () => {
  const actual = await vi.importActual("../../app/storage");
  return {
    ...actual,
    hasSeenWelcome: () => hasSeenWelcomeMock(),
    isBannedFromStorage: () => isBannedFromStorageMock(),
    persistActiveNav: (...args) => persistActiveNavMock(...args),
    readActiveNav: () => readActiveNavMock(),
  };
});

vi.mock("../../app/theme", async () => {
  const actual = await vi.importActual("../../app/theme");
  return {
    ...actual,
    loadTheme: (...args) => loadThemeMock(...args),
    readStoredThemePrefs: () => readStoredThemePrefsMock(),
  };
});

import { useOnboardingCheck } from "../../app/hooks/useOnboardingCheck";
import { useAppState } from "../../app/hooks/useAppState";
import { useThemeState } from "../../app/hooks/useThemeState";
import { useTourCheck } from "../../app/hooks/useTourCheck";

describe("app state hooks coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthMock.mockReturnValue({
      authenticated: true,
      loading: false,
      profile: { id: 7, major: "CS" },
      user: { id: 7, name: "Ava" },
    });
    readActiveNavMock.mockReturnValue("tasks");
    hasSeenWelcomeMock.mockReturnValue(true);
    isBannedFromStorageMock.mockReturnValue(false);
    readStoredThemePrefsMock.mockReturnValue({ theme: "forest", mode: "dark" });
    loadThemeMock.mockImplementation((_authed, setTheme, setMode, setLoading) => {
      setTheme("forest");
      setMode("dark");
      setLoading(false);
    });
  });

  it("hydrates app state from auth, storage, and theme state", () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.activeNav).toBe("tasks");
    expect(result.current.authed).toBe(true);
    expect(result.current.user).toEqual({ id: 7, name: "Ava" });
    expect(result.current.profile).toEqual({ id: 7, major: "CS" });
    expect(result.current.showWelcome).toBe(false);
    expect(result.current.isBanned).toBe(false);
    expect(result.current.initialTheme).toBe("forest");
    expect(result.current.initialMode).toBe("dark");
    expect(result.current.isLoadingTheme).toBe(false);

    act(() => result.current.setActiveNav("calendar"));
    expect(persistActiveNavMock).toHaveBeenCalledWith("calendar");
    expect(result.current.activeNav).toBe("calendar");

    act(() => result.current.setShowWelcome(true));
    expect(result.current.showWelcome).toBe(true);
  });

  it("keeps loading true while auth is still loading", () => {
    useAuthMock.mockReturnValue({
      authenticated: false,
      loading: true,
      profile: null,
      user: null,
    });

    const { result } = renderHook(() => useAppState());
    expect(result.current.isLoadingTheme).toBe(true);
  });

  it("reads stored theme prefs immediately and triggers theme loading when auth changes", () => {
    const { result, rerender } = renderHook(({ authed }) => useThemeState(authed), {
      initialProps: { authed: false },
    });

    expect(result.current.initialTheme).toBe("forest");
    expect(result.current.initialMode).toBe("dark");
    expect(loadThemeMock).toHaveBeenCalledWith(false, expect.any(Function), expect.any(Function), expect.any(Function));

    rerender({ authed: true });
    expect(loadThemeMock).toHaveBeenCalledWith(true, expect.any(Function), expect.any(Function), expect.any(Function));
  });

  it("only shows onboarding when the user has a profile with a missing major", () => {
    useAuthMock.mockReturnValueOnce({
      loading: false,
      profile: { id: 1, major: "" },
    });
    const missingMajor = renderHook(() => useOnboardingCheck());
    expect(missingMajor.result.current[0]).toBe(true);

    useAuthMock.mockReturnValueOnce({
      loading: true,
      profile: { id: 1, major: "" },
    });
    const loading = renderHook(() => useOnboardingCheck());
    expect(loading.result.current[0]).toBe(false);

    useAuthMock.mockReturnValueOnce({
      loading: false,
      profile: { id: 1, major: "Physics" },
    });
    const complete = renderHook(() => useOnboardingCheck());
    expect(complete.result.current[0]).toBe(false);
  });

  it("shows the home tour once per profile id and persists completion", () => {
    const { result, rerender } = renderHook(() => useTourCheck());

    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(localStorage.getItem("flax_tour_done_7")).toBe("1");
    expect(result.current[0]).toBe(false);

    rerender();
    expect(result.current[0]).toBe(false);
  });

  it("skips the tour while loading or without a profile id", () => {
    useAuthMock.mockReturnValueOnce({
      loading: true,
      profile: { id: 9 },
    });
    const loading = renderHook(() => useTourCheck());
    expect(loading.result.current[0]).toBe(false);

    useAuthMock.mockReturnValueOnce({
      loading: false,
      profile: {},
    });
    const missingId = renderHook(() => useTourCheck());
    expect(missingId.result.current[0]).toBe(false);
  });
});
