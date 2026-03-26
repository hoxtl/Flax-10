import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const locationMock = { pathname: "/today" };
const useSyncNavFromUrlMock = vi.fn();
const useNavHandlerMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => locationMock,
  };
});

vi.mock("../../pages/banned/BannedPage", () => ({
  default: ({ reason }) => <div>{`Banned:${reason}`}</div>,
}));

vi.mock("../../app/components/AuthScreens", () => ({
  AuthScreen: () => <div>AuthScreen</div>,
}));

vi.mock("../../app/components/WelcomeScreen", () => ({
  WelcomeScreen: ({ user }) => <div>{`Welcome:${user?.name || "anon"}`}</div>,
}));

vi.mock("../../app/components/ScreenWrap", () => ({
  ScreenWrap: ({ children, animKey }) => <div data-testid={`screen-wrap-${animKey}`}>{children}</div>,
}));

vi.mock("../../app/components/AnimatedDashboardContent", () => ({
  AnimatedDashboardContent: ({ activeNav }) => <div>{`Animated:${activeNav}`}</div>,
}));

vi.mock("../../app/components/OnboardingWrapper", () => ({
  OnboardingWrapper: () => <div>OnboardingWrapper</div>,
}));

vi.mock("../../app/hooks/useSyncNavFromUrl", () => ({
  useSyncNavFromUrl: (...args) => useSyncNavFromUrlMock(...args),
}));

vi.mock("../../app/navigation/useNavHandler", () => ({
  useNavHandler: (...args) => useNavHandlerMock(...args),
}));

vi.mock("../../components/common/scroll_to_top/ScrollToTop", () => ({
  default: () => <div>ScrollToTop</div>,
}));

vi.mock("../../layout/DashboardLayout", () => ({
  default: ({ children, activeNav, user }) => <div>{`Layout:${activeNav}:${user?.name}`}{children}</div>,
}));

vi.mock("../../context/NotificationContext", () => ({
  NotificationProvider: ({ children }) => <div data-testid="notification-provider">{children}</div>,
}));

vi.mock("../../context/ConfirmContext", () => ({
  ConfirmProvider: ({ children }) => <div data-testid="confirm-provider">{children}</div>,
}));

vi.mock("../../context/ToastContext", () => ({
  ToastProvider: ({ children }) => <div data-testid="toast-provider">{children}</div>,
}));

vi.mock("../../context/CalendarContext", () => ({
  CalendarProvider: ({ children }) => <div data-testid="calendar-provider">{children}</div>,
}));

vi.mock("../../context/TagContext", () => ({
  TagProvider: ({ children }) => <div data-testid="tag-provider">{children}</div>,
}));

vi.mock("../../context/TimerContext", () => ({
  TimerProvider: ({ children }) => <div data-testid="timer-provider">{children}</div>,
}));

vi.mock("../../context/TaskCompletionContext", () => ({
  TaskCompletionProvider: ({ children }) => <div data-testid="task-completion-provider">{children}</div>,
}));

vi.mock("../../components/notifications", () => ({
  NotificationToast: () => <div>NotificationToast</div>,
}));

vi.mock("../../components/attendance/AttendancePrompt", () => ({
  default: () => <div>AttendancePrompt</div>,
}));

import { AppProviders } from "../../app/components/AppProviders";
import { AppScreen } from "../../app/components/AppScreen";
import { ScreenRouter } from "../../app/components/ScreenRouter";

describe("app components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavHandlerMock.mockReturnValue(vi.fn());
    localStorage.clear();
  });

  it("AppProviders nests the providers and renders shared overlays", () => {
    render(<AppProviders><div>AppChildren</div></AppProviders>);

    expect(screen.getByText("AppChildren")).toBeInTheDocument();
    expect(screen.getByText("NotificationToast")).toBeInTheDocument();
    expect(screen.getByText("AttendancePrompt")).toBeInTheDocument();
    expect(screen.getByTestId("notification-provider")).toBeInTheDocument();
    expect(screen.getByTestId("task-completion-provider")).toBeInTheDocument();
  });

  it("AppScreen syncs nav from the URL and renders dashboard content", () => {
    const setActiveNav = vi.fn();
    render(<AppScreen activeNav="home" setActiveNav={setActiveNav} user={{ name: "Ava" }} />);

    expect(useSyncNavFromUrlMock).toHaveBeenCalledWith("/today", setActiveNav);
    expect(useNavHandlerMock).toHaveBeenCalledWith(setActiveNav);
    expect(screen.getByText("Layout:home:Ava")).toBeInTheDocument();
    expect(screen.getByText("Animated:home")).toBeInTheDocument();
    expect(screen.getByText("OnboardingWrapper")).toBeInTheDocument();
  });

  it("ScreenRouter chooses banned, auth, welcome, and app screens", () => {
    localStorage.setItem("ban_reason", "policy");
    const state = { activeNav: "home", isBanned: true, setActiveNav: vi.fn(), setShowWelcome: vi.fn(), user: { name: "Ava" } };
    const { rerender } = render(<ScreenRouter screen="auth" state={state} />);

    expect(screen.getByText("Banned:policy")).toBeInTheDocument();

    rerender(<ScreenRouter screen="auth" state={{ ...state, isBanned: false }} />);
    expect(screen.getByText("AuthScreen")).toBeInTheDocument();

    rerender(<ScreenRouter screen="welcome" state={{ ...state, isBanned: false }} />);
    expect(screen.getByText("Welcome:Ava")).toBeInTheDocument();

    rerender(<ScreenRouter screen="dashboard" state={{ ...state, isBanned: false }} />);
    expect(screen.getByText("Layout:home:Ava")).toBeInTheDocument();
  });

  it("ScreenRouter falls back to an empty banned reason when none is stored", () => {
    localStorage.removeItem("ban_reason");
    render(
      <ScreenRouter
        screen="auth"
        state={{
          activeNav: "home",
          isBanned: true,
          setActiveNav: vi.fn(),
          setShowWelcome: vi.fn(),
          user: { name: "Ava" },
        }}
      />,
    );

    expect(screen.getByText("Banned:")).toBeInTheDocument();
  });
});
