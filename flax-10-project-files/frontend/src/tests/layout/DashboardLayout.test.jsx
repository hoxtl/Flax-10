import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardLayout from "../../layout/DashboardLayout";
import { authService } from "../../api/authService";
import { clearUserData } from "../../utils/authHelpers";

vi.mock("../../components/Sidebar", () => ({
  default: ({ user, active, onChange }) => (
    <div data-testid="sidebar">
      <span>User: {user.name}</span>
      <button onClick={() => onChange("settings")}>Nav to Settings</button>
    </div>
  ),
}));

vi.mock("../../components/Topbar", () => ({
  default: ({ onAddClick, onLogoutClick }) => (
    <div data-testid="topbar">
      <button onClick={onAddClick}>Quick Add</button>
      <button onClick={onLogoutClick}>Logout</button>
    </div>
  ),
}));

vi.mock("../../components/WeekBar", () => ({
  default: () => <div data-testid="weekbar" />,
}));
vi.mock("../../components/QuickAddModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="quick-add">
      Modal <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: () => ({ selectedDate: new Date() }),
  useEventModal: () => ({ modal: { isModalOpen: false } }),
}));

vi.mock("../../api/authService", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../utils/authHelpers", () => ({ clearUserData: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/" }),
}));

describe("DashboardLayout", () => {
  const mockUser = {
    first_name: "John",
    last_name: "Doe",
    username: "jdoe",
    email: "j@d.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("user", JSON.stringify(mockUser));
    // Reset window width to desktop by default
    global.innerWidth = 1024;
    global.dispatchEvent(new Event("resize"));
  });

  it("renders Desktop view with Sidebar and Topbar", () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByTestId("topbar")).toBeTruthy();
    expect(screen.getByText("User: John Doe")).toBeTruthy();
  });

  it("toggles Quick Add modal", () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    expect(screen.getByTestId("quick-add")).toBeTruthy();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("quick-add")).toBeNull();
  });

  it("handles logout flow", async () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Logout"));
    expect(authService.logout).toHaveBeenCalled();
    expect(clearUserData).toHaveBeenCalled();
  });

  it("shows mobile drawer when toggled on small screens", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));

    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    // Sidebar should be hidden initially on mobile
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("applies specific styles for the Map page", () => {
    const { container } = render(
      <DashboardLayout activeNav="map">Map</DashboardLayout>,
    );
    const content = container.querySelector('[class*="content"]');
    expect(content.style.height).toBe("100%");
  });
});
