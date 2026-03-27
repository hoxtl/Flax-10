import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveRouteContentMock = vi.fn();

vi.mock("../../pages/settings/Settings", () => ({
  default: ({ user, onBack }) => (
    <div data-testid="settings-screen">
      <span>{user.name}</span>
      <button type="button" onClick={onBack}>settings-back</button>
    </div>
  ),
}));

vi.mock("../../pages/profile/Profile", () => ({
  default: ({ user, viewedUserId, backLabel, onBack, onNavigate }) => (
    <div data-testid="profile-screen">
      <span>{user.name}</span>
      <span>{viewedUserId || "self"}</span>
      <span>{backLabel || "Back"}</span>
      <button type="button" onClick={onBack}>profile-back</button>
      <button type="button" onClick={() => onNavigate?.("calendar")}>profile-nav</button>
    </div>
  ),
}));

vi.mock("../../app/navigation/helpers", () => ({
  resolveRouteContent: (...args) => resolveRouteContentMock(...args),
}));

import { DashboardContent } from "../../app/components/DashboardContent";

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveRouteContentMock.mockReturnValue(<div data-testid="resolved-route">resolved</div>);
  });

  it("renders settings and routes the back action to home", () => {
    const setActiveNav = vi.fn();
    render(
      <DashboardContent
        activeNav="settings"
        setActiveNav={setActiveNav}
        user={{ name: "Ava" }}
        onNavChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("settings-screen")).toHaveTextContent("Ava");
    fireEvent.click(screen.getByText("settings-back"));
    expect(setActiveNav).toHaveBeenCalledWith("home");
  });

  it("renders the current profile and wires navigation callbacks", () => {
    const setActiveNav = vi.fn();
    const onNavChange = vi.fn();
    render(
      <DashboardContent
        activeNav="profile"
        setActiveNav={setActiveNav}
        user={{ name: "Ava" }}
        onNavChange={onNavChange}
      />,
    );

    expect(screen.getByTestId("profile-screen")).toHaveTextContent("self");
    fireEvent.click(screen.getByText("profile-back"));
    fireEvent.click(screen.getByText("profile-nav"));
    expect(setActiveNav).toHaveBeenCalledWith("home");
    expect(onNavChange).toHaveBeenCalledWith("calendar");
  });

  it("renders another user's profile view and sends back to the users list", () => {
    const setActiveNav = vi.fn();
    render(
      <DashboardContent
        activeNav="profile_42"
        setActiveNav={setActiveNav}
        user={{ name: "Ava" }}
        onNavChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("profile-screen")).toHaveTextContent("42");
    expect(screen.getByTestId("profile-screen")).toHaveTextContent("Back to All Users");
    fireEvent.click(screen.getByText("profile-back"));
    expect(setActiveNav).toHaveBeenCalledWith("users");
  });

  it("falls back to resolveRouteContent for all other routes", () => {
    const setActiveNav = vi.fn();
    render(
      <DashboardContent
        activeNav="calendar"
        setActiveNav={setActiveNav}
        user={{ name: "Ava" }}
        onNavChange={vi.fn()}
      />,
    );

    expect(resolveRouteContentMock).toHaveBeenCalledWith("calendar", { name: "Ava" }, setActiveNav);
    expect(screen.getByTestId("resolved-route")).toBeInTheDocument();
  });
});
