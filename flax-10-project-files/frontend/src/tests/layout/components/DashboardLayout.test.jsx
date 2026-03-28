import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  mockUser,
  prepareDashboardLayoutTest,
  renderDashboardLayout,
  setDashboardLayoutViewport,
} from "./dashboardLayoutTestUtils";

beforeEach(async () => {
  await prepareDashboardLayoutTest();
});

describe("DashboardLayout", () => {
  it("renders Desktop view with Topbar and content", () => {
    renderDashboardLayout();
    expect(screen.getByTestId("topbar")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("renders FloatingChat", () => {
    renderDashboardLayout();
    expect(screen.getByTestId("floating-chat")).toBeTruthy();
  });

  it("does not render BackToTop for home page", () => {
    renderDashboardLayout();
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on map page", () => {
    renderDashboardLayout({ activeNav: "map", children: "Map" });
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on modules page", () => {
    renderDashboardLayout({ activeNav: "modules", children: "Modules" });
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("does not render BackToTop on tasks page", () => {
    renderDashboardLayout({ activeNav: "tasks", children: "Tasks" });
    expect(screen.queryByTestId("back-to-top")).toBeNull();
  });

  it("handles logout flow", async () => {
    const { authService } = await import("../../../api/authApi");
    const { clearUserData } = await import("../../../components/Auth/utils/authHelpers");
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Logout"));
    expect(authService.logout).toHaveBeenCalled();
    await waitFor(() => {
      expect(clearUserData).toHaveBeenCalled();
    });
  });

  it("navigates to settings when Settings clicked", () => {
    const onNavChange = vi.fn();
    renderDashboardLayout({ onNavChange });
    fireEvent.click(screen.getByText("Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("navigates to profile when Profile clicked", () => {
    const onNavChange = vi.fn();
    renderDashboardLayout({ onNavChange });
    fireEvent.click(screen.getByText("Profile"));
    expect(onNavChange).toHaveBeenCalledWith("profile");
  });

  it("Topbar Nav Other calls onNavChange", () => {
    const onNavChange = vi.fn();
    renderDashboardLayout({ onNavChange });
    fireEvent.click(screen.getByText("Nav Other"));
    expect(onNavChange).toHaveBeenCalledWith("other");
  });

  it("handles undefined onNavChange without throwing", () => {
    renderDashboardLayout({ onNavChange: undefined });
    fireEvent.click(screen.getByText("Settings"));
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Close Quick Add"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("parseStoredUser sets isAdmin from is_superuser", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, is_superuser: true }));
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows sidebar on mobile", () => {
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("User: John Doe")).toBeTruthy();
  });

  it("useIsMobile resize listener updates isMobile when window is resized", async () => {
    setDashboardLayoutViewport(1000);
    renderDashboardLayout();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar")).toBeNull();
    setDashboardLayoutViewport(500);
    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.queryByTestId("topbar")).toBeNull();
    });
  });

  it("sidebar Settings and Profile call handleNavChange on mobile", () => {
    setDashboardLayoutViewport(500);
    const onNavChange = vi.fn();
    renderDashboardLayout({ onNavChange });
    fireEvent.click(screen.getByText("Sidebar Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
    fireEvent.click(screen.getByText("Sidebar Profile"));
    expect(onNavChange).toHaveBeenCalledWith("profile");
  });

  it("sidebar Logout on mobile triggers handleLogoutClick", async () => {
    setDashboardLayoutViewport(500);
    const { authService } = await import("../../../api/authApi");
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Sidebar Logout"));
    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
  });

  it("sidebar Toggle on mobile toggles mobileSidebarOpen", () => {
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Toggle Sidebar"));
    fireEvent.click(screen.getByText("Toggle Sidebar"));
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("applies specific styles for the Map page", () => {
    const { container } = renderDashboardLayout({ activeNav: "map", children: "Map" });
    expect(container.querySelector('[class*="content"]')).toBeTruthy();
  });

  it("opens QuickAdd modal when add button clicked", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("quick-add-modal")).toBeTruthy();
  });

  it("closes QuickAdd modal when Close is clicked", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Close Quick Add"));
    expect(screen.queryByTestId("quick-add-modal")).toBeNull();
  });

  it("opens CreateTask modal from QuickAdd", () => {
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Task"));
    expect(screen.getByTestId("create-task-modal")).toBeTruthy();
  });

  it("opens CreateTask modal from QuickCommandBar", () => {
    renderDashboardLayout();
    act(() => {
      window.dispatchEvent(new Event("quick-actions:open"));
    });
    fireEvent.click(screen.getByRole("button", { name: /add taskopen quick task modal/i }));
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });

  it("does not show Topbar on mobile", () => {
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.queryByTestId("topbar")).toBeNull();
  });

  it("uses username when first_name or last_name missing (parseStoredUser)", () => {
    localStorage.setItem("user", JSON.stringify({ username: "alice", email: "a@b.com" }));
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByText("User: alice")).toBeInTheDocument();
  });

  it("parseStoredUser uses username when only first_name present (falsy last_name branch)", () => {
    localStorage.setItem("user", JSON.stringify({ username: "bob", first_name: "Bob", email: "b@b.com" }));
    setDashboardLayoutViewport(500);
    renderDashboardLayout();
    expect(screen.getByText("User: bob")).toBeInTheDocument();
  });

  it("getUser returns undefined when no user in localStorage", () => {
    localStorage.removeItem("user");
    renderDashboardLayout();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
  });

  it("getUser handles invalid JSON in localStorage", () => {
    localStorage.setItem("user", "{ invalid json");
    renderDashboardLayout();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
  });

  it("handleLogoutClick clears user data even when logout throws", async () => {
    const { authService } = await import("../../../api/authApi");
    const { clearUserData } = await import("../../../components/Auth/utils/authHelpers");
    authService.logout.mockRejectedValueOnce(new Error("network error"));
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(clearUserData).toHaveBeenCalled());
  });

  it("applies tasks page style when activeNav is tasks", () => {
    const { container } = renderDashboardLayout({ activeNav: "tasks", children: "Tasks" });
    expect(container.querySelector('[class*="content"]')).toBeTruthy();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("shows WeekBar on calendar when not mobile", async () => {
    const { useLocation } = await import("react-router-dom");
    useLocation.mockReturnValue({ pathname: "/calendar", search: "", hash: "", state: null, key: "default" });
    renderDashboardLayout({ activeNav: "calendar", children: "Calendar" });
    expect(screen.getByTestId("weekbar")).toBeInTheDocument();
  });

  it("shows WeekBar when pathname starts with /calendar even if activeNav is not calendar", async () => {
    const { useLocation } = await import("react-router-dom");
    useLocation.mockReturnValue({ pathname: "/calendar/2024/01", search: "", hash: "", state: null, key: "default" });
    renderDashboardLayout();
    expect(screen.getByTestId("weekbar")).toBeInTheDocument();
  });

  it("passes isTeacher to QuickAdd when user role is teacher", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, role: "teacher" }));
    renderDashboardLayout();
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("quick-add-modal")).toBeInTheDocument();
  });

  it("onSelectType create_module calls onNavChange with modules_create", () => {
    const onNavChange = vi.fn();
    renderDashboardLayout({ onNavChange });
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Add Module"));
    expect(onNavChange).toHaveBeenCalledWith("modules_create");
  });

  it("opens QuickAdd modal and falls back to the main chooser for legacy scheduler events", () => {
    renderDashboardLayout();
    act(() => {
      window.dispatchEvent(new CustomEvent("quick-add:open", { detail: { view: "schedule_auto" } }));
    });
    expect(screen.getByTestId("quick-add-modal")).toBeTruthy();
    expect(screen.getByTestId("quick-add-initial-view")).toHaveTextContent("schedule_auto");
    expect(screen.getByText("Quick Add")).toBeInTheDocument();
  });

  it("defaults quick-add listener events without a detail payload to the type chooser", () => {
    renderDashboardLayout();
    act(() => {
      window.dispatchEvent(new CustomEvent("quick-add:open"));
    });
    expect(screen.getByTestId("quick-add-initial-view")).toHaveTextContent("type");
  });
});
