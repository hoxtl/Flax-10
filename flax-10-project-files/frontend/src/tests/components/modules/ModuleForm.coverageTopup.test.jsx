import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const createModuleMock = vi.fn();
const updateModuleMock = vi.fn();
const validateFormMock = vi.fn(() => ({}));

const blankForm = () => ({
  department: "",
  course: "",
  module_code: "",
  module_name: "",
  description: "",
  location: "",
  start_time: "",
  end_time: "",
  is_recurring: false,
});

const getFormDataMock = vi.fn(() => blankForm());
const updateFormMock = vi.fn((module) => ({
  department: module.department || "",
  course: module.course || "",
  module_code: module.module_code || "",
  module_name: module.module_name || module.name || "",
  description: module.description || "",
  location: module.location || "",
  start_time: module.start_time || "",
  end_time: module.end_time || "",
  is_recurring: Boolean(module.is_recurring),
}));

vi.mock("../../../api/moduleApi", () => ({
  createModule: (...args) => createModuleMock(...args),
  updateModule: (...args) => updateModuleMock(...args),
}));

vi.mock("../../../components/modules/utils/moduleUtils", () => ({
  serialiseModule: (data) => data,
}));

vi.mock("../../../components/modules/utils/moduleHelpers", () => ({
  validateForm: (...args) => validateFormMock(...args),
  getFormData: (...args) => getFormDataMock(...args),
  updateForm: (...args) => updateFormMock(...args),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Engineering: ["Mechanical Engineering", "Electrical Engineering"],
    Arts: ["Fine Art"],
  },
}));

vi.mock("../../../components/common/animated_dropdown/AnimatedDropdown", () => ({
  default: ({ value, onChange, options, placeholder }) => (
    <select aria-label={placeholder} value={value || ""} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, variant, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../components/modules/modules/ModuleForm.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

import ModuleForm from "../../../components/modules/modules/ModuleForm";

describe("ModuleForm coverage top-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getFormDataMock.mockImplementation(() => blankForm());
    createModuleMock.mockResolvedValue({ id: 99, saved: true });
    updateModuleMock.mockResolvedValue({ id: 7, saved: true });
  });

  it("covers the create flow handlers for dropdowns, text inputs, time pickers, and recurring toggle", async () => {
    const onSuccess = vi.fn();

    render(<ModuleForm onSuccess={onSuccess} onCancel={vi.fn()} />);

    expect(screen.getByText("Create New Module")).toBeInTheDocument();
    expect(screen.getByText("Fill in the details to create a new module")).toBeInTheDocument();
    expect(screen.getByLabelText("Select a department first")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Select a department..."), {
      target: { value: "Engineering" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Select a course...")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Select a course..."), {
      target: { value: "Mechanical Engineering" },
    });

    fireEvent.change(screen.getByPlaceholderText("e.g., 5CCS2SEG"), {
      target: { value: "CS101" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., Software Engineering"), {
      target: { value: "Software Engineering" },
    });
    fireEvent.change(screen.getByPlaceholderText("Brief description of the module..."), {
      target: { value: "Core systems module" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g., Bush House, 2.09"), {
      target: { value: "Bush House" },
    });
    fireEvent.change(screen.getAllByLabelText("Pick date & time")[0], {
      target: { value: "2026-04-01T09:00" },
    });
    fireEvent.change(screen.getAllByLabelText("Pick date & time")[1], {
      target: { value: "2026-04-01T11:00" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(document.querySelector("form"));

    await waitFor(() => {
      expect(createModuleMock).toHaveBeenCalledWith(
        expect.objectContaining({
          department: "Engineering",
          course: "Mechanical Engineering",
          module_code: "CS101",
          module_name: "Software Engineering",
          description: "Core systems module",
          location: "Bush House",
          start_time: "2026-04-01T09:00",
          end_time: "2026-04-01T11:00",
          is_recurring: true,
        }),
      );
    });

    expect(onSuccess).toHaveBeenCalledWith({ id: 99, saved: true }, true);
  });

  it("renders locked department, course, and module code fields while editing", async () => {
    render(
      <ModuleForm
        module={{
          id: 7,
          department: "Engineering",
          course: "Mechanical Engineering",
          module_code: "CS101",
          module_name: "Software Engineering",
          description: "Core systems module",
          location: "Bush House",
          start_time: "2026-04-01T09:00",
          end_time: "2026-04-01T11:00",
          is_recurring: false,
        }}
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Edit Module")).toBeInTheDocument();
    expect(screen.getByText("Update the module details below")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineering")).toBeDisabled();
    expect(screen.getByDisplayValue("Mechanical Engineering")).toBeDisabled();
    expect(screen.getByDisplayValue("CS101")).toBeDisabled();

    fireEvent.submit(document.querySelector("form"));

    await waitFor(() => {
      expect(updateModuleMock).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          module_name: "Software Engineering",
        }),
      );
    });
  });

  it("falls back to an empty course option list when the selected department is unknown", () => {
    getFormDataMock.mockReturnValue({
      ...blankForm(),
      department: "Unknown Department",
    });

    render(<ModuleForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const courseDropdown = screen.getByLabelText("Select a course...");
    expect(courseDropdown.querySelectorAll("option")).toHaveLength(1);
  });
});
