import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserSettings = vi.fn();

vi.mock("../../api/userApi", () => ({
  getUserSettings: (...args) => getUserSettings(...args),
}));

import { loadTheme, readStoredThemePrefs } from "../../app/theme";

describe("loadTheme", () => {
  beforeEach(() => {
    getUserSettings.mockReset();
    localStorage.clear();
  });

  it("stops loading immediately when the user is not authenticated", async () => {
    const setInitialTheme = vi.fn();
    const setInitialMode = vi.fn();
    const setIsLoadingTheme = vi.fn();

    await loadTheme(false, setInitialTheme, setInitialMode, setIsLoadingTheme);

    expect(getUserSettings).not.toHaveBeenCalled();
    expect(setInitialTheme).toHaveBeenCalledWith("flax");
    expect(setInitialMode).toHaveBeenCalledWith("light");
    expect(setIsLoadingTheme).toHaveBeenCalledWith(false);
  });

  it("applies the fetched theme and mode when both are present", async () => {
    const setInitialTheme = vi.fn();
    const setInitialMode = vi.fn();
    const setIsLoadingTheme = vi.fn();

    getUserSettings.mockResolvedValueOnce({ theme: "aurora", mode: "dark" });

    await loadTheme(true, setInitialTheme, setInitialMode, setIsLoadingTheme);

    expect(setInitialTheme).toHaveBeenCalledWith("aurora");
    expect(setInitialMode).toHaveBeenCalledWith("dark");
    expect(setIsLoadingTheme).toHaveBeenCalledWith(false);
  });

  it("falls back to flax and light when the fetched settings are empty", async () => {
    const setInitialTheme = vi.fn();
    const setInitialMode = vi.fn();
    const setIsLoadingTheme = vi.fn();

    getUserSettings.mockResolvedValueOnce({});

    await loadTheme(true, setInitialTheme, setInitialMode, setIsLoadingTheme);

    expect(setInitialTheme).toHaveBeenCalledWith("flax");
    expect(setInitialMode).toHaveBeenCalledWith("light");
    expect(setIsLoadingTheme).toHaveBeenCalledWith(false);
  });

  it("falls back to flax and light when fetching settings fails", async () => {
    const setInitialTheme = vi.fn();
    const setInitialMode = vi.fn();
    const setIsLoadingTheme = vi.fn();

    getUserSettings.mockRejectedValueOnce(new Error("boom"));

    await loadTheme(true, setInitialTheme, setInitialMode, setIsLoadingTheme);

    expect(setInitialTheme).toHaveBeenCalledWith("flax");
    expect(setInitialMode).toHaveBeenCalledWith("light");
    expect(setIsLoadingTheme).toHaveBeenCalledWith(false);
  });

  it("reads valid stored theme preferences directly from the current keys", () => {
    localStorage.setItem("colorTheme", "ocean");
    localStorage.setItem("mode", "dark");

    expect(readStoredThemePrefs()).toEqual({ theme: "ocean", mode: "dark" });
  });

  it("falls back to the legacy theme key and defaults when stored values are invalid", () => {
    localStorage.setItem("colorTheme", "invalid-theme");
    localStorage.setItem("mode", "invalid-mode");
    localStorage.setItem("theme", "forest");

    expect(readStoredThemePrefs()).toEqual({ theme: "forest", mode: "light" });
  });
});
