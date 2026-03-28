/*
 * Tests for dashboard layout helper utilities.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/authApi", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

vi.mock("../../../components/Auth/utils/authHelpers", () => ({
  clearUserData: vi.fn(),
}));

import {
  handleLogoutClick,
  handlePendingAction,
  resolveQuickAddModal,
  shouldBlockTimerNavigation,
  shouldShowBackToTop,
} from "../../../layout/dashboard_layout/dashboardLayoutActions";
import {
  formatUserYear,
  getStoredUser,
  parseStoredUser,
} from "../../../layout/dashboard_layout/dashboardLayoutUser";

describe("dashboard layout helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("formats years across empty, numeric, and prefixed cases", () => {
    expect(formatUserYear("")).toBe("Year: ");
    expect(formatUserYear(" 3 ")).toBe("Year 3");
    expect(formatUserYear("Foundation")).toBe("Foundation");
    expect(formatUserYear("Year 4")).toBe("Year 4");
  });

  it("parses stored users into the dashboard summary shape", () => {
    expect(
      parseStoredUser({
        first_name: "Ada",
        last_name: "Lovelace",
        year: "2",
        major: "",
        email: "ada@example.com",
        username: "ada",
        is_superuser: 1,
        role: "teacher",
      }),
    ).toEqual({
      name: "Ada Lovelace",
      year: "Year 2",
      major: "Major: ",
      email: "ada@example.com",
      username: "ada",
      isAdmin: true,
      role: "teacher",
    });
  });

  it("reads stored users and falls back cleanly", () => {
    localStorage.setItem("user", JSON.stringify({ username: "sam", year: "Foundation", email: "s@example.com" }));
    expect(getStoredUser()).toMatchObject({ name: "sam", year: "Foundation" });
    localStorage.setItem("user", "{bad json");
    expect(getStoredUser()).toBeUndefined();
    localStorage.removeItem("user");
    expect(getStoredUser()).toBeUndefined();
  });

  it("handles logout without skipping cached user cleanup", async () => {
    const { authService } = await import("../../../api/authApi");
    const { clearUserData } = await import("../../../components/Auth/utils/authHelpers");
    await handleLogoutClick();
    expect(authService.logout).toHaveBeenCalled();
    expect(clearUserData).toHaveBeenCalled();
    authService.logout.mockRejectedValueOnce(new Error("boom"));
    await handleLogoutClick();
    expect(clearUserData).toHaveBeenCalledTimes(2);
  });

  it("shows the back-to-top button and blocks timer navigation only when needed", () => {
    expect(shouldShowBackToTop("settings")).toBe(true);
    expect(shouldShowBackToTop("group-work")).toBe(false);
    expect(shouldBlockTimerNavigation("timer", { isActive: true, isPaused: false, mode: "work" })).toBe(true);
    expect(shouldBlockTimerNavigation("timer", { isActive: true, isPaused: true, mode: "work" })).toBe(false);
    expect(shouldBlockTimerNavigation("timer", { isActive: true, isPaused: false, mode: "break" })).toBe(false);
    expect(shouldBlockTimerNavigation("calendar", { isActive: true, isPaused: false })).toBe(false);
  });

  it("routes pending actions to the right dashboard handler", () => {
    const setShowQuickAdd = vi.fn();
    const onNavChange = vi.fn();
    handlePendingAction("QUICK_ADD", setShowQuickAdd, onNavChange);
    expect(setShowQuickAdd).toHaveBeenCalledWith(true);
    handlePendingAction("settings", setShowQuickAdd, onNavChange);
    expect(onNavChange).toHaveBeenCalledWith("settings");
    expect(handlePendingAction("profile", setShowQuickAdd)).toBeUndefined();
  });

  it("routes each quick-add action to the right handler", () => {
    const actions = {
      openSociety: vi.fn(),
      openTask: vi.fn(),
      openModuleCreator: vi.fn(),
      openDeadline: vi.fn(),
      openReading: vi.fn(),
      openCalendar: vi.fn(),
    };
    const module = { module_code: "CS102" };

    resolveQuickAddModal("society", module, actions);
    resolveQuickAddModal("task", module, actions);
    resolveQuickAddModal("create_module", module, actions);
    resolveQuickAddModal("add_deadline", module, actions);
    resolveQuickAddModal("add_reading", module, actions);
    resolveQuickAddModal("meeting", module, actions);

    expect(actions.openSociety).toHaveBeenCalled();
    expect(actions.openTask).toHaveBeenCalled();
    expect(actions.openModuleCreator).toHaveBeenCalled();
    expect(actions.openDeadline).toHaveBeenCalledWith(module);
    expect(actions.openReading).toHaveBeenCalledWith(module);
    expect(actions.openCalendar).toHaveBeenCalledWith("meeting");
  });
});
