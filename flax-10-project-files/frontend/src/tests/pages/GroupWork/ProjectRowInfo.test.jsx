import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const openTeacherProfile = vi.fn();
const openMemberProfile = vi.fn();
const getProjectTeacherInitials = vi.fn(() => "AB");
const getProjectTeacherName = vi.fn(() => "Ada Byron");
const getDisplayName = vi.fn((member) => member.name || member.username || "Unknown");

vi.mock("../../../components/common/Badge/Badge", () => ({
  default: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../../components/common/Tooltip/Tooltip", () => ({
  default: ({ children, content }) => <div data-tooltip={content}>{children}</div>,
}));

vi.mock("../../../pages/GroupWork/components/MemberAvatar", () => ({
  default: ({ member }) => <span>{member.name}</span>,
}));

vi.mock("../../../pages/GroupWork/utils/projectRowUtils", () => ({
  getProjectTeacherInitials: (...args) => getProjectTeacherInitials(...args),
  getProjectTeacherName: (...args) => getProjectTeacherName(...args),
  openTeacherProfile: (...args) => openTeacherProfile(...args),
}));

vi.mock("../../../pages/GroupWork/utils/memberAvatarUtils", () => ({
  getDisplayName: (...args) => getDisplayName(...args),
  openMemberProfile: (...args) => openMemberProfile(...args),
}));

import ProjectRowInfo, { ProjectModuleBadge } from "../../../pages/GroupWork/components/ProjectRowInfo";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ProjectRowInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders navigation, teacher profile, module badge, and member avatars", () => {
    const onProjectNavigate = vi.fn();
    renderWithRouter(
      <>
        <ProjectRowInfo
          project={{
            id: 1,
            name: "Capstone Project",
            course_code: "CS101",
            module_name: "Software Engineering",
            module_tutor_id: 22,
          }}
          members={[{ id: 1, name: "Alex" }, { id: 2, name: "Bea" }]}
          totalMembers={4}
          action={<button type="button">Open action</button>}
          onProjectNavigate={onProjectNavigate}
          isOwner
        />
        <ProjectModuleBadge project={{ course_code: "CS101", module_name: "Software Engineering" }} />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Open Capstone Project project details/i }));
    fireEvent.click(screen.getByRole("button", { name: /View Ada Byron's profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /Open Alex profile/i }));

    expect(onProjectNavigate).toHaveBeenCalledTimes(1);
    expect(openTeacherProfile).toHaveBeenCalled();
    expect(openMemberProfile).toHaveBeenCalled();
    expect(screen.getByText("PROJECT OWNER")).toBeInTheDocument();
    expect(screen.getByText("4 members")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Software Engineering module/i })).toHaveAttribute("href", "/modules?code=CS101");
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
