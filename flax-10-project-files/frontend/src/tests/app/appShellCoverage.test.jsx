import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const useAppStateMock = vi.fn();
const resolveScreenMock = vi.fn();
const useTourCheckMock = vi.fn();
const useSyncNavFromUrlMock = vi.fn();
const useNavHandlerMock = vi.fn();
const useOnboardingCheckMock = vi.fn();
const onExploreMock = vi.fn();
const onBackToAuthMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const Component = typeof tag === "string" ? tag : "div";
          const rest = { ...props };
          delete rest.animate;
          delete rest.exit;
          delete rest.initial;
          delete rest.transition;
          delete rest.variants;
          delete rest.whileHover;
          delete rest.whileTap;
          return <Component {...rest}>{children}</Component>;
        },
    },
  ),
}));

vi.mock("../../context/AuthContext", () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
}));

vi.mock("../../context/ThemeContext", () => ({
  ThemeProvider: ({ children, initialTheme, initialMode }) => (
    <div data-testid="theme-provider" data-theme={initialTheme} data-mode={initialMode}>
      {children}
    </div>
  ),
}));

vi.mock("../../app/hooks/useAppState", () => ({
  useAppState: () => useAppStateMock(),
}));

vi.mock("../../app/navigation/helpers", async () => {
  const actual = await vi.importActual("../../app/navigation/helpers");
  return {
    ...actual,
    resolveScreen: (...args) => resolveScreenMock(...args),
    onExplore: (...args) => onExploreMock(...args),
    onBackToAuth: (...args) => onBackToAuthMock(...args),
  };
});

vi.mock("../../app/hooks/useTourCheck", () => ({
  useTourCheck: () => useTourCheckMock(),
}));

vi.mock("../../app/hooks/useSyncNavFromUrl", () => ({
  useSyncNavFromUrl: (...args) => useSyncNavFromUrlMock(...args),
}));

vi.mock("../../app/navigation/useNavHandler", () => ({
  useNavHandler: (...args) => useNavHandlerMock(...args),
}));

vi.mock("../../app/hooks/useOnboardingCheck", () => ({
  useOnboardingCheck: () => useOnboardingCheckMock(),
}));

vi.mock("../../app/components/ScreenRouter", () => ({
  ScreenRouter: ({ screen, state }) => <div>{`screen:${screen}:${state.activeNav}`}</div>,
}));

vi.mock("../../app/components/DashboardContent", () => ({
  DashboardContent: ({ activeNav, onNavChange }) => (
    <button type="button" onClick={() => onNavChange?.("tasks")}>
      {`dashboard:${activeNav}`}
    </button>
  ),
}));

vi.mock("../../pages/welcome/WelcomeLanding", () => ({
  default: ({ user, onExplore, onBackToAuth }) => (
    <div>
      <span>{`welcome:${user?.name || "anon"}`}</span>
      <button type="button" onClick={onExplore}>
        Explore
      </button>
      <button type="button" onClick={onBackToAuth}>
        Back
      </button>
    </div>
  ),
}));

vi.mock("../../pages/auth/AuthPage", () => ({
  default: ({ initialSignIn = true }) => (
    <div>{initialSignIn ? "auth:signin" : "auth:signup"}</div>
  ),
}));

vi.mock("../../pages/auth/PasswordResetRequest", () => ({
  default: () => <div>auth:reset-request</div>,
}));

vi.mock("../../pages/auth/PasswordResetConfirm", () => ({
  default: () => <div>auth:reset-confirm</div>,
}));

vi.mock("../../layout/DashboardLayout", () => ({
  default: ({ children, activeNav, user }) => (
    <div>{`layout:${activeNav}:${user?.name || "anon"}`}{children}</div>
  ),
}));

vi.mock("../../components/common/scroll_to_top/ScrollToTop", () => ({
  default: () => <div>scroll-top</div>,
}));

vi.mock("../../app/components/AppProviders", () => ({
  AppProviders: ({ children }) => <div data-testid="providers">{children}</div>,
}));

vi.mock("../../components/common/AppTour/AppTour", () => ({
  default: ({ onDone }) => (
    <button type="button" onClick={onDone}>
      AppTour
    </button>
  ),
}));

vi.mock("../../components/onboarding/components/OnboardingModal", () => ({
  default: ({ isOpen, onComplete }) =>
    isOpen ? (
      <button type="button" onClick={onComplete}>
        Finish onboarding
      </button>
    ) : (
      <div>onboarding-hidden</div>
    ),
}));

