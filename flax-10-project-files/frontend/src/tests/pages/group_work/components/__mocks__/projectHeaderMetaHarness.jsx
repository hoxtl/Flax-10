import { vi } from "vitest";

export const getProjectTeacherNameMock = vi.fn();
export const openTeacherProfileMock = vi.fn();
export const addMemberFormMock = vi.fn();
export const getDisplayNameMock = vi.fn((member) => member?.name ?? "");
export const openMemberProfileMock = vi.fn();
export const getStoredViewerMock = vi.fn(() => ({ id: 1 }));
export const getProjectDateMock = vi.fn((d) => (d ? new Date(d) : null));
export const formatProjectHeadlineDateMock = vi.fn(() => "28 Mar 2026");
export const getProjectCaptionMock = vi.fn(() => "Project caption");
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
  getProjectDate: (...args) => getProjectDateMock(...args),
  formatProjectHeadlineDate: (...args) => formatProjectHeadlineDateMock(...args),
  getProjectCaption: (...args) => getProjectCaptionMock(...args),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: (...args) => getDisplayNameMock(...args),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
  getStoredViewer: (...args) => getStoredViewerMock(...args),
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

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <div data-testid="member-avatar">{member?.name}</div>,
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
  getDisplayNameMock.mockReset();
  openMemberProfileMock.mockReset();
  getStoredViewerMock.mockReset();
  getStoredViewerMock.mockImplementation(() => ({ id: 1 }));
  getProjectDateMock.mockReset();
  getProjectDateMock.mockImplementation((d) => (d ? new Date(d) : null));
  formatProjectHeadlineDateMock.mockReset();
  formatProjectHeadlineDateMock.mockImplementation(() => "28 Mar 2026");
  getProjectCaptionMock.mockReset();
  getProjectCaptionMock.mockImplementation(() => "Project caption");
  membersSectionCalls.length = 0;
  authState.profile = null;
}
