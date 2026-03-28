import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import {
  getDisplayNameMock,
  getProjectTeacherNameMock,
  openMemberProfileMock,
  openTeacherProfileMock,
  resetProjectHeaderMetaHarness,
  setAuthProfile,
} from "./__mocks__/projectHeaderMetaHarness";
import { ProjectHeaderMeta, ProjectTeacherMeta, ProjectModuleTag } from "@/pages/group_work/components/ProjectHeaderMeta";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe("ProjectHeaderMeta", () => {
  const onMemberAdded = vi.fn();
  const onMemberRemove = vi.fn();
  const onDeleteProject = vi.fn();
  const project = { id: 1, teacher_name: "Dr. Smith" };

  beforeEach(() => {
    resetProjectHeaderMetaHarness();
    setAuthProfile({ id: "u1" });
    getProjectTeacherNameMock.mockReturnValue("Dr. Smith");
    getDisplayNameMock.mockImplementation((m) => m.name);
  });

  it("ProjectTeacherMeta renders when name is present", () => {
    render(<ProjectTeacherMeta project={project} />);
    expect(screen.getByText("Dr. Smith")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));
    expect(openTeacherProfileMock).toHaveBeenCalled();
  });

  it("ProjectTeacherMeta returns null when no name", () => {
    getProjectTeacherNameMock.mockReturnValue(null);
    render(<ProjectTeacherMeta project={{}} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders ProjectModuleTag", () => {
    render(<ProjectModuleTag project={project} />);
    expect(screen.getByTestId("module-badge")).toBeTruthy();
  });

  it("returns null when no members", () => {
    render(<ProjectHeaderMeta project={project} members={[]} teamMembers={[]} />);
    expect(screen.queryByText("Team")).toBeNull();
  });

  it("defaults teamMembers when omitted", () => {
    const members = [{ id: 1, user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} />);
    expect(screen.getByText("0 members")).toBeTruthy();
  });

  it("shows member count and opens modal", () => {
    const members = [{ id: 1, user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    fireEvent.click(screen.getByText("1 member"));
    expect(screen.getByTestId("standard-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("standard-modal")).toBeNull();
  });

  it("shows more badge when over limit", () => {
    const members = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `M${i}` }));
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    expect(screen.getByText("+3")).toBeTruthy();
  });

  it("toggles edit mode and renders panel", () => {
    const members = [{ id: "m1", user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    fireEvent.click(screen.getByText("Edit team"));
    expect(screen.getByTestId("add-member-form")).toBeTruthy();
    fireEvent.click(screen.getByText("Done"));
    expect(screen.queryByTestId("add-member-form")).toBeNull();
  });

  it("opens hold-confirm modal for solo owner", async () => {
    const members = [{ id: 1, user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} onDeleteProject={onDeleteProject} />);
    fireEvent.click(screen.getByText("Edit team"));
    fireEvent.click(within(screen.getByTestId("members-section")).getByText("Alice"));
    expect(screen.getByTestId("hold-confirm-modal")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText("Confirm")));
    expect(onDeleteProject).toHaveBeenCalled();
  });

  it("allows cancelling owner removal", () => {
    const members = [{ id: 1, user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    fireEvent.click(screen.getByText("Edit team"));
    fireEvent.click(within(screen.getByTestId("members-section")).getByText("Alice"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("hold-confirm-modal")).toBeNull();
  });

  it("removes non-solo member immediately", () => {
    const members = [
      { id: "m1", user: "u1", name: "Alice", role: "owner" },
      { id: "m2", user: "u2", name: "Bob", role: "member" },
    ];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} onMemberRemove={onMemberRemove} />);
    fireEvent.click(screen.getByText("Edit team"));
    fireEvent.click(within(screen.getByTestId("members-section")).getByText("Alice"));
    expect(onMemberRemove).toHaveBeenCalledWith("m1");
  });

  it("triggers member avatar click", () => {
    const members = [{ id: "m1", user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    fireEvent.click(screen.getByLabelText("Open Alice profile"));
    expect(openMemberProfileMock).toHaveBeenCalled();
  });

  it("handles non-owner profile", () => {
    setAuthProfile({ id: "u9" });
    const members = [{ id: "m1", user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    expect(screen.queryByText("Edit team")).toBeNull();
  });

  it("handles missing auth profile", () => {
    setAuthProfile(null);
    const members = [{ id: "m1", user: "u1", name: "Alice", role: "owner" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    expect(screen.queryByText("Edit team")).toBeNull();
  });

  it("handles solo non-owner member", () => {
    setAuthProfile({ id: "u1" });
    const members = [{ id: "m1", user: "u1", name: "Alex", role: "member" }];
    render(<ProjectHeaderMeta project={project} members={members} teamMembers={members} />);
    expect(screen.queryByText("Edit team")).toBeNull();
  });
});
