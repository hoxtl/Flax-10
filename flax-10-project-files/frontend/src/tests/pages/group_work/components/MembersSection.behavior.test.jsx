import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  openMemberProfileMock,
  resetMemberAvatarHarness,
} from "./__mocks__/memberAvatarHarness.jsx";
import MembersSection from "@/pages/group_work/components/MembersSection";

const makeMembers = () => [
  { id: "owner-1", name: "Olivia Owner", role: "owner" },
  { id: "dev-2", name: "Milo Dev", role: "collaborator" },
];

beforeEach(() => {
  vi.clearAllMocks();
  resetMemberAvatarHarness();
});

it("renders owner label and avatar", () => {
  const members = makeMembers();
  render(<MembersSection members={members} onRemove={vi.fn()} />);
  expect(screen.getByText("Owner")).toBeInTheDocument();
  expect(screen.getAllByTestId("member-avatar")[0]).toHaveTextContent(/Olivia Owner\s*\|\s*24/);
  expect(screen.getByTitle("Open Olivia Owner profile")).toBeInTheDocument();
});

it("hides owner remove button until allowed", () => {
  const members = makeMembers();
  const { rerender } = render(<MembersSection members={members} onRemove={vi.fn()} canRemove />);
  expect(screen.queryByRole("button", { name: "Leave project" })).toBeNull();
  rerender(<MembersSection members={members} onRemove={vi.fn()} canRemove allowOwnerRemove />);
  expect(screen.getByRole("button", { name: "Leave project" })).toBeInTheDocument();
});

it("removes collaborators when allowed", () => {
  const members = makeMembers();
  const handleRemove = vi.fn();
  render(<MembersSection members={members} onRemove={handleRemove} canRemove />);
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(handleRemove).toHaveBeenCalledWith("dev-2");
});

it("opens profile via pill button", () => {
  const members = makeMembers();
  render(<MembersSection members={members} onRemove={vi.fn()} />);
  fireEvent.click(screen.getByTitle("Open Olivia Owner profile"));
  expect(openMemberProfileMock).toHaveBeenCalledWith(expect.any(Object), members[0]);
});

it("shows empty message without members", () => {
  render(<MembersSection members={[]} onRemove={vi.fn()} />);
  expect(screen.getByText("No teammates added yet. Invite collaborators below.")).toBeInTheDocument();
});
