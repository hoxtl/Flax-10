import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import styles from "../../../pages/admin/styles/styles";
import {
  confirmBanHandler,
  renderBanModal,
  renderUsersBody,
  toggleFilterGroup,
  unbanHandler,
} from "../../../pages/admin/components/UsersTab.jsx";
import { banUser, unbanUser } from "../../../api/adminApi";

vi.mock("../../../api/adminApi", () => ({
  banUser: vi.fn(() => Promise.resolve()),
  unbanUser: vi.fn(() => Promise.resolve()),
}));

const flushPromises = () => new Promise((resolve) => {
  setTimeout(resolve, 0);
});

describe("UsersTab helpers", () => {
  let users;
  let baseState;

  beforeEach(() => {
    users = [{ id: 1, username: "alpha", first_name: "A", last_name: "User", is_active: true, ban_reason: "" }];
    baseState = {
      banTarget: users[0],
      setBanTarget: vi.fn(),
      setBusy: vi.fn(),
      setError: vi.fn(),
      setUsers: vi.fn((updater) => {
        users = updater(users);
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("toggleFilterGroup adds and removes filter values", () => {
    let filters = { roles: ["staff"], status: [] };
    const setFilters = (updater) => {
      filters = updater(filters);
    };

    toggleFilterGroup(setFilters, "roles", "staff");
    expect(filters.roles).not.toContain("staff");

    toggleFilterGroup(setFilters, "status", "active");
    expect(filters.status).toContain("active");
  });

  it("confirmBanHandler ignores empty reasons", async () => {
    await confirmBanHandler(baseState, "   ");
    expect(banUser).not.toHaveBeenCalled();
    expect(baseState.setBusy).not.toHaveBeenCalled();
  });

  it("confirmBanHandler bans the user and updates state", async () => {
    await confirmBanHandler(baseState, "  rule break  ");
    await flushPromises();

    expect(banUser).toHaveBeenCalledWith(1, "rule break");
    expect(baseState.setBusy).toHaveBeenNthCalledWith(1, true);
    expect(baseState.setBusy).toHaveBeenNthCalledWith(2, false);
    expect(baseState.setUsers).toHaveBeenCalled();
    expect(baseState.setBanTarget).toHaveBeenCalledWith(null);
    expect(users[0].is_active).toBe(false);
  });

  it("confirmBanHandler surfaces API errors", async () => {
    banUser.mockRejectedValueOnce(new Error("nope"));

    await confirmBanHandler(baseState, "bad");
    await flushPromises();

    expect(baseState.setError).toHaveBeenCalledWith("nope");
    expect(baseState.setBusy).toHaveBeenNthCalledWith(1, true);
    expect(baseState.setBusy).toHaveBeenNthCalledWith(2, false);
  });

  it("confirmBanHandler falls back to default error copy", async () => {
    banUser.mockRejectedValueOnce({});

    await confirmBanHandler(baseState, "reason");
    await flushPromises();

    expect(baseState.setError).toHaveBeenCalledWith("Failed to ban user.");
  });

  it("unbanHandler updates users and handles errors", async () => {
    const user = users[0];

    await unbanHandler(baseState, user);
    await flushPromises();
    expect(unbanUser).toHaveBeenCalledWith(1);
    expect(users[0].is_active).toBe(true);

    unbanUser.mockRejectedValueOnce(new Error("fail"));
    await unbanHandler(baseState, user);
    await flushPromises();
    expect(baseState.setError).toHaveBeenCalledWith("fail");
  });

  it("renderUsersBody shows spinner when loading", () => {
    const view = render(renderUsersBody({
      state: { loading: true },
      filteredUsers: [],
      pagination: { pageItems: [], currentPage: 1, totalPages: 1, setCurrentPage: vi.fn() },
      onNavigate: vi.fn(),
      handleUnban: vi.fn(),
    }));

    expect(view.container.querySelector(`.${styles.spinnerWrap}`)).not.toBeNull();
  });

  it("renderUsersBody renders content when users exist", () => {
  const sampleUsers = [{ id: 2, username: "beta", first_name: "B", last_name: "User", email: "b@example.com", is_active: true, role: "student" }];
    render(renderUsersBody({
      state: { loading: false, busy: false, setBanTarget: vi.fn() },
      filteredUsers: sampleUsers,
      pagination: { pageItems: sampleUsers, currentPage: 1, totalPages: 1, setCurrentPage: vi.fn() },
      onNavigate: vi.fn(),
      handleUnban: vi.fn(),
    }));

    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("renderUsersBody returns search empty state when query active", () => {
    render(renderUsersBody({
      state: { loading: false, search: "zoe" },
      filteredUsers: [],
      pagination: { pageItems: [], currentPage: 1, totalPages: 1, setCurrentPage: vi.fn() },
      onNavigate: vi.fn(),
      handleUnban: vi.fn(),
    }));

    expect(screen.getByText('No users match "zoe"')).toBeInTheDocument();
  });

  it("renderUsersBody falls back to default empty state", () => {
    render(renderUsersBody({
      state: { loading: false, search: "" },
      filteredUsers: [],
      pagination: { pageItems: [], currentPage: 1, totalPages: 1, setCurrentPage: vi.fn() },
      onNavigate: vi.fn(),
      handleUnban: vi.fn(),
    }));

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renderBanModal toggles modal visibility", () => {
    const hidden = render(<>{renderBanModal({ banTarget: null, setBanTarget: vi.fn() }, vi.fn())}</>);
    expect(hidden.container.firstChild).toBeNull();

    const visible = render(<>{renderBanModal({ banTarget: { id: 99, username: "mod" }, setBanTarget: vi.fn() }, vi.fn())}</>);
    expect(visible.getByText("Ban mod?")).toBeInTheDocument();
  });
});
