import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const persistActiveNav = vi.fn();
const loadTheme = vi.fn();

let authState;
let storageState;
let themePrefs;

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../../app/storage", () => ({
  hasSeenWelcome: () => storageState.hasSeenWelcome,
  isBannedFromStorage: () => storageState.isBanned,
  persistActiveNav: (...args) => persistActiveNav(...args),
  readActiveNav: () => storageState.activeNav,
}));

vi.mock("../../app/theme", () => ({
  loadTheme: (...args) => loadTheme(...args),
  readStoredThemePrefs: () => themePrefs,
}));

import { useAppState } from "../../app/hooks/useAppState";
import { useOnboardingCheck } from "../../app/hooks/useOnboardingCheck";
import { useThemeState } from "../../app/hooks/useThemeState";

describe("app hooks", () => {
  beforeEach(() => {
    persistActiveNav.mockReset();
    loadTheme.mockReset();

    authState = {
      authenticated: false,
      loading: false,
      profile: { id: 1, major: "Computer Science" },
      user: { id: 99, first_name: "Ava" },
    };

    storageState = {
      activeNav: "calendar",
      hasSeenWelcome: false,
      isBanned: true,
    };

    themePrefs = {
      theme: "forest",
      mode: "dark",
    };
  });

  it("useThemeState seeds stored prefs and calls loadTheme with the auth state", () => {
    loadTheme.mockImplementation(() => {});

    const { result } = renderHook(() => useThemeState(true));

    expect(result.current).toEqual({
      initialTheme: "forest",
      initialMode: "dark",
      isLoadingTheme: true,
    });
    expect(loadTheme).toHaveBeenCalledWith(
      true,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function)
    );
  });

  it("useOnboardingCheck turns on onboarding only when a loaded profile has no major", async () => {
    authState = {
      ...authState,
      loading: false,
      profile: { id: 4, major: "" },
    };

    const { result, rerender } = renderHook(() => useOnboardingCheck());
    await waitFor(() => expect(result.current[0]).toBe(true));

    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);

    authState = {
      ...authState,
      loading: true,
      profile: { id: 4, major: "" },
    };
    rerender();
    expect(result.current[0]).toBe(false);

    authState = {
      ...authState,
      loading: false,
      profile: { id: 4, major: "Physics" },
    };
    rerender();
    expect(result.current[0]).toBe(false);
  });

  it("useAppState combines auth, storage, welcome, and theme state", async () => {
    loadTheme.mockImplementation((authed, setInitialTheme, setInitialMode, setIsLoadingTheme) => {
      setInitialTheme(authed ? "ocean" : "flax");
      setInitialMode(authed ? "light" : "dark");
      setIsLoadingTheme(false);
    });

    authState = {
      authenticated: true,
      loading: false,
      profile: { id: 3, major: "Mathematics" },
      user: { id: 7, first_name: "Noor" },
    };

    const { result } = renderHook(() => useAppState());

    await waitFor(() => expect(result.current.isLoadingTheme).toBe(false));
    expect(result.current.activeNav).toBe("calendar");
    expect(result.current.initialTheme).toBe("ocean");
    expect(result.current.initialMode).toBe("light");
    expect(result.current.user).toEqual(authState.user);
    expect(result.current.profile).toEqual(authState.profile);
    expect(result.current.authed).toBe(true);
    expect(result.current.showWelcome).toBe(true);
    expect(result.current.isBanned).toBe(true);

    act(() => result.current.setActiveNav("tasks"));
    expect(persistActiveNav).toHaveBeenCalledWith("tasks");
    expect(result.current.activeNav).toBe("tasks");

    act(() => result.current.setShowWelcome(false));
    expect(result.current.showWelcome).toBe(false);
  });

  it("keeps the combined loading state true while auth is still loading", async () => {
    loadTheme.mockImplementation((authed, setInitialTheme, setInitialMode, setIsLoadingTheme) => {
      setInitialTheme("mint");
      setInitialMode("light");
      setIsLoadingTheme(false);
    });

    authState = {
      ...authState,
      loading: true,
    };
    storageState = {
      ...storageState,
      hasSeenWelcome: true,
      isBanned: false,
      activeNav: "home",
    };

    const { result } = renderHook(() => useAppState());

    await waitFor(() => expect(result.current.initialTheme).toBe("mint"));
    expect(result.current.isLoadingTheme).toBe(true);
    expect(result.current.showWelcome).toBe(false);
    expect(result.current.isBanned).toBe(false);
  });
});
