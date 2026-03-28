import { vi } from "vitest";

export const memberAvatarMock = vi.fn(({ member, size }) => (
  <div data-testid="member-avatar">{member.name}|{size}</div>
));

export const openMemberProfileMock = vi.fn();
export const getDisplayNameMock = vi.fn((member) => member.name);

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: (props) => memberAvatarMock(props),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: (...args) => getDisplayNameMock(...args),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
}));

export function resetMemberAvatarHarness() {
  memberAvatarMock.mockClear();
  openMemberProfileMock.mockClear();
  getDisplayNameMock.mockClear();
}
