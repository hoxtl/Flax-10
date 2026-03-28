import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import EditProjectModal from "@/pages/group_work/components/EditProjectModal";
import { useEditProjectForm } from "@/pages/group_work/components/useEditProjectForm";

vi.mock("@/pages/group_work/components/useEditProjectForm", () => ({
  useEditProjectForm: vi.fn(),
}));

vi.mock("@/components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div data-testid="standard-modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type, disabled }) => (
    <button onClick={onClick} type={type} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("@/pages/group_work/components/CreateProjectInputs", () => ({
  CreateProjectInputs: ({ data }) => <div data-testid="inputs">{data.name}</div>,
}));

describe("EditProjectModal", () => {
  const onUpdated = vi.fn();
  const onClose = vi.fn();
  const project = { id: 1, name: "Original Project" };
  const mockFormState = {
    form: { ...project },
    errorMessage: "",
    isSubmitting: false,
    change: vi.fn(),
    submit: vi.fn((e) => e.preventDefault()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useEditProjectForm.mockReturnValue(mockFormState);
  });

  it("renders with project data", () => {
    render(<EditProjectModal project={project} onUpdated={onUpdated} onClose={onClose} />);
    expect(screen.getByText("Project Settings")).toBeTruthy();
    expect(screen.getByTestId("inputs").textContent).toBe("Original Project");
  });

  it("handles close and cancel", () => {
    render(<EditProjectModal project={project} onUpdated={onUpdated} onClose={onClose} />);
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
    
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("handles successful update callback", async () => {
    let callback;
    useEditProjectForm.mockImplementation((proj, cb) => {
      callback = cb;
      return mockFormState;
    });

    render(<EditProjectModal project={project} onUpdated={onUpdated} onClose={onClose} />);
    
    act(() => {
      callback({ id: 1, name: "Updated" });
    });

    expect(onUpdated).toHaveBeenCalledWith({ id: 1, name: "Updated" });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows error message and saving state", () => {
    useEditProjectForm.mockReturnValue({ ...mockFormState, errorMessage: "Save error", isSubmitting: true });
    render(<EditProjectModal project={project} onUpdated={onUpdated} onClose={onClose} />);
    
    expect(screen.getByText("Save error")).toBeTruthy();
    expect(screen.getByText("Saving...")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
  });
});
