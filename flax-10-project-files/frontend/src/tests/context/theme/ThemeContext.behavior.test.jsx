/*
 * Tests for theme context persistence behaviour.
 */

import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateUserSettingsMock = vi.fn();

vi.mock("../../../api/client", () => ({
  fetchApi: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../../api/userApi", () => ({
  updateUserSettings: (...args) => updateUserSettingsMock(...args),
}));

import { ThemeProvider, useTheme } from "../../../context/ThemeContext";
import { THEME_GROUPS } from "../../../context/ThemeConstants";

async function importThemeContextWithSavedRef() {
  let refCalls = 0;
  vi.doMock("react", async () => {
    const actual = await vi.importActual("react");
    return {
      ...actual,
      useRef: (initialValue) => {
        const ref = actual.useRef(initialValue);
        refCalls += 1;
        if (refCalls === 3) ref.current = { mode: "light", theme: "flax" };
        return ref;
      },
    };
  });
  return import("../../../context/ThemeContext");
}

describe("ThemeContext coverage topups", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock("react");
  });

  it("exports theme groups and persists authenticated theme preferences", async () => {
    localStorage.setItem("token", "token-123");
    updateUserSettingsMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({});

    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(Array.isArray(THEME_GROUPS)).toBe(true);
    expect(THEME_GROUPS.length).toBeGreaterThan(0);

    await act(async () => {
      result.current.toggleMode();
      await Promise.resolve();
    });

    expect(updateUserSettingsMock).toHaveBeenCalled();
  });

  it("skips duplicate authenticated saves during strict-mode effect replays", async () => {
    localStorage.setItem("token", "token-123");
    updateUserSettingsMock.mockResolvedValue({});

    const wrapper = ({ children }) => (
      <React.StrictMode>
        <ThemeProvider>{children}</ThemeProvider>
      </React.StrictMode>
    );

    renderHook(() => useTheme(), { wrapper });

    await waitFor(() => expect(updateUserSettingsMock).toHaveBeenCalledTimes(1));
  });

  it("skips persistence when the current mode and theme were already saved", async () => {
    localStorage.setItem("token", "token-123");
    vi.resetModules();
    const themeModule = await importThemeContextWithSavedRef();
    const DynamicThemeProvider = themeModule.ThemeProvider;
    const dynamicUseTheme = themeModule.useTheme;
    const wrapper = ({ children }) => <DynamicThemeProvider>{children}</DynamicThemeProvider>;
    renderHook(() => dynamicUseTheme(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(updateUserSettingsMock).not.toHaveBeenCalled();
  });
});
