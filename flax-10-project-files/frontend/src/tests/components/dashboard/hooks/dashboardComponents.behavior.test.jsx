import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUserProfileMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Tag = typeof tag === "string" ? tag : "div";
      return ({ children, initial, animate, exit, transition, whileHover, whileTap, layoutId, ...props }) => <Tag {...props}>{children}</Tag>;
    },
  }),
}));

vi.mock("../../../../api/userApi", () => ({
  updateUserProfile: (...args) => updateUserProfileMock(...args),
}));

vi.mock("../../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: (_user, options) => `resolved:${options.seed ?? "none"}`,
}));

vi.mock("../../../../lib/routes", () => ({
  APP_ROUTES: [
    { id: "home", label: "Home", icon: "H", isAdminOnly: false },
    { id: "tasks", label: "Tasks", icon: "T", isAdminOnly: false },
  ],
}));

import { buildEditProfileSubmitHandler, getApiBaseUrl, useEditProfileForm } from "../../../../components/dashboard/hooks/useEditProfileForm";
import SidebarDesktop from "../../../../components/dashboard/sidebar/SidebarDesktop";
import SidebarMobile from "../../../../components/dashboard/sidebar/SidebarMobile";

describe("dashboard coverage topups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "token-123");
  });

  it("treats failed username availability checks as unavailable", async () => {
    const setLoading = vi.fn();
    const setError = vi.fn();
    const setSaveSignal = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const submit = buildEditProfileSubmitHandler(
      { username: "new-name", bio: "bio", profilePhoto: null, removePhoto: false, setLoading, setError, setSaveSignal },
      { username: "old-name" },
      vi.fn(),
      vi.fn(),
    );

    await submit({ preventDefault: vi.fn() });

    expect(updateUserProfileMock).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("Username is already taken");
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("uses the configured API base URL helper when one is provided", () => {
    expect(getApiBaseUrl("https://studyflax.test/api")).toBe("https://studyflax.test/api");
    expect(getApiBaseUrl("")).toBe("http://localhost:8000/api");
  });

  it("uses the configured API base URL for username checks when one is provided", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://studyflax.test/api");
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ available: true }) });
    vi.stubGlobal("fetch", fetchMock);

    const { buildEditProfileSubmitHandler: buildHandler } = await import("../../../../components/dashboard/hooks/useEditProfileForm");
    const submit = buildHandler(
      { username: "fresh-name", bio: "", profilePhoto: null, removePhoto: false,
        setLoading: vi.fn(), setError: vi.fn(), setSaveSignal: vi.fn() },
      { username: "old-name" },
      vi.fn(),
      vi.fn(),
    );

    await submit({ preventDefault: vi.fn() });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://studyflax.test/api/check-username/",
      expect.objectContaining({ method: "POST" }),
    );
    vi.unstubAllEnvs();
  });

  it("initialises and resyncs profile form state across missing and partial users", () => {
    const { result, rerender } = renderHook(({ user }) => useEditProfileForm(user), {
      initialProps: { user: null },
    });

    expect(result.current.username).toBe("");
    expect(result.current.bio).toBe("");
    expect(result.current.previewUrl).toBe("resolved:none");

    rerender({ user: { id: 42, name: "Ada", bio: "First bio" } });
    expect(result.current.username).toBe("");
    expect(result.current.bio).toBe("First bio");
    expect(result.current.previewUrl).toBe("resolved:42");

    rerender({ user: { name: "Bea", bio: "Name fallback" } });
    expect(result.current.username).toBe("");
    expect(result.current.bio).toBe("Name fallback");
    expect(result.current.previewUrl).toBe("resolved:Bea");

    rerender({ user: { username: "ada", bio: "Updated bio" } });
    expect(result.current.username).toBe("ada");
    expect(result.current.bio).toBe("Updated bio");
    expect(result.current.previewUrl).toBe("resolved:ada");
  });

  it("closes the desktop user menu when the backdrop is clicked", () => {
    const { container } = render(
      <SidebarDesktop
        active="home"
        onChange={vi.fn()}
        user={{ name: "Alice", email: "alice@example.com" }}
      />,
    );

    fireEvent.mouseEnter(container.firstChild);
    fireEvent.click(screen.getByText("Alice"));
    expect(screen.getByText("Profile")).toBeInTheDocument();

    fireEvent.click(container.querySelector('[class*="menuBackdrop"]'));
    expect(screen.queryByText("Profile")).toBeNull();
  });

  it("applies deadline pressure styling to the home and tasks routes", () => {
    const { container } = render(
      <SidebarDesktop
        active="home"
        onChange={vi.fn()}
        user={{ name: "Alice", email: "alice@example.com" }}
        hasPressure
      />,
    );

    fireEvent.mouseEnter(container.firstChild);

    expect(screen.getByText("Home").closest("button")?.className).toContain("navItemPressure");
    expect(screen.getByText("Tasks").closest("button")?.className).toContain("navItemPressure");
  });

  it("runs the mobile logout footer action and closes the drawer", () => {
    const onToggle = vi.fn();
    const onLogoutClick = vi.fn();

    render(
      <SidebarMobile
        isOpen
        onToggle={onToggle}
        user={{ isAdmin: false }}
        onLogoutClick={onLogoutClick}
      />,
    );

    fireEvent.click(screen.getByText("Log out"));

    expect(onLogoutClick).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
  });
});
