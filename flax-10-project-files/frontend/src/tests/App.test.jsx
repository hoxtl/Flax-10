import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import App from "../../App";
import { getUserSettings } from "../../api/userService";

// Mock everything external
vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("react-router-dom", () => ({
  Routes: ({ children }) => <div>{children}</div>,
  Route: () => null,
  Navigate: () => <div data-testid="navigate" />,
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../api/userService", () => ({ getUserSettings: vi.fn() }));
vi.mock("../../pages/AuthPage", () => ({
  default: () => <div data-testid="auth-page" />,
}));
vi.mock("../../pages/WelcomeLanding", () => ({
  default: () => <div data-testid="welcome-page" />,
}));
vi.mock("../../layout/DashboardLayout", () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

describe("App Root", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows AuthPage when not authenticated", () => {
    render(<App />);
    expect(screen.getByTestId("auth-page")).toBeTruthy();
  });

  it("shows WelcomeLanding for new authenticated users", async () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ username: "test" }));
    // Note: WELCOME_SEEN_KEY is not set

    render(<App />);
    expect(screen.getByTestId("welcome-page")).toBeTruthy();
  });

  it("shows App Layout for returning authenticated users", () => {
    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ username: "test" }));
    localStorage.setItem("flax_welcome_seen_v1", "1");

    render(<App />);
    expect(screen.getByTestId("app-layout")).toBeTruthy();
  });

  it("loads user theme settings on mount", async () => {
    localStorage.setItem("token", "fake-token");
    getUserSettings.mockResolvedValue({ theme: "dark" });

    await act(async () => {
      render(<App />);
    });

    expect(getUserSettings).toHaveBeenCalled();
  });

  it("syncs state when auth-changed event is dispatched", async () => {
    render(<App />);
    expect(screen.getByTestId("auth-page")).toBeTruthy();

    localStorage.setItem("token", "fake-token");
    localStorage.setItem("user", JSON.stringify({ username: "test" }));

    await act(async () => {
      window.dispatchEvent(new Event("auth-changed"));
    });

    // Should now resolve to welcome or app
    expect(screen.queryByTestId("auth-page")).toBeNull();
  });
});
