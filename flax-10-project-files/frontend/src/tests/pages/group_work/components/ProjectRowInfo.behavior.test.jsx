import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

export const openTeacherProfileMock = vi.fn();
export const openMemberProfileMock = vi.fn();

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <img alt={member?.name ?? "avatar"} />,
}));

vi.mock("@/pages/group_work/components/ProjectModuleBadge", () => ({
  default: ({ project }) => <div data-testid="module-badge">{project?.code}</div>,
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectTeacherInitials: vi.fn(() => "AB"),
  getProjectTeacherName: vi.fn(() => "Dr. Smith"),
  openTeacherProfile: (...args) => openTeacherProfileMock(...args),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((m) => m?.name ?? ""),
  openMemberProfile: (...args) => openMemberProfileMock(...args),
  getMemberKey: vi.fn((m) => String(m?.id ?? "")),
}));

import ProjectRowInfo, { ProjectModuleBadge } from "@/pages/group_work/components/ProjectRowInfo";

const baseProject = { id: 1, name: "Test Project" };
const members = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

it("renders project name button", () => {
  render(<ProjectRowInfo project={baseProject} members={[]} onProjectNavigate={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Open Test Project project details" })).toBeTruthy();
});

it("shows teacher avatar button when module_tutor_id is present", () => {
  render(
    <ProjectRowInfo
      project={{ ...baseProject, module_tutor_id: 5 }}
      members={[]}
      onProjectNavigate={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "View Dr. Smith's profile" })).toBeTruthy();
});

it("shows teacher avatar shell when no module_tutor_id", () => {
  render(<ProjectRowInfo project={baseProject} members={[]} onProjectNavigate={vi.fn()} />);
  expect(screen.queryByRole("button", { name: /profile/ })).toBeNull();
});

it("clicking teacher avatar calls openTeacherProfile", () => {
  render(
    <ProjectRowInfo
      project={{ ...baseProject, module_tutor_id: 5 }}
      members={[]}
      onProjectNavigate={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "View Dr. Smith's profile" }));
  expect(openTeacherProfileMock).toHaveBeenCalled();
});

it("renders avatar stack for members", () => {
  render(<ProjectRowInfo project={baseProject} members={members} totalMembers={2} onProjectNavigate={vi.fn()} />);
  expect(screen.getByText("2 members")).toBeTruthy();
});

it("renders singular member label for one member", () => {
  render(<ProjectRowInfo project={baseProject} members={[members[0]]} totalMembers={1} onProjectNavigate={vi.fn()} />);
  expect(screen.getByText("1 member")).toBeTruthy();
});

it("renders no avatar stack when count is zero", () => {
  render(<ProjectRowInfo project={baseProject} members={[]} totalMembers={0} onProjectNavigate={vi.fn()} />);
  expect(screen.queryByText(/member/)).toBeNull();
});

it("shows overflow badge when more than limit members", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `M${i}` }));
  render(<ProjectRowInfo project={baseProject} members={many} totalMembers={12} onProjectNavigate={vi.fn()} />);
  expect(screen.getByText("+3")).toBeTruthy();
});

it("shows owner pill when isOwner is true", () => {
  render(<ProjectRowInfo project={baseProject} members={[]} isOwner onProjectNavigate={vi.fn()} />);
  expect(screen.getByText("PROJECT OWNER")).toBeTruthy();
});

it("hides owner pill when isOwner is false", () => {
  render(<ProjectRowInfo project={baseProject} members={[]} isOwner={false} onProjectNavigate={vi.fn()} />);
  expect(screen.queryByText("PROJECT OWNER")).toBeNull();
});

it("renders action slot when provided", () => {
  render(
    <ProjectRowInfo
      project={baseProject}
      members={[]}
      action={<span data-testid="action-slot">Act</span>}
      onProjectNavigate={vi.fn()}
    />,
  );
  expect(screen.getByTestId("action-slot")).toBeTruthy();
});

it("clicking avatar button calls openMemberProfile", () => {
  render(<ProjectRowInfo project={baseProject} members={[members[0]]} totalMembers={1} onProjectNavigate={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Alice profile" }));
  expect(openMemberProfileMock).toHaveBeenCalled();
});

it("ProjectModuleBadge named export renders", () => {
  render(<ProjectModuleBadge project={{ code: "CS101" }} />);
  expect(screen.getByTestId("module-badge")).toBeTruthy();
});
