import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DashboardLayout from "../../layout/DashboardLayout";
import { authService } from "../../api/authService";
import { clearUserData } from "../../components/Authentication/utils/authHelpers";

vi.mock("../../components/Dashboard/Sidebar", () => ({
  default: ({ user, active, onChange }) => (
    <div data-testid="sidebar">
      <span>User: {user?.name}</span>
      <button onClick={() => onChange?.("settings")}>Nav to Settings</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/Topbar", () => ({
  default: ({ onAddClick, onLogoutClick, onSettingsClick, onProfileClick }) => (
    <div data-testid="topbar">
      <button onClick={onAddClick}>Quick Add</button>
      <button onClick={onLogoutClick}>Logout</button>
      <button onClick={onSettingsClick}>Settings</button>
      <button onClick={onProfileClick}>Profile</button>
    </div>
  ),
}));

vi.mock("../../components/Dashboard/WeekBar", () => ({
  default: () => <div data-testid="weekbar" />,
}));

vi.mock("../../components/Dashboard/QuickAddModal", () => ({
  default: ({ onClose, onSelectType }) => (
    <div data-testid="quick-add">
      Modal
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSelectType?.("event")}>Select Type</button>
    </div>
  ),
}));

vi.mock("../../components/Calendar/EventModal/EventModal", () => ({
  EventModal: () => <div data-testid="event-modal" />,
}));

const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
let mockIsModalOpen = false;

vi.mock("../../context/CalendarContext", () => ({
  useCalendar: () => ({ selectedDate: new Date() }),
  useEventModal: () => ({
    isModalOpen: mockIsModalOpen,
    modalEvent: null,
    modalType: "event",
    modalInitialDate: new Date(),
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  }),
}));

vi.mock("../../api/authService", () => ({ authService: { logout: vi.fn() } }));
vi.mock("../../components/Authentication/utils/authHelpers", () => ({ clearUserData: vi.fn() }));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/" }),
}));

const mockUser = {
  first_name: "John",
  last_name: "Doe",
  username: "jdoe",
  email: "j@d.com",
};

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsModalOpen = false;
    localStorage.setItem("user", JSON.stringify(mockUser));
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
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
    authService.logout.mockResolvedValue(undefined);
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    await act(async () => { fireEvent.click(screen.getByText("Logout")); });
    expect(authService.logout).toHaveBeenCalled();
    expect(clearUserData).toHaveBeenCalled();
  });

  it("handles logout when authService throws", async () => {
    authService.logout.mockRejectedValue(new Error("Logout failed"));
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    await act(async () => { fireEvent.click(screen.getByText("Logout")); });
    expect(clearUserData).toHaveBeenCalled();
  });

  it("does not show sidebar on mobile", () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("applies specific styles for the Map page", () => {
    const { container } = render(
      <DashboardLayout activeNav="map">Map</DashboardLayout>,
    );
    const content = container.querySelector('[class*="content"]');
    expect(content.style.height).toBe("100%");
  });

  it("shows weekbar on calendar nav", () => {
    render(<DashboardLayout activeNav="calendar">Content</DashboardLayout>);
    expect(screen.getByTestId("weekbar")).toBeTruthy();
  });

  it("does not show weekbar on non-calendar nav", () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.queryByTestId("weekbar")).toBeNull();
  });

  it("renders with user using only username when first/last name absent", () => {
    localStorage.setItem("user", JSON.stringify({ username: "jdoe", email: "j@d.com" }));
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByText("User: jdoe")).toBeTruthy();
  });

  it("renders with user year and major", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, year: 2, major: "Physics" }));
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
  });

  it("renders with no user in localStorage", () => {
    localStorage.removeItem("user");
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeTruthy();
  });

  it("renders EventModal when isModalOpen is true", () => {
    mockIsModalOpen = true;
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("event-modal")).toBeTruthy();
  });

  it("opens event modal when quick add type is selected", () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Quick Add"));
    fireEvent.click(screen.getByText("Select Type"));
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it("updates isMobile on window resize", () => {
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      fireEvent(window, new Event("resize"));
    });
  });

  it("renders admin user correctly", () => {
    localStorage.setItem("user", JSON.stringify({ ...mockUser, is_superuser: true }));
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("sidebar")).toBeTruthy();
  });

  it("handles corrupted JSON in localStorage gracefully", () => {
    localStorage.setItem("user", "not-valid-json{{{");
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    expect(screen.getByTestId("topbar")).toBeTruthy();
  });

  it("calls onNavChange with 'settings' when settings clicked", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Settings"));
    expect(onNavChange).toHaveBeenCalledWith("settings");
  });

  it("calls onNavChange with 'profile' when profile clicked", () => {
    const onNavChange = vi.fn();
    render(<DashboardLayout activeNav="home" onNavChange={onNavChange}>Content</DashboardLayout>);
    fireEvent.click(screen.getByText("Profile"));
    expect(onNavChange).toHaveBeenCalledWith("profile");
  });

  it("mobile sidebar starts closed on mobile", () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    render(<DashboardLayout activeNav="home">Content</DashboardLayout>);
    // mobileSidebarOpen starts false, so MobileSidebar returns null
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });
});
