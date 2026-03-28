import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "./__mocks__/motionAndTooltipMocks.jsx";
import {
  getProjectTeacherNameMock,
  openTeacherProfileMock,
  openMemberProfileMock,
  resetProjectHeaderMetaHarness,
  setAuthProfile,
  getLastMembersSectionProps,
} from "./__mocks__/projectHeaderMetaHarness.jsx";
import { ProjectHeaderMeta, ProjectTeacherMeta } from "@/pages/group_work/components/ProjectHeaderMeta";

const ownerMember = { id: "owner-1", user: "owner-1", name: "Owner One", role: "owner" };
const collaboratorMember = { id: "member-2", user: "member-2", name: "Dev Two", role: "member" };

const renderMeta = (overrides = {}) => render(
  <ProjectHeaderMeta
    project={{ id: "proj-1", ...overrides.project }}
    members={overrides.members ?? [ownerMember, collaboratorMember]}
    teamMembers={overrides.teamMembers ?? [ownerMember, collaboratorMember]}
    onMemberAdded={overrides.onMemberAdded ?? vi.fn()}
    onMemberRemove={overrides.onMemberRemove ?? vi.fn()}
    onDeleteProject={overrides.onDeleteProject ?? vi.fn()}
  />,
);

beforeEach(() => {
  resetProjectHeaderMetaHarness();
  setAuthProfile({ id: ownerMember.user });
});

it("renders teacher pill and opens profile", () => {
  getProjectTeacherNameMock.mockReturnValue("Dr. Ada");
  render(<ProjectTeacherMeta project={{ id: "proj-9" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Open Dr. Ada's profile" }));
  expect(openTeacherProfileMock).toHaveBeenCalledWith(expect.any(Object), { id: "proj-9" });
});

it("omits teacher pill when no instructor name", () => {
  getProjectTeacherNameMock.mockReturnValue(null);
  const { container } = render(<ProjectTeacherMeta project={{}} />);
  expect(container.firstChild).toBeNull();
});

it("shows overflow indicator when member strip exceeds limit", () => {
  const members = Array.from({ length: 12 }, (_, i) => ({ id: `m-${i}`, user: `m-${i}`, name: `M${i}`, role: "member" }));
  renderMeta({ members, teamMembers: members });
  expect(screen.getByText("+3")).toBeInTheDocument();
  expect(screen.getByLabelText("View 3 more members")).toBeInTheDocument();
});

it("toggles edit mode button label", () => {
  renderMeta();
  fireEvent.click(screen.getByRole("button", { name: "Edit team" }));
  expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
});

it("opens members modal from team count button", () => {
  renderMeta({ teamMembers: [ownerMember] });
  fireEvent.click(screen.getByText("1 member"));
  expect(screen.getByTestId("standard-modal")).toBeInTheDocument();
});

it("opens member profile buttons from avatar strip", () => {
  renderMeta();
  fireEvent.click(screen.getByLabelText("Open Owner One profile"));
  expect(openMemberProfileMock).toHaveBeenCalledWith(expect.any(Object), ownerMember);
});

it("shows owner removal modal before deleting solo projects", () => {
  const onDeleteProject = vi.fn();
  renderMeta({ members: [ownerMember], teamMembers: [ownerMember], onDeleteProject });
  fireEvent.click(screen.getByRole("button", { name: "Edit team" }));
  expect(getLastMembersSectionProps().allowOwnerRemove).toBe(true);
  fireEvent.click(within(screen.getByTestId("members-section")).getByText(ownerMember.name));
  fireEvent.click(screen.getByText("Confirm"));
  expect(onDeleteProject).toHaveBeenCalled();
});

it("removes collaborators immediately when another owner exists", () => {
  const onMemberRemove = vi.fn();
  renderMeta({ onMemberRemove });
  fireEvent.click(screen.getByRole("button", { name: "Edit team" }));
  fireEvent.click(within(screen.getByTestId("members-section")).getByText(collaboratorMember.name));
  expect(onMemberRemove).toHaveBeenCalledWith(collaboratorMember.id);
});

it("hides edit controls when viewer is not an owner", () => {
  setAuthProfile({ id: "observer" });
  renderMeta();
  expect(screen.queryByText("Edit team")).toBeNull();
});
