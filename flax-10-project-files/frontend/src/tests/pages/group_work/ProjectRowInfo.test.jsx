import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const openTeacherProfile = vi.fn();
const openMemberProfile = vi.fn();
const getProjectTeacherInitials = vi.fn(() => "AB");
const getProjectTeacherName = vi.fn(() => "Ada Byron");
const getDisplayName = vi.fn((member) => member.name || member.username || "Unknown");

vi.mock("../../../components/common/badge/Badge", () => ({
  default: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../../components/common/tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../pages/group_work/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name}</span>,
}));

vi.mock("../../../pages/group_work/utils/projectRowUtils", () => ({
  getProjectTeacherInitials: (...args) => getProjectTeacherInitials(...args),
  getProjectTeacherName: (...args) => getProjectTeacherName(...args),
  openTeacherProfile: (...args) => openTeacherProfile(...args),
}));

vi.mock("../../../pages/group_work/utils/memberAvatarUtils", () => ({
  getDisplayName: (...args) => getDisplayName(...args),
  openMemberProfile: (...args) => openMemberProfile(...args),
}));

import ProjectRowInfo, { ProjectModuleBadge } from "../../../pages/group_work/components/ProjectRowInfo";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ProjectRowInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles project and user profile navigation", () => {
    const onProjectNavigate = vi.fn();
    renderWithRouter(
      <ProjectRowInfo
        project={{ id: 1, name: "Capstone", course_code: "CS101", module_name: "SE", module_tutor_id: 22 }}
        members={[{ id: 1, name: "Alex" }]}
        onProjectNavigate={onProjectNavigate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /details/i }));
    fireEvent.click(screen.getByRole("button", { name: /Ada Byron's profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /Alex profile/i }));

    expect(onProjectNavigate).toHaveBeenCalled();
    expect(openTeacherProfile).toHaveBeenCalled();
    expect(openMemberProfile).toHaveBeenCalled();
  });

  it("renders owner badge and member counts", () => {
    renderWithRouter(
      <ProjectRowInfo project={{ id: 1, name: "P1" }} members={[]} totalMembers={4} isOwner />
    );
    expect(screen.getByText("PROJECT OWNER")).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
  });

  it("renders correct module badge link", () => {
    renderWithRouter(<ProjectModuleBadge project={{ course_code: "CS101", module_name: "SE" }} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/modules?code=CS101");
  });

  it("renders fallback teacher shell and hides module/member extras when data is absent", () => {
    const { container } = renderWithRouter(
      <>
        <ProjectRowInfo
          project={{ id: 2, name: "Research Sprint" }}
          members={[]}
          totalMembers={0}
          onProjectNavigate={vi.fn()}
        />
        <ProjectModuleBadge project={{}} />
      </>,
    );

    expect(screen.queryByText("PROJECT OWNER")).not.toBeInTheDocument();
    expect(screen.queryByText(/member/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /module/i })).not.toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
  });
});
