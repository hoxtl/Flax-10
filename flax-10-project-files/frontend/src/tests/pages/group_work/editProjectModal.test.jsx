/*
 * Tests for EditProjectModal and useEditProjectForm.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, renderHook } from "@testing-library/react";

const patchGroupProject = vi.fn();

vi.mock("../../../pages/group_work/api/groupWorkApi", () => ({
  patchGroupProject: (...args) => patchGroupProject(...args),
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, title, onClose }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type = "button", disabled }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("../../../pages/group_work/components/CreateProjectInputs", () => ({
  CreateProjectInputs: ({ data, onChange }) => (
    <div>
      <input aria-label="project-name" value={data.name} onChange={(e) => onChange("name", e.target.value)} />
      <input aria-label="project-deadline" value={data.deadline} onChange={(e) => onChange("deadline", e.target.value)} />
    </div>
  ),
}));

vi.mock("../../../pages/group_work/components/CreateProjectForm.module.css", () => ({
  default: { modalForm: "modalForm", formFields: "formFields", formError: "formError", formFooter: "formFooter" },
}));

import EditProjectModal from "../../../pages/group_work/components/EditProjectModal";
import { useEditProjectForm } from "../../../pages/group_work/components/useEditProjectForm";

const baseProject = { id: 10, name: "Old Name", course_code: "CS101", deadline: "2026-04-01" };

describe("EditProjectModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the modal with Project Settings title", () => {
    render(<EditProjectModal project={baseProject} onUpdated={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Project Settings")).toBeInTheDocument();
  });

  it("calls onClose when the modal close button is clicked", () => {
    const onClose = vi.fn();
    render(<EditProjectModal project={baseProject} onUpdated={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("close-modal"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const onClose = vi.fn();
    render(<EditProjectModal project={baseProject} onUpdated={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onUpdated and onClose on successful form submission", async () => {
    const updated = { id: 10, name: "New Name" };
    patchGroupProject.mockResolvedValue(updated);
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    render(<EditProjectModal project={baseProject} onUpdated={onUpdated} onClose={onClose} />);
    fireEvent.submit(screen.getByLabelText("project-name").closest("form"));
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not crash when onUpdated is not provided", async () => {
    patchGroupProject.mockResolvedValue({ id: 10, name: "New Name" });
    const onClose = vi.fn();
    render(<EditProjectModal project={baseProject} onClose={onClose} />);
    fireEvent.submit(screen.getByLabelText("project-name").closest("form"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows an error when the project name is empty", async () => {
    render(<EditProjectModal project={{ ...baseProject, name: "" }} onUpdated={vi.fn()} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByLabelText("project-name").closest("form"));
    await waitFor(() => expect(screen.getByText("Project name is required.")).toBeInTheDocument());
    expect(patchGroupProject).not.toHaveBeenCalled();
  });

  it("shows Saving… text on submit button while submitting", async () => {
    patchGroupProject.mockImplementation(() => new Promise(() => {}));
    render(<EditProjectModal project={baseProject} onUpdated={vi.fn()} onClose={vi.fn()} />);
    fireEvent.submit(screen.getByLabelText("project-name").closest("form"));
    await waitFor(() => expect(screen.getByText("Saving...")).toBeInTheDocument());
  });
});

describe("useEditProjectForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("initialises form fields from the project prop", () => {
    const { result } = renderHook(() => useEditProjectForm(baseProject, vi.fn()));
    expect(result.current.form.name).toBe("Old Name");
    expect(result.current.form.deadline).toBe("2026-04-01");
    expect(result.current.form.course_code).toBe("CS101");
  });

  it("change updates a specific form field", () => {
    const { result } = renderHook(() => useEditProjectForm(baseProject, vi.fn()));
    act(() => result.current.change("name", "Updated Name"));
    expect(result.current.form.name).toBe("Updated Name");
  });

  it("returns error and skips API call when name is empty", async () => {
    const { result } = renderHook(() => useEditProjectForm({ ...baseProject, name: "" }, vi.fn()));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(result.current.errorMessage).toBe("Project name is required.");
    expect(patchGroupProject).not.toHaveBeenCalled();
  });

  it("returns error and skips API call when deadline is empty", async () => {
    const { result } = renderHook(() => useEditProjectForm({ ...baseProject, deadline: "" }, vi.fn()));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(result.current.errorMessage).toBe("Due date is required.");
    expect(patchGroupProject).not.toHaveBeenCalled();
  });

  it("calls patchGroupProject and onUpdated on success", async () => {
    const onUpdated = vi.fn();
    const updated = { id: 10, name: "Old Name" };
    patchGroupProject.mockResolvedValue(updated);
    const { result } = renderHook(() => useEditProjectForm(baseProject, onUpdated));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(patchGroupProject).toHaveBeenCalledWith(10, expect.objectContaining({ name: "Old Name" }));
    expect(onUpdated).toHaveBeenCalledWith(updated);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("sets error message from thrown Error on API failure", async () => {
    patchGroupProject.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useEditProjectForm(baseProject, vi.fn()));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(result.current.errorMessage).toBe("Network error");
    expect(result.current.isSubmitting).toBe(false);
  });

  it("sets fallback error message when API throws without a message", async () => {
    patchGroupProject.mockRejectedValue({});
    const { result } = renderHook(() => useEditProjectForm(baseProject, vi.fn()));
    await act(async () => { await result.current.submit({ preventDefault: vi.fn() }); });
    expect(result.current.errorMessage).toBe("Failed to update project.");
  });
});