import App from "../../App";
import { AnimatedDashboardContent } from "../../app/components/AnimatedDashboardContent";
import { AppScreen } from "../../app/components/AppScreen";
import { AuthScreen } from "../../app/components/AuthScreens";
import { OnboardingWrapper } from "../../app/components/OnboardingWrapper";
import { ScreenWrap } from "../../app/components/ScreenWrap";
import { WelcomeScreen } from "../../app/components/WelcomeScreen";

describe("app shell coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavHandlerMock.mockReturnValue(vi.fn());
    useAppStateMock.mockReturnValue({
      activeNav: "home",
      authed: true,
      initialMode: "dark",
      initialTheme: "ocean",
      isLoadingTheme: false,
      isBanned: false,
      profile: { major: "CS" },
      setActiveNav: vi.fn(),
      setShowWelcome: vi.fn(),
      showWelcome: false,
      user: { id: 1, name: "Ava" },
    });
    resolveScreenMock.mockReturnValue("dashboard");
    useTourCheckMock.mockReturnValue([false, vi.fn()]);
    useOnboardingCheckMock.mockReturnValue([false, vi.fn()]);
  });

  it("renders nothing while the theme is still loading", () => {
    useAppStateMock.mockReturnValueOnce({
      isLoadingTheme: true,
    });

    const { container } = render(<App />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the auth and theme providers around the resolved screen", () => {
    render(<App />);

    expect(resolveScreenMock).toHaveBeenCalledWith(true, { id: 1, name: "Ava" }, false);
    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toHaveAttribute("data-theme", "ocean");
    expect(screen.getByText("screen:dashboard:home")).toBeInTheDocument();
  });

  it("renders screen wrapper and animated dashboard content", () => {
    const onNavChange = vi.fn();

    render(
      <AnimatedDashboardContent
        activeNav="calendar"
        setActiveNav={vi.fn()}
        user={{ name: "Ava" }}
        onNavChange={onNavChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "dashboard:calendar" }));
    expect(onNavChange).toHaveBeenCalledWith("tasks");

    const wrap = render(
      <ScreenWrap animKey="example">
        <div>Wrapped child</div>
      </ScreenWrap>,
    );
    expect(wrap.container.firstChild).toHaveStyle({ width: "100vw", height: "100vh" });
    expect(screen.getByText("Wrapped child")).toBeInTheDocument();
  });

  it("routes auth pages and redirects unknown auth paths to login", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText("auth:signin")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/signup"]}>
        <AuthScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText("auth:signup")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <AuthScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText("auth:reset-request")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/reset-password/token-1"]}>
        <AuthScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText("auth:reset-confirm")).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/unknown"]}>
        <AuthScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText("auth:signin")).toBeInTheDocument();
  });

  it("wires welcome screen callbacks to the navigation helpers", () => {
    render(
      <WelcomeScreen
        user={{ name: "Ava" }}
        setShowWelcome={vi.fn()}
        setActiveNav={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onExploreMock).toHaveBeenCalledTimes(1);
    expect(onBackToAuthMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("welcome:Ava")).toBeInTheDocument();
  });

  it("shows onboarding and dispatches settings navigation on completion", () => {
    const setShowOnboarding = vi.fn();
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    useOnboardingCheckMock.mockReturnValueOnce([true, setShowOnboarding]);

    render(<OnboardingWrapper />);
    fireEvent.click(screen.getByRole("button", { name: "Finish onboarding" }));

    expect(setShowOnboarding).toHaveBeenCalledWith(false);
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "navigate", detail: "settings" }),
    );

    dispatchSpy.mockRestore();
  });

  it("renders the app screen tour only on the home tab", () => {
    const completeTour = vi.fn();
    useTourCheckMock.mockReturnValueOnce([true, completeTour]);

    const { rerender } = render(
      <MemoryRouter initialEntries={["/today"]}>
        <AppScreen activeNav="home" setActiveNav={vi.fn()} user={{ name: "Ava" }} />
      </MemoryRouter>,
    );

    expect(useSyncNavFromUrlMock).toHaveBeenCalledWith("/today", expect.any(Function));
    expect(screen.getByText("layout:home:Ava")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AppTour" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "AppTour" }));
    expect(completeTour).toHaveBeenCalledTimes(1);

    useTourCheckMock.mockReturnValueOnce([true, vi.fn()]);
    rerender(
      <MemoryRouter initialEntries={["/today"]}>
        <AppScreen activeNav="tasks" setActiveNav={vi.fn()} user={{ name: "Ava" }} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("button", { name: "AppTour" })).not.toBeInTheDocument();
  });
});
