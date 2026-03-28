import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useReadingModal = vi.fn();
const useClickOutside = vi.fn();
const toggleExpanded = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/modules/shared/moduleFormParts", () => ({
  buildValidationState: (error, validate) => ({ error, validate }),
  failValidation: (setError, message) => {
    setError(message);
    return false;
  },
  requireFieldValue: (value, message, setError) => {
    if (value) return true;
    setError(message);
    return false;
  },
  ModuleFormFooter: ({ onCancel, isEditing, createLabel, error }) => (
    <div>
      {error ? <div>{error}</div> : null}
      <button type="submit">{isEditing ? "Save Reading" : createLabel}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  ),
  ModuleFormField: ({ label, children }) => <label>{label}{children}</label>,
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <div>{title}</div>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/modules/hooks/useReadingModal", () => ({
  useReadingModal: (...args) => useReadingModal(...args),
}));

vi.mock("../../../components/modules/readings/ReadingCard", () => ({
  default: ({ reading, onEdit, onDelete }) => (
    <div>
      <span>{reading.title}</span>
      <button type="button" onClick={onEdit}>edit-reading</button>
      <button type="button" onClick={onDelete}>delete-reading</button>
    </div>
  ),
}));

vi.mock("../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, itemLabel }) => <div>{query}-{itemLabel}</div>,
}));

vi.mock("../../../components/common/hooks/useClickOutside", () => ({
  useClickOutside: (...args) => useClickOutside(...args),
}));

vi.mock("../../../components/modules/modules/useModuleCourseFilterState", () => ({
  useModuleCourseFilterState: () => ({
    isOpen: true,
    setIsOpen: vi.fn(),
    filterQuery: "",
    setFilterQuery: vi.fn(),
    expanded: {},
    toggleExpanded,
    ref: { current: null },
  }),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Computing: ["Computer Science", "Software Engineering", "Data Science", "AI", "Cyber Security", "Robotics"],
    History: ["Modern History"],
  },
}));

import ReadingForm from "../../../components/modules/readings/ReadingForm";
import ReadingModal from "../../../components/modules/readings/ReadingModal";
import ModuleCourseFilter from "../../../components/modules/modules/ModuleCourseFilter";

describe("module reading and filter extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toggleExpanded.mockReset();
  });

  it("validates reading form required fields and numeric constraints", () => {
    const onSubmit = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Notes" } });
    fireEvent.change(screen.getByLabelText("Start Page"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("End Page"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByText("Due date cannot be empty.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pick due date & time"), { target: { value: "2026-03-30T09:30" } });
    fireEvent.change(screen.getByLabelText("Chapter (optional)"), { target: { value: "-1" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByText("Chapter cannot be negative.")).toBeInTheDocument();
  });

  it("submits parsed reading data when valid", () => {
    const onSubmit = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "N" } });
    fireEvent.change(screen.getByLabelText("Start Page"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("End Page"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Pick due date & time"), { target: { value: "2026-03-30T09:30" } });
    fireEvent.change(screen.getByLabelText("Estimated Minutes (optional) - leave blank to auto-calculate"), { target: { value: "10" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "N",
      start_page: 4,
      end_page: 9,
      estimated_minutes: 10,
      deadline: new Date("2026-03-30T09:30").toISOString(),
    }));
  });

  it("renders reading list and handles modal close", () => {
    const onClose = vi.fn();
    useReadingModal.mockReturnValue({ showForm: false, readings: [{ id: 1, title: "I" }], openCreate: vi.fn(), openEdit: vi.fn(), handleDelete: vi.fn() });
    render(<ReadingModal module={{ id: 5 }} onClose={onClose} />);
    fireEvent.click(screen.getByText("close-modal"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders edit branch in reading modal", () => {
    useReadingModal.mockReturnValue({ showForm: true, editing: { id: 2, title: "E" }, handleSubmit: vi.fn(), close: vi.fn() });
    render(<ReadingModal module={{ id: 5, module_code: "CS101" }} onClose={vi.fn()} />);
    expect(screen.getByText("Save Reading")).toBeInTheDocument();
  });

  it("renders module course filter groups, search, and expansion controls", () => {
    const onToggleCourse = vi.fn();
    render(<ModuleCourseFilter selectedCourses={["Computer Science"]} onToggleCourse={onToggleCourse} />);

    expect(useClickOutside).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Filter/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Computer Science"));
    expect(onToggleCourse).toHaveBeenCalledWith("Computer Science");
    fireEvent.click(screen.getByRole("button", { name: /\+ 1 more/i }));
    expect(toggleExpanded).toHaveBeenCalledWith("dept_Computing");
  });
});
