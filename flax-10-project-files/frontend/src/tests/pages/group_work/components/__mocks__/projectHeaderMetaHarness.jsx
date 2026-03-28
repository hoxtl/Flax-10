import { vi } from "vitest";

export const getProjectTeacherNameMock = vi.fn();
export const openTeacherProfileMock = vi.fn();
export const addMemberFormMock = vi.fn();
const membersSectionCalls = [];
const authState = { profile: null };

function mockAuthModule() {
  return {
    useAuth: () => authState,
  };
}

vi.mock("@/context/AuthContext", mockAuthModule);

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectTeacherName: (...args) => getProjectTeacherNameMock(...args),
  openTeacherProfile: (...args) => openTeacherProfileMock(...args),
}));

vi.mock("@/components/common/badge/Badge", () => ({
  default: ({ children, ...rest }) => <div data-testid="badge" {...rest}>{children}</div>,
}));

vi.mock("@/components/common/standard_modal/StandardModal", () => ({
  default: ({ title, onClose, children }) => (
    <div data-testid="standard-modal">
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ title, onCancel, onConfirm }) => (
    <div data-testid="hold-confirm-modal">
      <h3>{title}</h3>
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="button" onClick={onConfirm}>Confirm</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/ProjectModuleBadge", () => ({
  default: ({ project }) => <div data-testid="module-badge">{project?.code || "MOD"}</div>,
}));

vi.mock("@/pages/group_work/components/AddMemberForm", () => ({
  default: (props) => {
    addMemberFormMock(props);
    return (
      <button data-testid="add-member-form" type="button" onClick={() => props.onAdded?.({ id: "new" })}>
        Add member
      </button>
    );
  },
}));

vi.mock("@/pages/group_work/components/MembersSection", () => ({
  default: (props) => {
    membersSectionCalls.push(props);
    return (
      <div data-testid="members-section">
        {props.members.map((member) => (
          <button key={member.id} type="button" onClick={() => props.onRemove(member.id)}>
            {member.name}
          </button>
        ))}
        {props.members.length === 0 && <p>No teammates</p>}
      </div>
    );
  },
}));

export function setAuthProfile(profile) {
  authState.profile = profile;
}

export function getLastMembersSectionProps() {
  return membersSectionCalls[membersSectionCalls.length - 1] ?? null;
}

export function resetProjectHeaderMetaHarness() {
  getProjectTeacherNameMock.mockReset();
  openTeacherProfileMock.mockReset();
  addMemberFormMock.mockReset();
  membersSectionCalls.length = 0;
  authState.profile = null;
}
