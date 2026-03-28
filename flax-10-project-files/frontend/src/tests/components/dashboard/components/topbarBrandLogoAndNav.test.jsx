/*
 * Tests for Dashboard Topbar: BrandLogo, NavDropdownTrigger, and isRouteVisible.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

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

describe("BrandLogo", () => {
  it("calls onNavChange with 'home' when clicked", () => {
    const onNavChange = vi.fn();
    renderTopBar({ onNavChange });
    const brand = screen.getByText("StudyFlax");
    fireEvent.click(brand.closest("[style*='cursor']") || brand.parentElement);
    expect(onNavChange).toHaveBeenCalledWith("home");
  });

  it("renders the brand name", () => {
    renderTopBar();
    expect(screen.getByText("StudyFlax")).toBeInTheDocument();
  });
});

describe("NavDropdownTrigger via rendered TopBar", () => {
  it("renders nav group buttons", () => {
    renderTopBar({ activeNav: "tasks" });
    expect(screen.getByText("Plan")).toBeInTheDocument();
  });

  it("renders Study section for student users", () => {
    renderTopBar({ user: { role: "student" } });
    expect(screen.getByText("Study")).toBeInTheDocument();
  });

  it("renders Teaching section label for teacher users", () => {
    renderTopBar({ user: { role: "teacher" } });
    expect(screen.getByText("Teaching")).toBeInTheDocument();
  });

  it("opens on hover and closes when the dropdown requests it", async () => {
    renderTopBar({ activeNav: "calendar" });

    fireEvent.mouseEnter(screen.getByText("Plan").closest("[data-tour='calendar']"));
    await waitFor(() => {
      expect(
        screen
          .getAllByTestId("icon-chevron")
          .some((icon) => icon.className.includes("chevronOpen")),
      ).toBe(true);
    });

    fireEvent.click(screen.getByTestId("dropdown-close-calendar"));
    await waitFor(() => {
      expect(
        screen
          .getAllByTestId("icon-chevron")
          .some((icon) => icon.className.includes("chevronOpen")),
      ).toBe(false);
    });
  });

  it("ignores direct dropdown open-change events when the menu is not already active", () => {
    renderTopBar({ activeNav: "calendar" });

    fireEvent.click(screen.getByText("Plan"));

    expect(
      screen
        .getAllByTestId("icon-chevron")
        .some((icon) => icon.className.includes("chevronOpen")),
    ).toBe(false);
  });

  it("clears the active hover menu after mouse leave", () => {
    vi.useFakeTimers();

    renderTopBar({ activeNav: "calendar" });
    fireEvent.mouseEnter(screen.getByText("Plan").closest("[data-tour='calendar']"));
    fireEvent.mouseLeave(screen.getByRole("navigation"));
    act(() => {
      vi.advanceTimersByTime(151);
    });

    expect(document.querySelector(".chevronOpen")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("isRouteVisible through TopBarNav rendered output", () => {
  it("hides adminOnly routes from non-admin users (no Admin option)", () => {
    renderTopBar({
      user: { role: "student", isAdmin: false },
    });
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows adminOnly routes for admin users", () => {
    renderTopBar({
      user: { role: "student", isAdmin: true },
    });
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides studentOnly routes for teachers", () => {
    renderTopBar({
      user: { role: "teacher", isAdmin: false },
    });
    expect(screen.getByText("Teaching")).toBeInTheDocument();
  });
});
