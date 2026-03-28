import { vi } from "vitest";

export const getStoredViewerMock = vi.fn(() => ({ id: 1 }));
export const getProjectDateMock = vi.fn((d) => (d ? new Date(d) : null));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getStoredViewer: (...args) => getStoredViewerMock(...args),
  getCurrentMember: vi.fn(() => null),
  getDisplayName: vi.fn((m) => m?.name ?? ""),
  openMemberProfile: vi.fn(),
  getMemberKey: vi.fn((m) => String(m?.user || m?.id || "")),
  getPhotoUrl: vi.fn(() => null),
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectDate: (...args) => getProjectDateMock(...args),
  formatProjectHeadlineDate: vi.fn(() => "28 Mar 2026"),
  getProjectCaption: vi.fn(() => "Project caption"),
  getProjectTeacherName: vi.fn(() => null),
  openTeacherProfile: vi.fn(),
  getProjectTeacherInitials: vi.fn(() => ""),
}));

vi.mock("@/pages/group_work/components/ProjectHeaderSub", () => ({
  default: ({ isOwner }) => (
    <div data-testid="project-header-actions" data-is-owner={String(isOwner)} />
  ),
}));

vi.mock("@/components/common/deadline_countdown/DeadlineCountdown", () => ({
  default: () => <div data-testid="deadline-countdown" />,
}));

vi.mock("@/components/common/back_button/BackButton.jsx", () => ({
  default: ({ onClick, label }) => (
    <button type="button" onClick={onClick}>{label}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  CalendarDays: () => <svg data-testid="icon-calendar" />,
  BookOpen: () => <svg data-testid="icon-book" />,
}));

export function resetProjectHeaderHarness() {
  getStoredViewerMock.mockReset();
  getStoredViewerMock.mockImplementation(() => ({ id: 1 }));
  getProjectDateMock.mockReset();
  getProjectDateMock.mockImplementation((d) => (d ? new Date(d) : null));
}
