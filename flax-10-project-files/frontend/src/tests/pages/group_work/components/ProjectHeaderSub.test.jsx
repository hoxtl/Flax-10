import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ProjectHeaderActions from "@/pages/group_work/components/ProjectHeaderSub";
import { useToast } from "@/context/ToastContext";
import * as memberUtils from "@/pages/group_work/utils/memberAvatarUtils";

vi.mock("@/context/ToastContext", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getCurrentMember: vi.fn(),
}));

vi.mock("@/components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="hold-modal">
      <h2>{title}</h2>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, variant }) => (
    <button onClick={onClick} data-variant={variant}>{children}</button>
  ),
}));

vi.mock("@/pages/group_work/components/EditProjectModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="edit-modal">
      <button onClick={onClose}>Close Edit</button>
    </div>
  ),
}));

describe("ProjectHeaderActions", () => {
  const showToast = vi.fn();
  const onDelete = vi.fn();
  const onMemberRemove = vi.fn();
  const onBack = vi.fn();
  const onUpdate = vi.fn();
  const project = { id: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue(showToast);
  });

  it("renders owner actions and handles delete", async () => {
    onDelete.mockResolvedValue(true);
    render(<ProjectHeaderActions project={project} isOwner={true} onDelete={onDelete} onMemberRemove={onMemberRemove} onBack={onBack} onUpdate={onUpdate} />);
    
    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("Delete project")).toBeTruthy();

    fireEvent.click(screen.getByText("Settings"));
    expect(screen.getByTestId("edit-modal")).toBeTruthy();
    fireEvent.click(screen.getByText("Close Edit"));
    expect(screen.queryByTestId("edit-modal")).toBeNull();

    fireEvent.click(screen.getByText("Delete project"));
    expect(screen.getByTestId("hold-modal")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Delete project" })).toBeTruthy();
    
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm"));
    });
    
    expect(onDelete).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Project deleted.");
  });

  it("renders member actions and handles leave", async () => {
    onMemberRemove.mockResolvedValue(true);
    memberUtils.getCurrentMember.mockReturnValue({ id: "m1" });
    
    render(<ProjectHeaderActions project={project} isOwner={false} onDelete={onDelete} onMemberRemove={onMemberRemove} onBack={onBack} onUpdate={onUpdate} />);
    
    expect(screen.queryByText("Settings")).toBeNull();
    const leaveBtn = screen.getByRole("button", { name: /Leave project/ });
    fireEvent.click(leaveBtn);
    
    expect(screen.getByTestId("hold-modal")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Leave project" })).toBeTruthy();
    
    await act(async () => {
      fireEvent.click(screen.getByText("Confirm"));
    });
    
    expect(onMemberRemove).toHaveBeenCalledWith("m1");
    expect(showToast).toHaveBeenCalledWith("You left the project.");
    expect(onBack).toHaveBeenCalled();
  });

  it("handles modal cancel", () => {
    render(<ProjectHeaderActions isOwner={true} />);
    fireEvent.click(screen.getByText("Delete project"));
    expect(screen.getByTestId("hold-modal")).toBeTruthy();
    
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("hold-modal")).toBeNull();
  });
});
