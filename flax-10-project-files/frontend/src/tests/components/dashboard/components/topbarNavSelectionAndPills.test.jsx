/*
 * Tests for Dashboard Topbar: handleNavSelection, parseRouteOption, ToolsPill, and ActionPill.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { useNotificationsMock } = vi.hoisted(() => ({
  useNotificationsMock: vi.fn(() => ({
    togglePanel: vi.fn(),
    notifications: [],
  })),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const rest = { ...props };
          delete rest.initial;
          delete rest.animate;
          delete rest.exit;
          delete rest.transition;
          delete rest.whileHover;
          delete rest.whileTap;
          const T = tag;
          return React.createElement(T, rest, children);
        },
    }
  ),
  AnimatePresence: ({ children }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("*.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

vi.mock("lucide-react", () => ({
  Bell: () => <span data-testid="icon-bell" />,
  BookOpen: () => <span data-testid="icon-book" />,
  ChevronDown: ({ className }) => (
    <span data-testid="icon-chevron" className={className} />
  ),
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  ClipboardCheck: () => <span data-testid="icon-clipboard" />,
}));

vi.mock("../../../../lib/routes", () => ({
  APP_ROUTES: [
    { id: "calendar", label: "Calendar", icon: "🗓️" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "modules", label: "Modules", teacherLabel: "Manage My Modules", icon: "📚" },
    { id: "attendance", label: "Attendance", icon: "✔️", studentOnly: true },
    { id: "admin", label: "Admin", icon: "🛡️", isAdminOnly: true },
    { id: "map", label: "UniMap", icon: "🗺️" },
    { id: "group-work", label: "Group Projects", icon: "🤝", studentOnly: true },
    { id: "timer", label: "Focus Timer", icon: "⏲️" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "societies", label: "Societies", icon: "👥", studentOnly: true },
    { id: "users", label: "Users", icon: "🔍" },
  ],
}));

vi.mock("../../../../components/dashboard/components/ProfileDropdown", () => ({
  default: () => <div data-testid="profile-dropdown" />,
}));

vi.mock("../../../../context/NotificationContext", () => ({
  useNotifications: useNotificationsMock,
}));

vi.mock("../../../../components/notifications/components/NotificationPanel", () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />,
}));

vi.mock("../../../../components/dashboard/components/ExpandableTabs", () => ({
  ExpandableTabs: ({ tabs = [], onChange }) => (
    <div data-testid="expandable-tabs">
      <button data-testid="notif-tab" onClick={() => onChange(0)}>
        {tabs[0]?.title}:{tabs[0]?.badge ?? 0}
      </button>
      <button data-testid="notif-tab-deselect" onClick={() => onChange(null)}>
        deselect
      </button>
    </div>
  ),
}));

vi.mock("../../../../components/dashboard/components/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

vi.mock("../../../../components/timer/components/MiniTimer", () => ({
  default: () => <div data-testid="mini-timer" />,
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ customTrigger, options, onChange, value, isOpen, onOpenChange }) => (
    <div data-testid="animated-dropdown">
      {React.isValidElement(customTrigger)
        ? React.cloneElement(customTrigger, {
            isOpen,
            onClick: () => onOpenChange?.(!isOpen),
          })
        : customTrigger}
      <button
        data-testid={`dropdown-close-${options[0]?.value || value || "menu"}`}
        onClick={() => onOpenChange?.(false)}
      >
        close
      </button>
      <div data-testid="dropdown-options">
        {options.map((opt, i) => (
          <button
            key={i}
            data-testid={`opt-${i}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.value}
          </button>
        ))}
      </div>
      <span data-testid="dropdown-value">{value}</span>
    </div>
  ),
}));

vi.mock("../../../../components/common", () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div data-testid="segmented-control">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-testid={`tool-${opt.value}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.title}
        </button>
      ))}
      <span data-testid="seg-value">{value}</span>
    </div>
  ),
}));

import TopBar from "../../../../components/dashboard/components/Topbar";

function renderTopBar(props = {}) {
  const defaults = {
    user: { id: 1, username: "alice", first_name: "Alice", last_name: "Smith", role: "student" },
    onSettingsClick: vi.fn(),
    onLogoutClick: vi.fn(),
    onProfileClick: vi.fn(),
    onNavChange: vi.fn(),
    activeNav: "calendar",
    ...props,
  };
  return render(<TopBar {...defaults} />);
}

beforeEach(() => {
  useNotificationsMock.mockReturnValue({
    togglePanel: vi.fn(),
    notifications: [],
  });
});

describe("handleNavSelection dispatches modules:show-all for modules", () => {
  let handler;

  beforeEach(() => {
    handler = vi.fn();
    window.addEventListener("modules:show-all", handler);
  });

  afterEach(() => {
    window.removeEventListener("modules:show-all", handler);
  });

  it("fires modules:show-all when modules option is selected in a dropdown", () => {
    const onNavChange = vi.fn();
    renderTopBar({ user: { role: "student" }, onNavChange, activeNav: "calendar" });

    const moduleButton = screen.getAllByTestId("animated-dropdown")
      .flatMap((dd) => Array.from(dd.querySelectorAll("[data-testid^='opt-']")))
      .find((btn) => btn.textContent === "modules");

    expect(moduleButton).toBeTruthy();
    fireEvent.click(moduleButton);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(onNavChange).toHaveBeenCalledWith("modules");
  });

  it("does not fire modules:show-all for non-modules routes", () => {
    const onNavChange = vi.fn();
    renderTopBar({ user: { role: "student" }, onNavChange });

    const calendarButton = screen.getAllByTestId("animated-dropdown")
      .flatMap((dd) => Array.from(dd.querySelectorAll("[data-testid^='opt-']")))
      .find((btn) => btn.textContent === "calendar");

    if (calendarButton) {
      fireEvent.click(calendarButton);
      expect(handler).not.toHaveBeenCalled();
      expect(onNavChange).toHaveBeenCalledWith("calendar");
    }
  });
});

describe("parseRouteOption teacher vs student labels via section titles", () => {
  it("shows Teaching section (not Study) for teacher users", () => {
    renderTopBar({ user: { role: "teacher" }, activeNav: "modules" });
    expect(screen.getByText("Teaching")).toBeInTheDocument();
    expect(screen.queryByText("Study")).not.toBeInTheDocument();
  });

  it("shows Study section (not Teaching) for student users", () => {
    renderTopBar({ user: { role: "student" }, activeNav: "calendar" });
    expect(screen.getByText("Study")).toBeInTheDocument();
    expect(screen.queryByText("Teaching")).not.toBeInTheDocument();
  });
});

describe("ToolsPill options", () => {
  it("uses student options when user.role is student", () => {
    renderTopBar({ user: { role: "student" }, activeNav: "attendance" });
    expect(screen.getByTestId("tool-attendance")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-modules")).not.toBeInTheDocument();
  });

  it("uses teacher options when user.role is teacher", () => {
    renderTopBar({ user: { role: "teacher" }, activeNav: "modules" });
    expect(screen.getByTestId("tool-modules")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-attendance")).not.toBeInTheDocument();
  });

  it("calls onNavChange when a tool is clicked", () => {
    const onNavChange = vi.fn();
    renderTopBar({ user: { role: "student" }, onNavChange });
    fireEvent.click(screen.getByTestId("tool-calendar"));
    expect(onNavChange).toHaveBeenCalledWith("calendar");
  });
});

describe("ActionPill and notifications", () => {
  it("dispatches the quick-actions event when the shortcut button is clicked", () => {
    const handler = vi.fn();
    window.addEventListener("quick-actions:open", handler);

    renderTopBar();
    fireEvent.click(screen.getByRole("button", { name: /quick actions/i }));

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("quick-actions:open", handler);
  });

  it("shows the unread badge and ignores null tab changes", () => {
    const togglePanel = vi.fn();
    useNotificationsMock.mockReturnValue({
      togglePanel,
      notifications: [{ read: false }, { read: true }],
    });

    renderTopBar();

    expect(screen.getByTestId("notif-tab")).toHaveTextContent("Notifications:1");

    fireEvent.click(screen.getByTestId("notif-tab-deselect"));
    expect(togglePanel).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("notif-tab"));
    expect(togglePanel).toHaveBeenCalledTimes(1);
  });
});
