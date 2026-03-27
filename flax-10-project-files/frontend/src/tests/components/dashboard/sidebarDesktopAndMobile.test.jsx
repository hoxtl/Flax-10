import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";

const { getUpcomingDeadlines } = vi.hoisted(() => ({
  getUpcomingDeadlines: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, { get: () => ({ children, ...props }) => React.createElement("div", props, children) }),
}));

vi.mock("../../../api/deadlineApi", () => ({
  getUpcomingDeadlines: (...args) => getUpcomingDeadlines(...args),
}));

vi.mock("../../../lib/routes", () => ({
  APP_ROUTES: [
    { id: "home", label: "Home", icon: "H", isAdminOnly: false },
    { id: "tasks", label: "Tasks", icon: "T", isAdminOnly: false },
    { id: "admin", label: "Admin", icon: "A", isAdminOnly: true },
  ],
}));

import SidebarDesktop from "../../../components/dashboard/sidebar/SidebarDesktop";
import SidebarMobile from "../../../components/dashboard/sidebar/SidebarMobile";
import useDeadlinePressure from "../../../components/dashboard/sidebar/useDeadlinePressure";
import {
  getDeadlineTime,
  getSidebarRoutes,
  hasDeadlineWithin48Hours,
} from "../../../components/dashboard/sidebar/sidebarUtils";

describe("Dashboard sidebar extras", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T10:00:00Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("covers sidebar route and deadline utility branches", () => {
    expect(getSidebarRoutes({ isAdmin: false }).map((item) => item.id)).toEqual(["home", "tasks"]);
    expect(getSidebarRoutes({ isAdmin: true }).map((item) => item.id)).toEqual(["home", "tasks", "admin"]);
    expect(Number.isNaN(getDeadlineTime({}))).toBe(true);
    expect(hasDeadlineWithin48Hours(null)).toBe(false);
    expect(hasDeadlineWithin48Hours([])).toBe(false);
    expect(hasDeadlineWithin48Hours({})).toBe(false);
    expect(hasDeadlineWithin48Hours([{ start_due_date: "2026-03-24T12:00:00Z" }])).toBe(true);
    expect(hasDeadlineWithin48Hours([{ start_due_date: "2026-03-28T12:00:00Z" }])).toBe(false);
    expect(hasDeadlineWithin48Hours([{ start_due_date: "nope" }])).toBe(false);
  });

  it("polls deadline pressure and falls back to false on errors", async () => {
    getUpcomingDeadlines
      .mockResolvedValueOnce([{ start_due_date: "2026-03-24T12:00:00Z" }])
      .mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useDeadlinePressure());

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });
    expect(result.current).toBe(false);
  });

  it("treats non-array deadline payloads as no pressure", async () => {
    getUpcomingDeadlines.mockResolvedValueOnce({ results: [] });

    const { result } = renderHook(() => useDeadlinePressure());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe(false);
  });

  it("renders desktop sidebar navigation and hover styling", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SidebarDesktop
        active="tasks"
        onChange={onChange}
        user={{ name: "Alice", email: "alice@example.com", isAdmin: true }}
      />,
    );
    fireEvent.mouseEnter(container.firstChild);
    fireEvent.click(screen.getByText("Tasks"));
    expect(onChange).toHaveBeenCalledWith("tasks");
    fireEvent.mouseLeave(container.firstChild);
    expect(container.textContent).not.toContain("alice@example.com");
  });

  it("handles desktop sidebar user menu actions", () => {
    const onSettingsClick = vi.fn();
    const onLogoutClick = vi.fn();
    const { container } = render(
      <SidebarDesktop
        active="home"
        onChange={vi.fn()}
        user={{ name: "Alice", email: "a@a.com" }}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
      />,
    );
    fireEvent.mouseEnter(container.firstChild);
    fireEvent.click(screen.getByText("Alice"));
    expect(screen.getByText("Profile")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Settings"));
    fireEvent.click(screen.getByText("Log out"));
    expect(onSettingsClick).toHaveBeenCalled();
    expect(onLogoutClick).toHaveBeenCalled();
  });

  it("handles desktop sidebar profile click action", () => {
    const onProfileClick = vi.fn();
    const { container } = render(
      <SidebarDesktop active="home" onChange={vi.fn()} user={{ name: "Alice" }} onProfileClick={onProfileClick} />,
    );
    fireEvent.mouseEnter(container.firstChild);
    fireEvent.click(screen.getByText("Alice"));
    fireEvent.click(screen.getByText("Profile"));
    expect(onProfileClick).toHaveBeenCalled();
  });

  it("falls back to a default avatar label when the user has no name", () => {
    render(
      <SidebarDesktop
        active="home"
        onChange={vi.fn()}
        user={{}}
      />,
    );

    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("handles mobile drawer navigation and toggling", () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();
    render(<SidebarMobile isOpen onToggle={onToggle} active="home" onChange={onChange} user={{ isAdmin: false }} />);
    fireEvent.click(screen.getAllByText("Tasks")[0]);
    expect(onChange).toHaveBeenCalledWith("tasks");
    fireEvent.click(screen.getByLabelText("Close menu"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("handles mobile footer actions and closes on click", () => {
    const onToggle = vi.fn();
    const onSettingsClick = vi.fn();
    render(<SidebarMobile isOpen onToggle={onToggle} user={{ isAdmin: false }} onSettingsClick={onSettingsClick} />);
    fireEvent.click(screen.getByText("Settings"));
    expect(onSettingsClick).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Profile"));
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("fires bottom-bar navigation clicks when the drawer is closed", () => {
    const onToggle = vi.fn();
    const onChange = vi.fn();

    render(
      <SidebarMobile
        isOpen={false}
        onToggle={onToggle}
        user={{ isAdmin: false }}
        active="home"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByText("Tasks"));
    expect(onChange).toHaveBeenCalledWith("tasks");
  });
});
