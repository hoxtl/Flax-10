import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const navigate = vi.fn();
const markWelcomeSeen = vi.fn();
const clearAuthStorage = vi.fn();

vi.mock("../../lib/routes", () => ({
  APP_ROUTES: [
    { id: "home", path: "/", element: "HOME" },
    { id: "modules", path: "/modules", element: <div data-testid="modules-page" existing="yes" /> },
    { id: "tasks", path: "/tasks", element: <div data-testid="tasks-page" /> },
  ],
}));

vi.mock("../../app/storage", () => ({
  markWelcomeSeen: (...args) => markWelcomeSeen(...args),
  clearAuthStorage: (...args) => clearAuthStorage(...args),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

import {
  onBackToAuth,
  onExplore,
  resolveRouteContent,
  resolveScreen,
} from "../../app/navigation/helpers";
import { useNavHandler } from "../../app/navigation/useNavHandler";

describe("navigation helpers", () => {
  beforeEach(() => {
    navigate.mockReset();
    markWelcomeSeen.mockReset();
    clearAuthStorage.mockReset();
  });

  it("resolves the correct dashboard screen", () => {
    expect(resolveScreen(false, { id: 1 }, false)).toBe("auth");
    expect(resolveScreen(true, null, false)).toBe("auth");
    expect(resolveScreen(true, { id: 1 }, true)).toBe("welcome");
    expect(resolveScreen(true, { id: 1 }, false)).toBe("app");
  });

  it("resolves route content and injects route props for object elements", () => {
    const setActiveNav = vi.fn();
    const user = { id: 9, name: "Ava" };

    expect(resolveRouteContent("home", user, setActiveNav)).toBe("HOME");

    const createRoute = resolveRouteContent("modules_create", user, setActiveNav);
    expect(createRoute.props.user).toEqual(user);
    expect(createRoute.props.onNavChange).toBe(setActiveNav);
    expect(createRoute.props.onBack).toBeInstanceOf(Function);
    expect(createRoute.props.initialCreate).toBe(true);
    expect(createRoute.props.existing).toBe("yes");

    const searchRoute = resolveRouteContent("modules_biology", user, setActiveNav);
    expect(searchRoute.props.initialSearch).toBe("biology");
  });

  it("marks welcome as seen and clears auth state", () => {
    const setShowWelcome = vi.fn();
    const setActiveNav = vi.fn();
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    onExplore(setShowWelcome, setActiveNav);
    expect(markWelcomeSeen).toHaveBeenCalledTimes(1);
    expect(setShowWelcome).toHaveBeenCalledWith(false);
    expect(setActiveNav).toHaveBeenCalledWith("home");

    onBackToAuth();
    expect(clearAuthStorage).toHaveBeenCalledTimes(1);
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
    dispatchEventSpy.mockRestore();
  });
});

describe("useNavHandler", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("handles every supported navigation shape", () => {
    const setActiveNav = vi.fn();
    const { result } = renderHook(() => useNavHandler(setActiveNav));

    act(() => result.current("societies_17_events"));
    expect(setActiveNav).toHaveBeenLastCalledWith("societies");
    expect(navigate).toHaveBeenLastCalledWith("/societies?id=17&tab=events");

    act(() => result.current("group-work_31_board"));
    expect(navigate).toHaveBeenLastCalledWith("/group-work?project=31&tab=board");

    act(() => result.current("profile"));
    expect(setActiveNav).toHaveBeenLastCalledWith("profile");
    expect(navigate).toHaveBeenLastCalledWith("/profile");

    act(() => result.current("profile_42"));
    expect(setActiveNav).toHaveBeenLastCalledWith("profile_42");
    expect(navigate).toHaveBeenLastCalledWith("/profile/42");

    act(() => result.current("settings"));
    expect(setActiveNav).toHaveBeenLastCalledWith("settings");
    expect(navigate).toHaveBeenLastCalledWith("/settings");

    act(() => result.current("/calendar?view=month"));
    expect(navigate).toHaveBeenLastCalledWith("/calendar?view=month");

    act(() => result.current("modules?filter=active"));
    expect(setActiveNav).toHaveBeenLastCalledWith("modules");
    expect(navigate).toHaveBeenLastCalledWith("/modules?filter=active");

    act(() => result.current("unmatched-destination"));
    expect(setActiveNav).toHaveBeenLastCalledWith("unmatched-destination");
  });

  it("subscribes to window navigate events and cleans up on unmount", () => {
    const setActiveNav = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useNavHandler(setActiveNav));

    act(() => {
      window.dispatchEvent(new CustomEvent("navigate", { detail: "tasks" }));
    });
    expect(setActiveNav).toHaveBeenCalledWith("tasks");
    expect(navigate).toHaveBeenCalledWith("/tasks");
    expect(addEventListenerSpy).toHaveBeenCalledWith("navigate", expect.any(Function));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("navigate", expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
