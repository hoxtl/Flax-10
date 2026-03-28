import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectRowInfo from "@/pages/group_work/components/ProjectRowInfo";
import * as rowUtils from "@/pages/group_work/utils/projectRowUtils";
import * as memberUtils from "@/pages/group_work/utils/memberAvatarUtils";

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("@/pages/group_work/components/MemberAvatar", () => ({
  default: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("@/pages/group_work/components/ProjectModuleBadge", () => ({
  default: () => <div data-testid="module-badge">Module</div>,
}));

vi.mock("@/pages/group_work/utils/projectRowUtils", () => ({
  getProjectTeacherInitials: vi.fn(() => "JD"),
  getProjectTeacherName: vi.fn(() => "John Doe"),
  openTeacherProfile: vi.fn(),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: vi.fn((m) => m.name),
  openMemberProfile: vi.fn(),
  getMemberKey: vi.fn((m) => m.id),
}));

describe("ProjectRowInfo", () => {
  const onProjectNavigate = vi.fn();
  const project = { id: 1, name: "Test Project", module_tutor_id: 101 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic info as owner with action", () => {
    const action = <button data-testid="test-action">Action</button>;
    render(<ProjectRowInfo project={project} members={[]} isOwner={true} action={action} onProjectNavigate={onProjectNavigate} />);
    
    expect(screen.getByText("Test Project")).toBeTruthy();
    expect(screen.getByText("PROJECT OWNER")).toBeTruthy();
    expect(screen.getByTestId("test-action")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Test Project"));
    expect(onProjectNavigate).toHaveBeenCalled();
  });

  it("renders teacher avatar button when module_tutor_id is present", () => {
    render(<ProjectRowInfo project={project} members={[]} />);
    const teacherBtn = screen.getByLabelText("View John Doe's profile");
    expect(teacherBtn).toBeTruthy();
    
    fireEvent.click(teacherBtn);
    expect(rowUtils.openTeacherProfile).toHaveBeenCalled();
  });

  it("renders teacher avatar shell when module_tutor_id is missing", () => {
    render(<ProjectRowInfo project={{ ...project, module_tutor_id: null }} members={[]} />);
    expect(screen.queryByLabelText("View John Doe's profile")).toBeNull();
    expect(screen.getByText("JD")).toBeTruthy();
  });

  it("renders avatar stack with count and handles 'member' vs 'members'", () => {
    const members = [{ id: 1, name: "Alice" }];
    const { rerender } = render(<ProjectRowInfo project={project} members={members} />);
    expect(screen.getByText("1 member")).toBeTruthy();
    
    rerender(<ProjectRowInfo project={project} members={[...members, { id: 2, name: "Bob" }]} />);
    expect(screen.getByText("2 members")).toBeTruthy();
  });

  it("handles more than 10 members in avatar stack", () => {
    const members = Array.from({ length: 15 }, (_, i) => ({ id: i, name: `M${i}` }));
    render(<ProjectRowInfo project={project} members={members} totalMembers={15} />);
    
    expect(screen.getByText("+6")).toBeTruthy();
    expect(screen.queryAllByTestId("avatar").length).toBe(9); // limit 10: 9 + 1 (+6)
  });

  it("handles clicking member avatar", () => {
    const members = [{ id: 1, name: "Alice" }];
    render(<ProjectRowInfo project={project} members={members} />);
    
    fireEvent.click(screen.getByLabelText("Open Alice profile"));
    expect(memberUtils.openMemberProfile).toHaveBeenCalled();
  });
});
