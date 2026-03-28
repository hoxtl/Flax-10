/*
 * Shared helpers and mocks for profile modal tests.
 */

import { render } from "@testing-library/react";
import { vi } from "vitest";
import { createFnMap } from "../../../utils/testBuilderUtils";

vi.mock("../../../../components/dashboard/components/EditProfileModal", () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close Edit</button></div> : null,
}));

vi.mock("../../../../components/social/components/UserListModal", () => ({
  default: ({ title, users, onClose, onUserClick, onUserCalendarClick, showCalendarAction }) => (
    <div data-testid="user-list-modal">
      <span>{title}</span>
      <button type="button" onClick={onClose}>Close List</button>
      {(users || []).map((user, index) => (
        <div key={index}>
          <div data-testid="user-item" role="button" tabIndex={0} onClick={() => onUserClick?.(user)} onKeyDown={(event) => event.key === "Enter" && onUserClick?.(user)}>
            {user.username}
          </div>
          {showCalendarAction ? (
            <button type="button" onClick={() => onUserCalendarClick?.(user)}>View calendar</button>
          ) : null}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../../../api/socialApi", () => ({
  getSharingWith: vi.fn().mockResolvedValue([]),
  getSharedWithMe: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../api/taskApi", () => ({
  fetchTasks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../pages/profile/hooks/useProfileModalsData", async () => {
  const actual = await vi.importActual("../../../../pages/profile/hooks/useProfileModalsData");
  return {
    ...actual,
    useTasksModalData: vi.fn(() => ({ loading: false, tasks: [] })),
  };
});

import ProfileModals, { SocietiesModal } from "../../../../pages/profile/components/ProfileModals";
import { getModules } from "../../../../api/moduleApi";
import { useTasksModalData } from "../../../../pages/profile/hooks/useProfileModalsData";

export { getModules, useTasksModalData };

const modalStateDefaults = {
  showEditProfile: false,
  profileData: { id: 1 },
  showModules: false,
  showTasks: false,
  showSharedWith: false,
  showSharedBy: false,
  showEvents: false,
  eventRange: "week",
};

const defaultUser = { id: 1, username: "alice" };
const defaultModules = ["CS101", "MA202"];
const defaultEvents = [{ title: "Meeting", start_time: "2024-03-08T10:00:00Z", location: "Room A" }];
const defaultVisibility = {
  canEditProfile: true,
  canViewModules: true,
  canViewTasks: true,
  canViewSharedWith: true,
  canViewEvents: true,
};

/** Builds profile modal state with mocked setters and handlers. */
export function makeProfileModalState(overrides = {}) {
  return {
    ...modalStateDefaults,
    ...createFnMap([
      "setShowEditProfile",
      "handleSaveProfile",
      "setShowModules",
      "setShowTasks",
      "setShowSharedWith",
      "setShowSharedBy",
      "setShowEvents",
      "setEventRange",
      "reload",
    ]),
    ...overrides,
  };
}

function buildProfileModalProps({
  user = defaultUser,
  state: stateOverrides = {},
  modules,
  filteredEvents,
  visibility: visibilityOverrides,
  onNavChange,
} = {}) {
  return {
    user,
    state: makeProfileModalState(stateOverrides),
    modules: modules ?? defaultModules,
    filteredEvents: filteredEvents ?? defaultEvents,
    visibility: { ...defaultVisibility, ...visibilityOverrides },
    onNavChange: onNavChange ?? vi.fn(),
  };
}

/** Renders the profile modals component with default test props. */
export function renderProfileModals(options = {}) {
  return render(<ProfileModals {...buildProfileModalProps(options)} />);
}

/** Renders the societies modal with default test props. */
export function renderSocietiesModal({ isOpen = true, societies = [], onNavigate = vi.fn(), onClose = vi.fn() } = {}) {
  const utils = render(<SocietiesModal isOpen={isOpen} onClose={onClose} societies={societies} onNavigate={onNavigate} />);
  return { ...utils, onClose, onNavigate };
}
