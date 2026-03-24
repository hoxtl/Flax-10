import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearAuthStorage,
  hasSeenWelcome,
  isAuthenticated,
  isBannedFromStorage,
  markWelcomeSeen,
  persistActiveNav,
  readActiveNav,
  readUser,
} from "../../app/storage";
import { ACTIVE_NAV_KEY, WELCOME_SEEN_KEY } from "../../app/constants";

describe("app storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("reads a stored user and safely returns null for missing or invalid json", () => {
    expect(readUser()).toBeNull();

    localStorage.setItem("user", JSON.stringify({ id: 1, name: "Ava" }));
    expect(readUser()).toEqual({ id: 1, name: "Ava" });

    localStorage.setItem("user", "{bad-json");
    expect(readUser()).toBeNull();
  });

  it("reports auth and banned flags from storage", () => {
    expect(isAuthenticated()).toBe(false);
    expect(isBannedFromStorage()).toBe(false);

    localStorage.setItem("token", "secret");
    localStorage.setItem("banned", "1");

    expect(isAuthenticated()).toBe(true);
    expect(isBannedFromStorage()).toBe(true);
  });

  it("persists and reads the active navigation key with a default fallback", () => {
    expect(readActiveNav()).toBe("home");

    persistActiveNav("calendar");
    expect(localStorage.getItem(ACTIVE_NAV_KEY)).toBe("calendar");
    expect(readActiveNav()).toBe("calendar");
  });

  it("marks and reads the welcome flag", () => {
    expect(hasSeenWelcome()).toBe(false);

    markWelcomeSeen();

    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBe("1");
    expect(hasSeenWelcome()).toBe(true);
  });

  it("clears auth-related storage keys", () => {
    localStorage.setItem("token", "secret");
    localStorage.setItem("user", JSON.stringify({ id: 7 }));
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
    localStorage.setItem(ACTIVE_NAV_KEY, "tasks");
    localStorage.setItem("banned", "1");

    clearAuthStorage();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem(WELCOME_SEEN_KEY)).toBeNull();
    expect(localStorage.getItem(ACTIVE_NAV_KEY)).toBeNull();
    expect(localStorage.getItem("banned")).toBe("1");
  });
});
