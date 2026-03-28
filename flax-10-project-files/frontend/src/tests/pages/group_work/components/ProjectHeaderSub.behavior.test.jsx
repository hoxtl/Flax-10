import { beforeEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "./__mocks__/projectHeaderSubHarness.jsx";
import {
  useToastMock,
  getCurrentMemberMock,
  resetProjectHeaderSubHarness,
} from "./__mocks__/projectHeaderSubHarness.jsx";
import ProjectHeaderActions from "@/pages/group_work/components/ProjectHeaderSub";

const makeProps = (overrides = {}) => ({
  project: { id: 1, name: "Test Project" },
  onDelete: vi.fn(),
  onMemberRemove: vi.fn(),
  isOwner: false,
  teamMembers: [],
  onBack: vi.fn(),
  onUpdate: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  resetProjectHeaderSubHarness();
});

it("shows Leave project button for non-owner", () => {
  render(<ProjectHeaderActions {...makeProps()} />);
  expect(screen.getByText("Leave project")).toBeTruthy();
});

it("hides Settings button for non-owner", () => {
  render(<ProjectHeaderActions {...makeProps()} />);
  expect(screen.queryByText("Settings")).toBeNull();
});

it("shows Settings and Delete project button for owner", () => {
  render(<ProjectHeaderActions {...makeProps({ isOwner: true })} />);
  expect(screen.getByText("Settings")).toBeTruthy();
  expect(screen.getByText("Delete project")).toBeTruthy();
});

it("clicking danger button opens modal for non-owner with leave label", () => {
  render(<ProjectHeaderActions {...makeProps()} />);
  fireEvent.click(screen.getByText("Leave project"));
  expect(screen.getByTestId("hold-confirm-modal")).toBeTruthy();
  expect(screen.getByText("Hold to leave")).toBeTruthy();
});

it("clicking danger button opens modal for owner with delete label", () => {
  render(<ProjectHeaderActions {...makeProps({ isOwner: true })} />);
  fireEvent.click(screen.getByText("Delete project"));
  expect(screen.getByTestId("hold-confirm-modal")).toBeTruthy();
  expect(screen.getByText("Hold to delete")).toBeTruthy();
});

it("cancel button hides the modal", () => {
  render(<ProjectHeaderActions {...makeProps()} />);
  fireEvent.click(screen.getByText("Leave project"));
  fireEvent.click(screen.getByText("Cancel"));
  expect(screen.queryByTestId("hold-confirm-modal")).toBeNull();
});

it("clicking Settings opens EditProjectModal", () => {
  render(<ProjectHeaderActions {...makeProps({ isOwner: true })} />);
  fireEvent.click(screen.getByText("Settings"));
  expect(screen.getByTestId("edit-project-modal")).toBeTruthy();
});

it("closing EditProjectModal removes it from the DOM", () => {
  render(<ProjectHeaderActions {...makeProps({ isOwner: true })} />);
  fireEvent.click(screen.getByText("Settings"));
  fireEvent.click(screen.getByText("Close edit"));
  expect(screen.queryByTestId("edit-project-modal")).toBeNull();
});

it("leave path: calls onMemberRemove, shows toast, and calls onBack", async () => {
  const showToast = vi.fn();
  useToastMock.mockReturnValue(showToast);
  getCurrentMemberMock.mockReturnValue({ id: 5 });
  const onMemberRemove = vi.fn().mockResolvedValue(true);
  const onBack = vi.fn();
  render(
    <ProjectHeaderActions
      {...makeProps({ onMemberRemove, onBack, isOwner: false })}
    />,
  );
  fireEvent.click(screen.getByText("Leave project"));
  fireEvent.click(screen.getByText("Hold to leave"));
  await waitFor(() => expect(onMemberRemove).toHaveBeenCalledWith(5));
  expect(showToast).toHaveBeenCalledWith("You left the project.");
  expect(onBack).toHaveBeenCalled();
});

it("owner delete path: calls onDelete and shows toast", async () => {
  const showToast = vi.fn();
  useToastMock.mockReturnValue(showToast);
  const onDelete = vi.fn().mockResolvedValue(true);
  render(
    <ProjectHeaderActions
      {...makeProps({ onDelete, isOwner: true })}
    />,
  );
  fireEvent.click(screen.getByText("Delete project"));
  fireEvent.click(screen.getByText("Hold to delete"));
  await waitFor(() => expect(onDelete).toHaveBeenCalled());
  expect(showToast).toHaveBeenCalledWith("Project deleted.");
});

it("leave path with no currentMember: does not call onMemberRemove", async () => {
  getCurrentMemberMock.mockReturnValue(null);
  const onMemberRemove = vi.fn();
  render(
    <ProjectHeaderActions
      {...makeProps({ onMemberRemove, isOwner: false })}
    />,
  );
  fireEvent.click(screen.getByText("Leave project"));
  fireEvent.click(screen.getByText("Hold to leave"));
  await waitFor(() => expect(onMemberRemove).not.toHaveBeenCalled());
});
