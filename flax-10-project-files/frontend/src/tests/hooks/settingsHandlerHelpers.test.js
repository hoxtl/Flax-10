import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearAuthAndRedirect, hasToken, patchSettings, saveUserToStorage } from "../../api/settingsApi";
import { geocodeAddress } from "../../api/geocodeApi";
import { saveHomeAddress, updateUserSettings } from "../../api/userApi";
import {
  saveAccount,
  saveAddress,
  savePassword,
  savePreferences,
  saveSleep,
  saveSleepWindow,
  saveStudyTime,
  saveWeekPreference,
  saveWorktimePreference,
  showTemporaryMessage,
} from "../../components/settings/hooks/settingsHandlerHelpers";
import { useSleepWarning } from "../../components/settings/hooks/useSleepWarning";

vi.mock("../../api/settingsApi", () => ({
  clearAuthAndRedirect: vi.fn(),
  hasToken: vi.fn(),
  patchSettings: vi.fn(),
  saveUserToStorage: vi.fn(),
}));

vi.mock("../../api/userApi", () => ({
  saveHomeAddress: vi.fn(),
  updateUserSettings: vi.fn(),
}));

vi.mock("../../api/geocodeApi", () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock("../../components/settings/sleep/sleepWarningUtils", () => ({
  doesEventOverlapSleepWindow: vi.fn(() => false),
  isDuringSleepWindow: vi.fn(),
}));

import { isDuringSleepWindow } from "../../components/settings/sleep/sleepWarningUtils";

function buildActions() {
  return {
    setPasswordError: vi.fn(),
    setBannerMessage: vi.fn(),
    setIsSaving: vi.fn(),
    setHomeAddressError: vi.fn(),
  };
}

describe("settingsHandlerHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    hasToken.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("showTemporaryMessage clears the message after the timeout", () => {
    const setter = vi.fn();
    showTemporaryMessage(setter, "Saved", 500);

    expect(setter).toHaveBeenNthCalledWith(1, "Saved");
    vi.advanceTimersByTime(500);
    expect(setter).toHaveBeenNthCalledWith(2, "");
  });

  it("saveAccount merges stored user data and normalises numeric years", async () => {
    localStorage.setItem("user", JSON.stringify({ id: 8, role: "student", major: "Math" }));
    patchSettings.mockResolvedValue({
      ok: true,
      data: { user: { first_name: "Ada", last_name: "Lovelace", email: "ada@example.com", year: 2 } },
    });
    const actions = buildActions();

    const result = await saveAccount({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", year: 2 }, actions);

    expect(result).toBe(true);
    expect(saveUserToStorage).toHaveBeenCalledWith(expect.objectContaining({
      id: 8,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      year: "Year 2",
    }));
    expect(actions.setBannerMessage).toHaveBeenCalledWith("");
    expect(actions.setIsSaving).toHaveBeenCalledWith(false);
  });

  it("saveAccount tolerates malformed stored user JSON", async () => {
    localStorage.setItem("user", "{bad json");
    patchSettings.mockResolvedValue({
      ok: true,
      data: { user: { first_name: "Grace", year: "Year 4" } },
    });
    const actions = buildActions();

    await expect(saveAccount({ firstName: "Grace", year: "Year 4" }, actions)).resolves.toBe(true);

    expect(saveUserToStorage).toHaveBeenCalledWith(expect.objectContaining({
      first_name: "Grace",
      year: "Year 4",
    }));
  });

  it("saveAccount returns the API error when patching fails", async () => {
    patchSettings.mockResolvedValue({ ok: false, data: { error: "Account failed" } });
    const actions = buildActions();

    const result = await saveAccount({ firstName: "Ada" }, actions);

    expect(result).toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("Account failed");
  });

  it("saveAccount covers logged-out, rejected, and no-update payload branches", async () => {
    const actions = buildActions();

    hasToken.mockReturnValueOnce(false);
    await expect(saveAccount({ firstName: "Ada" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("You are not logged in, please try again...");

    patchSettings.mockRejectedValueOnce(new Error("boom"));
    await expect(saveAccount({ firstName: "Ada" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("The account update has failed...");

    localStorage.setItem("user", JSON.stringify({ id: 12, year: "Year 1", major: "History" }));
    patchSettings.mockResolvedValueOnce({ ok: true, data: {} });
    await expect(saveAccount({ firstName: "Ada" }, actions)).resolves.toBe(true);
    expect(saveUserToStorage).toHaveBeenLastCalledWith({ id: 12, year: "Year 1", major: "History" });
  });

  it("saveAccount keeps already-normalised years and merges major updates", async () => {
    localStorage.setItem("user", JSON.stringify({ id: 9, role: "student" }));
    patchSettings.mockResolvedValueOnce({
      ok: true,
      data: { user: { year: "Year 4", major: "Physics" } },
    });
    const actions = buildActions();

    await expect(saveAccount({ year: "Year 4" }, actions)).resolves.toBe(true);

    expect(saveUserToStorage).toHaveBeenCalledWith(expect.objectContaining({
      id: 9,
      year: "Year 4",
      major: "Physics",
    }));
  });

  it("saveAccount preserves falsey and non-numeric years while still saving the auth user", async () => {
    const actions = buildActions();
    localStorage.setItem("user", JSON.stringify({ id: 14, role: "student" }));

    patchSettings.mockResolvedValueOnce({
      ok: true,
      data: { user: { year: 0 } },
    });
    await expect(saveAccount({ year: 0 }, actions)).resolves.toBe(true);
    expect(saveUserToStorage).toHaveBeenLastCalledWith(expect.objectContaining({ id: 14, year: 0 }));

    patchSettings.mockResolvedValueOnce({
      ok: true,
      data: { user: { year: "Freshman" } },
    });
    await expect(saveAccount({ year: "Freshman" }, actions)).resolves.toBe(true);
    expect(saveUserToStorage).toHaveBeenLastCalledWith(expect.objectContaining({ id: 14, year: "Freshman" }));
  });

  it("savePassword validates mismatched passwords before saving", async () => {
    const actions = buildActions();

    const result = await savePassword({ newPassword: "password123", confirmPassword: "password321" }, actions);

    expect(result).toBe(false);
    expect(patchSettings).not.toHaveBeenCalled();
    expect(actions.setPasswordError).toHaveBeenCalledWith("New passwords do not match");
  });

  it("savePassword schedules sign-out after a successful change", async () => {
    patchSettings.mockResolvedValue({ ok: true, data: {} });
    const actions = buildActions();

    const result = await savePassword({ newPassword: "password123", confirmPassword: "password123" }, actions);

    expect(result).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(clearAuthAndRedirect).toHaveBeenCalled();
  });

  it("savePassword covers short-password, logged-out, and rejected-save branches", async () => {
    const actions = buildActions();

    await expect(savePassword({ newPassword: "short", confirmPassword: "short" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("Password must be at least 8 characters long");

    hasToken.mockReturnValueOnce(false);
    await expect(savePassword({ newPassword: "password123", confirmPassword: "password123" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("You are not logged in");

    patchSettings.mockRejectedValueOnce(new Error("boom"));
    await expect(savePassword({ newPassword: "password123", confirmPassword: "password123" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("Failed to change password");
  });

  it("savePassword falls back to the default error message when the API omits one", async () => {
    const actions = buildActions();
    patchSettings.mockResolvedValueOnce({ ok: false, data: {} });

    await expect(savePassword({ newPassword: "password123", confirmPassword: "password123" }, actions)).resolves.toBe(false);
    expect(actions.setPasswordError).toHaveBeenCalledWith("Failed to change password");
  });

  it("savePreferences stores the returned user and reports failures", async () => {
    const actions = buildActions();
    updateUserSettings.mockResolvedValueOnce({ user: { id: 3, theme: "dark" } });

    await expect(savePreferences({ theme: "dark", mode: "focus" }, actions)).resolves.toBe(true);
    expect(saveUserToStorage).toHaveBeenCalledWith({ id: 3, theme: "dark" });

    updateUserSettings.mockRejectedValueOnce(new Error("network"));
    await expect(savePreferences({ theme: "light", mode: "zen" }, actions)).resolves.toBe(false);
    expect(actions.setBannerMessage).toHaveBeenCalledWith("Failed to save preferences");
  });

  it("saveSleep/saveStudyTime/saveWeekPreference/saveWorktimePreference cover success and logged-out exits", async () => {
    const actions = buildActions();
    updateUserSettings.mockResolvedValue({ settings: { ok: true } });

    await expect(saveSleep({ sleep_time: "23:00" }, actions)).resolves.toEqual({ ok: true });
    await expect(saveStudyTime({ preferred_study_minutes_per_day: 90 }, actions)).resolves.toEqual({ ok: true });
    await expect(saveWeekPreference({ week_preference: "balanced" }, actions)).resolves.toEqual({ ok: true });
    await expect(saveWorktimePreference({ worktime_preference: "morning" }, actions)).resolves.toEqual({ ok: true });

    hasToken.mockReturnValue(false);
    await expect(saveSleep({ sleep_time: "22:00" }, actions)).resolves.toBe(false);
    expect(updateUserSettings).toHaveBeenCalledTimes(4);
  });

  it("patch-save handlers surface rejected saves and raw responses", async () => {
    const actions = buildActions();

    updateUserSettings.mockRejectedValueOnce(new Error("x"));
    await expect(saveStudyTime({ preferred_study_minutes_per_day: 45 }, actions)).resolves.toBe(false);
    expect(actions.setBannerMessage).toHaveBeenCalledWith("Failed to save study time preference");

    updateUserSettings.mockResolvedValueOnce({ ok: true });
    await expect(saveWorktimePreference({ worktime_preference: "night" }, actions)).resolves.toEqual({ ok: true });
  });

  it("saveSleepWindow reports failures from updateUserSettings", async () => {
    const actions = buildActions();
    updateUserSettings.mockResolvedValueOnce(null);

    const result = await saveSleepWindow({ sleep_time: "23:00", wake_time: "07:00" }, actions);

    expect(result).toBe(false);
    expect(actions.setBannerMessage).toHaveBeenCalledWith("Failed to save sleep schedule");
  });

  it("saveSleepWindow covers logged-out, rejected, and raw-response branches", async () => {
    const actions = buildActions();

    hasToken.mockReturnValueOnce(false);
    await expect(saveSleepWindow({ sleep_time: "23:00", wake_time: "07:00" }, actions)).resolves.toBe(false);

    updateUserSettings.mockRejectedValueOnce(new Error("boom"));
    await expect(saveSleepWindow({ sleep_time: "22:00", wake_time: "06:00" }, actions)).resolves.toBe(false);
    expect(actions.setBannerMessage).toHaveBeenCalledWith("Failed to save sleep schedule");

    updateUserSettings.mockResolvedValueOnce({ ok: true });
    await expect(saveSleepWindow({ sleep_time: "21:00", wake_time: "05:00" }, actions)).resolves.toEqual({ ok: true });
  });

  it("saveAddress validates blanks, geocodes successful saves, and handles persistence failures", async () => {
    const actions = buildActions();

    await expect(saveAddress("   ", actions)).resolves.toBe(false);
    expect(actions.setHomeAddressError).toHaveBeenCalledWith("Please enter a valid home address");

    geocodeAddress.mockResolvedValueOnce({ latitude: 51.5, longitude: -0.12 });
    saveHomeAddress.mockResolvedValueOnce({ ok: true });
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(saveAddress("London", actions)).resolves.toBe(true);
    expect(saveHomeAddress).toHaveBeenCalledWith("London", 51.5, -0.12);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "home-address-updated" }));

    saveHomeAddress.mockRejectedValueOnce(new Error("db"));
    await expect(saveAddress("Paris", actions)).resolves.toBe(false);
    expect(actions.setHomeAddressError).toHaveBeenCalledWith("Home address could not be saved, please try again...");
  });
});

describe("useSleepWarning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs actions immediately when outside the sleep window", () => {
    isDuringSleepWindow.mockReturnValue(false);
    const action = vi.fn();
    const { result } = renderHook(() => useSleepWarning({ sleep_time: "22:00", wake_time: "06:00" }));

    act(() => {
      result.current.checkSleepAndRun("2026-03-24T12:00:00Z", action);
    });

    expect(action).toHaveBeenCalled();
    expect(result.current.sleepWarning).toBe(false);
  });

  it("stores and confirms pending actions during the sleep window", () => {
    isDuringSleepWindow.mockReturnValue(true);
    const action = vi.fn();
    const { result } = renderHook(() => useSleepWarning());

    act(() => {
      result.current.checkSleepAndRun("2026-03-24T02:00:00Z", action);
    });

    expect(result.current.sleepWarning).toBe(true);
    expect(result.current.sleepWarningProps.sleepTime).toBe("23:00");
    expect(result.current.sleepWarningProps.wakeTime).toBe("07:00");

    act(() => {
      result.current.sleepWarningProps.onConfirm();
    });

    expect(action).toHaveBeenCalled();
    expect(result.current.sleepWarning).toBe(false);
  });

  it("clears the warning without running the action when cancelled", () => {
    isDuringSleepWindow.mockReturnValue(true);
    const action = vi.fn();
    const { result } = renderHook(() => useSleepWarning({ sleep_time: "21:00", wake_time: "05:00" }));

    act(() => {
      result.current.checkSleepAndRun(null, action);
      result.current.sleepWarningProps.onCancel();
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.sleepWarning).toBe(false);
  });
});
