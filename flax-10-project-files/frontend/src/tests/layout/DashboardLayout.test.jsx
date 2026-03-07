import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DashboardLayout from "../../layout/DashboardLayout";
import { authService } from "../../api/authService";
import { clearUserData } from "../../components/Authentication/utils/authHelpers";

vi.mock("../../components/Dashboard/Sidebar", () => ({
  default: ({ user, active, onChange }) => (
    <div data-testid="sidebar">
      <span>User: {user.name}</span>
      <button onClick={() => onChange("settings")}>Nav to Settings</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/Topbar", () => ({
  default: ({ onLogoutClick }) => (
    <div data-testid="topbar">
      <button onClick={onLogoutClick}>Logout</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/WeekBar", () => ({
  default: () => <div data-testid="weekbar" />,
}));

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: () => ({ selectedDate: new Date() }),
  useEventModal: () => ({ modal: { isModalOpen: false } }),
}));

vi.mock("../../api/authService", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/" }),
}));

const mockStore = {};
global.localStorage = {
  setItem: (key, val) => { mockStore[key] = val.toString(); },
  getItem: (key) => mockStore[key] || null,
  removeItem: (key) => { delete mockStore[key]; },
};

describe("DashboardLayout", () => {
  const mockUser = {
    name: "John Doe",
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

  it("renders Desktop view with Topbar and content", () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  it("handles logout flow", async () => {
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Logout"));
    expect(authService.logout).toHaveBeenCalled();
    await waitFor(() => {
      expect(clearUserData).toHaveBeenCalled();
    });
  });

  it("shows sidebar on mobile", () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    render(<DashboardLayout activeNav="home" onNavChange={() => {}}>Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
    expect(screen.getByText("User: John Doe")).toBeTruthy();
  });

  it("applies specific styles for the Map page", () => {
    const { container } = render(
      <DashboardLayout activeNav="map" onNavChange={() => {}}>Map</DashboardLayout>,
    );
    const content = container.querySelector('[class*="content"]');
    expect(content).toBeTruthy();
  });
});
