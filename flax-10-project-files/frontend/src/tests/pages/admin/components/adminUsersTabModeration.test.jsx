/*
 * UsersTab moderation tests covering empty states, markers, and ban flows.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

function stripMotionProps(props) {
  const clean = { ...props };
  ["layoutId","initial","animate","exit","transition","variants","whileHover","whileTap","layout"].forEach((k) => delete clean[k]);
  return clean;
}

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => ({ children, ...props }) => <div {...stripMotionProps(props)}>{children}</div> }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../api/adminApi", () => ({
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  fetchAdminUsers: vi.fn(),
}));

vi.mock("../../../../pages/admin/styles/styles", () => ({
  default: {
    userAvatar: "userAvatar", staffBadge: "staffBadge", staffPillBadge: "staffPillBadge",
    nameBtn: "nameBtn", username: "username", tableRow: "tableHead", tableHead: "tableHead",
    table: "table", desktopUsersView: "desktopUsersView", list: "list",
    mobileUsersView: "mobileUsersView", userCard: "userCard", cardInfoMetaBlock: "cardInfoMetaBlock",
    cardProfile: "cardProfile", nameHandle: "nameHandle", userName: "userName",
    userHandle: "userHandle", metaBadges: "metaBadges", statusBadge: "statusBadge",
    active: "active", banned: "banned", cardActions: "cardActions",
    filterGroupsWrap: "filterGroupsWrap", pillDivider: "pillDivider",
    headerControls: "headerControls", banBtn: "banBtn", unbanBtn: "unbanBtn",
    banPillBtn: "banPillBtn", unbanPillBtn: "unbanPillBtn", nameCell: "nameCell",
    emailCell: "emailCell", actionsCell: "actionsCell", badge: "badge",
    badgeAdmin: "badgeAdmin", badgeStudent: "badgeStudent", badgeTeacher: "badgeTeacher",
    badgeActive: "badgeActive", badgeBanned: "badgeBanned", roleTag: "roleTag",
    roleAdmin: "roleAdmin", roleStudent: "roleStudent", roleTeacher: "roleTeacher",
    banModal: "banModal", banModalContent: "banModalContent", banForm: "banForm",
    banModalIconWrap: "banModalIconWrap", reasonLabel: "reasonLabel",
    requiredMark: "requiredMark", reasonInput: "reasonInput",
    modalActions: "modalActions", cancelActionBtn: "cancelActionBtn",
    confirmActionBtn: "confirmActionBtn", searchCompact: "searchCompact",
    searchInput: "searchInput", spinner: "spinner", spinnerWrap: "spinnerWrap",
  },
}));

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, title, onClose }) => (
    <div><span>{title}</span><button onClick={onClose}>close-modal</button>{children}</div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("../../../../pages/admin/components/AdminFilters", () => ({
  FilterToggleGroup: ({ ariaLabel, options, onToggle }) => (
    <div aria-label={ariaLabel}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onToggle(opt.value)}>{opt.label}</button>
      ))}
    </div>
  ),
}));

vi.mock("../../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder || "search"} value={value} onChange={onChange} />
  ),
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query }) => <div>No results for {query}</div>,
}));

vi.mock("lucide-react", () => ({ Ban: () => <svg /> }));

vi.mock("../../../../pages/admin/hooks/useUsersTabState", () => ({
  useUsersTabState: vi.fn(),
}));

vi.mock("../../../../pages/admin/utils/protectedUsers", () => ({
  isProtectedFixtureUser: vi.fn(() => false),
}));

vi.mock("../../../../pages/admin/utils/adminNavigation", () => ({
  navigateToProfile: vi.fn(),
}));

import * as api from "../../../../api/adminApi";
import { useUsersTabState } from "../../../../pages/admin/hooks/useUsersTabState";
import { isProtectedFixtureUser } from "../../../../pages/admin/utils/protectedUsers";
import { navigateToProfile } from "../../../../pages/admin/utils/adminNavigation";
import UsersTab, { confirmBanHandler } from "../../../../pages/admin/components/UsersTab";

function makeState(overrides = {}) {
  return {
    users: [], search: "", filters: { roles: [], status: [] },
    loading: false, busy: false, error: null, banTarget: null,
    setSearch: vi.fn(), setFilters: vi.fn(), setBusy: vi.fn(),
    setBanTarget: vi.fn(), setUsers: vi.fn(), setError: vi.fn(),
    ...overrides,
  };
}

describe("UsersTab moderation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isProtectedFixtureUser.mockReturnValue(false);
  });

  it("shows EmptyState when there are no users and no search query", () => {
    useUsersTabState.mockReturnValue(makeState({ users: [], search: "" }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("shows SearchEmptyState when search yields no results", () => {
    useUsersTabState.mockReturnValue(makeState({
      users: [{ id: 1, first_name: "Alice", last_name: "A", username: "alice", email: "a@a.com", role: "student", is_active: true, is_staff: false, is_superuser: false }],
      search: "zzzzz",
    }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getByText(/No results for zzzzz/)).toBeInTheDocument();
  });

  it("renders AdminMarker for staff users in desktop view", () => {
    const staffUser = { id: 2, first_name: "Bob", last_name: "B", username: "bob", email: "b@b.com", role: "admin", is_active: true, is_staff: true, is_superuser: false };
    useUsersTabState.mockReturnValue(makeState({ users: [staffUser] }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("renders AdminMarker for superusers who are not staff-flagged", () => {
    const superUser = { id: 22, first_name: "Super", last_name: "U", username: "superu", email: "s@s.com", role: "admin", is_active: true, is_staff: false, is_superuser: true };
    useUsersTabState.mockReturnValue(makeState({ users: [superUser] }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("renders ProtectedMarker for protected active users in desktop view", () => {
    isProtectedFixtureUser.mockReturnValue(true);
    const protectedUser = { id: 3, first_name: "Carol", last_name: "C", username: "carol", email: "c@c.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    useUsersTabState.mockReturnValue(makeState({ users: [protectedUser] }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getAllByText("Protected").length).toBeGreaterThan(0);
  });

  it("renders Unban button for inactive users", () => {
    const inactiveUser = { id: 4, first_name: "Dave", last_name: "D", username: "dave", email: "d@d.com", role: "student", is_active: false, is_staff: false, is_superuser: false };
    useUsersTabState.mockReturnValue(makeState({ users: [inactiveUser] }));
    render(<UsersTab onNavigate={vi.fn()} />);
    expect(screen.getAllByText("Unban").length).toBeGreaterThan(0);
  });

  it("calls setBanTarget when Ban is clicked on an active user", () => {
    const activeUser = { id: 5, first_name: "Eve", last_name: "E", username: "eve", email: "e@e.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({ users: [activeUser] });
    useUsersTabState.mockReturnValue(state);
    render(<UsersTab onNavigate={vi.fn()} />);
    fireEvent.click(screen.getAllByText("Ban")[0]);
    expect(state.setBanTarget).toHaveBeenCalledWith(activeUser);
  });

  it("calls unbanUser and updates state on unban success", async () => {
    const inactiveUser = { id: 6, first_name: "Frank", last_name: "F", username: "frank", email: "f@f.com", role: "student", is_active: false, is_staff: false, is_superuser: false };
    const state = makeState({ users: [inactiveUser] });
    useUsersTabState.mockReturnValue(state);
    api.unbanUser.mockResolvedValue({});
    render(<UsersTab onNavigate={vi.fn()} />);
    fireEvent.click(screen.getAllByText("Unban")[0]);
    await waitFor(() => expect(api.unbanUser).toHaveBeenCalledWith(6));
    expect(state.setBusy).toHaveBeenCalledWith(false);

    // execute unbanUserState callback
    const setUsersUpdater = state.setUsers.mock.calls[0][0];
    setUsersUpdater([inactiveUser]);
  });

  it("sets error on unban failure", async () => {
    const inactiveUser = { id: 7, first_name: "Grace", last_name: "G", username: "grace", email: "g@g.com", role: "student", is_active: false, is_staff: false, is_superuser: false };
    const state = makeState({ users: [inactiveUser] });
    useUsersTabState.mockReturnValue(state);
    api.unbanUser.mockRejectedValue(new Error("Server error"));
    render(<UsersTab onNavigate={vi.fn()} />);
    fireEvent.click(screen.getAllByText("Unban")[0]);
    await waitFor(() => expect(state.setError).toHaveBeenCalledWith("Server error"));
  });

  it("sets fallback error message when unban fails with no message", async () => {
    const inactiveUser = { id: 8, first_name: "Hank", last_name: "H", username: "hank", email: "h@h.com", role: "student", is_active: false, is_staff: false, is_superuser: false };
    const state = makeState({ users: [inactiveUser] });
    useUsersTabState.mockReturnValue(state);
    api.unbanUser.mockRejectedValue({});
    render(<UsersTab onNavigate={vi.fn()} />);
    fireEvent.click(screen.getAllByText("Unban")[0]);
    await waitFor(() => expect(state.setError).toHaveBeenCalledWith("Failed to unban user."));
  });

  it("calls banUser and sets error on ban failure", async () => {
    const activeUser = { id: 9, first_name: "Iris", last_name: "I", username: "iris", email: "i@i.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({
      users: [activeUser],
      banTarget: activeUser,
    });
    useUsersTabState.mockReturnValue(state);
    api.banUser.mockRejectedValue(new Error("Ban failed"));
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "Reason" } });
    fireEvent.submit(textarea.closest("form"));
    await waitFor(() => expect(state.setError).toHaveBeenCalledWith("Ban failed"));
  });

  it("uses fallback ban error when the API error message is empty", async () => {
    const activeUser = { id: 29, first_name: "Empty", last_name: "Msg", username: "emptym", email: "e@e.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({ users: [activeUser], banTarget: activeUser });
    useUsersTabState.mockReturnValue(state);
    api.banUser.mockRejectedValue({ message: "" });
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "Spam" } });
    fireEvent.submit(textarea.closest("form"));
    await waitFor(() => expect(state.setError).toHaveBeenCalledWith("Failed to ban user."));
  });

  it("uses fallback ban error message when the API error has no message", async () => {
    const activeUser = { id: 19, first_name: "No", last_name: "Msg", username: "nomsg", email: "n@n.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({ users: [activeUser], banTarget: activeUser });
    useUsersTabState.mockReturnValue(state);
    api.banUser.mockRejectedValue({});
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "Spam" } });
    fireEvent.submit(textarea.closest("form"));
    await waitFor(() => expect(state.setError).toHaveBeenCalledWith("Failed to ban user."));
  });

  it("calls banUser and updates users on ban success", async () => {
    const activeUser = { id: 10, first_name: "Jake", last_name: "J", username: "jake", email: "j@j.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({
      users: [activeUser],
      banTarget: activeUser,
    });
    useUsersTabState.mockReturnValue(state);
    api.banUser.mockResolvedValue({});
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "Valid reason" } });
    fireEvent.submit(textarea.closest("form"));
    await waitFor(() => expect(api.banUser).toHaveBeenCalledWith(10, "Valid reason"));
    await waitFor(() => expect(state.setUsers).toHaveBeenCalled());
    await waitFor(() => expect(state.setBanTarget).toHaveBeenCalledWith(null));
    await waitFor(() => expect(state.setBusy).toHaveBeenCalledWith(false));

    const setUsersUpdater = state.setUsers.mock.calls[0][0];
    setUsersUpdater([activeUser]);
  });

  it("returns early from confirmBanHandler when reason is empty", async () => {
    const activeUser = { id: 12, first_name: "Leo", last_name: "L", username: "leo", email: "l@l.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({
      users: [activeUser],
      banTarget: activeUser,
    });
    useUsersTabState.mockReturnValue(state);
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "" } });
    fireEvent.submit(textarea.closest("form"));
    expect(api.banUser).not.toHaveBeenCalled();
  });

  it("returns early from confirmBanHandler when reason is whitespace", async () => {
    const activeUser = { id: 11, first_name: "Kim", last_name: "K", username: "kim", email: "k@k.com", role: "student", is_active: true, is_staff: false, is_superuser: false };
    const state = makeState({
      users: [activeUser],
      banTarget: activeUser,
    });
    useUsersTabState.mockReturnValue(state);
    render(<UsersTab onNavigate={vi.fn()} />);
    const textarea = screen.getByRole("textbox", { name: /reason for ban/i });
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.submit(textarea.closest("form"));
    expect(state.setBusy).not.toHaveBeenCalled();
    expect(api.banUser).not.toHaveBeenCalled();
  });

  it("navigates to user profile on name click", () => {
    const activeUser = { id: 5, first_name: "Eve", last_name: "E", username: "eve", role: "student", is_active: true };
    useUsersTabState.mockReturnValue(makeState({ users: [activeUser] }));
    const onNavigate = vi.fn();
    const { container } = render(<UsersTab onNavigate={onNavigate} />);
    fireEvent.click(container.querySelector(".nameBtn"));
    expect(navigateToProfile).toHaveBeenCalledWith(onNavigate, 5);
  });

  it("calls setBanTarget and handleUnban from mobile view buttons", () => {
    const activeUser = { id: 5, first_name: "Eve", last_name: "E", username: "eve", role: "student", is_active: true };
    const inactiveUser = { id: 6, first_name: "Frank", username: "frank", role: "student", is_active: false };
    const state = makeState({ users: [activeUser, inactiveUser] });
    useUsersTabState.mockReturnValue(state);
    api.unbanUser.mockResolvedValue({});
    const { container } = render(<UsersTab onNavigate={vi.fn()} />);
    
    // mobile view renders UserMobileRow which uses .banPillBtn and .unbanPillBtn
    const banPill = container.querySelector(".banPillBtn");
    const unbanPill = container.querySelector(".unbanPillBtn");
    
    fireEvent.click(banPill);
    expect(state.setBanTarget).toHaveBeenCalledWith(activeUser);
    
    fireEvent.click(unbanPill);
    expect(state.setBusy).toHaveBeenCalledWith(true);
  });

  it("toggles filters when FilterToggleGroup options are clicked", () => {
    const state = makeState({ filters: { roles: [], status: [] } });
    useUsersTabState.mockReturnValue(state);
    render(<UsersTab onNavigate={vi.fn()} />);
    
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Banned"));
    
    expect(state.setFilters).toHaveBeenCalledTimes(2);
    
    // evaluate the updaters
    const roleUpdater = state.setFilters.mock.calls[0][0];
    const statusUpdater = state.setFilters.mock.calls[1][0];
    roleUpdater({ roles: [], status: [] });
    statusUpdater({ roles: [], status: [] });
  });

  it("closes the ban modal and resets banTarget on cancel", () => {
    const activeUser = { id: 9, first_name: "Iris", username: "iris", role: "student", is_active: true };
    const state = makeState({ users: [activeUser], banTarget: activeUser });
    useUsersTabState.mockReturnValue(state);
    render(<UsersTab onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByText("close-modal"));
    expect(state.setBanTarget).toHaveBeenCalledWith(null);
  });

  it("shows loading spinner when loading", () => {
    useUsersTabState.mockReturnValue(makeState({ loading: true }));
    const { container } = render(<UsersTab onNavigate={vi.fn()} />);
    expect(container.querySelector(".spinnerWrap")).toBeInTheDocument();
  });

  it("short-circuits confirmBanHandler when the trimmed reason is empty", () => {
    const state = {
      banTarget: { id: 1 },
      setBusy: vi.fn(),
      setBanTarget: vi.fn(),
      setUsers: vi.fn(),
      setError: vi.fn(),
    };
    confirmBanHandler(state, "");
    expect(api.banUser).not.toHaveBeenCalled();
    expect(state.setBusy).not.toHaveBeenCalled();
  });
});
