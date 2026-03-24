import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useReadingModal = vi.fn();
const useClickOutside = vi.fn();

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

vi.mock("../../../components/Modules/shared/moduleFormParts", () => ({
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
  ModuleFormActions: ({ onCancel, isEditing, createLabel }) => (
    <div>
      <button type="submit">{isEditing ? "Save Reading" : createLabel}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  ),
  ModuleFormField: ({ label, children }) => <label>{label}{children}</label>,
}));

vi.mock("../../../components/common/StandardModal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <div>{title}</div>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/Modules/hooks/useReadingModal", () => ({
  useReadingModal: (...args) => useReadingModal(...args),
}));

vi.mock("../../../components/Modules/Readings/ReadingCard", () => ({
  default: ({ reading, onEdit, onDelete }) => (
    <div>
      <span>{reading.title}</span>
      <button type="button" onClick={onEdit}>edit-reading</button>
      <button type="button" onClick={onDelete}>delete-reading</button>
    </div>
  ),
}));

vi.mock("../../../components/common/SearchBar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

vi.mock("../../../components/common/SearchEmptyState/SearchEmptyState", () => ({
  default: ({ query, itemLabel }) => <div>{query}-{itemLabel}</div>,
}));

vi.mock("../../../components/common/hooks/useClickOutside", () => ({
  useClickOutside: (...args) => useClickOutside(...args),
}));

vi.mock("../../../components/Modules/Modules/useModuleCourseFilterState", () => ({
  useModuleCourseFilterState: () => ({
    isOpen: true,
    setIsOpen: vi.fn(),
    filterQuery: "",
    setFilterQuery: vi.fn(),
    expanded: {},
    toggleExpanded: vi.fn(),
    ref: { current: null },
  }),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Computing: ["Computer Science", "Software Engineering", "Data Science", "AI", "Cyber Security", "Robotics"],
    History: ["Modern History"],
  },
}));

import ReadingForm from "../../../components/Modules/Readings/ReadingForm";
import ReadingModal from "../../../components/Modules/Readings/ReadingModal";
import ModuleCourseFilter from "../../../components/Modules/Modules/ModuleCourseFilter";

describe("module reading and filter extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates reading forms and submits parsed reading data", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<ReadingForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Chapter notes" } });
    fireEvent.change(screen.getByLabelText("Start Page"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("End Page"), { target: { value: "12" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByText("Due date cannot be empty.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chapter (optional)"), { target: { value: "-2" } });
    fireEvent.change(screen.getByLabelText("End Page"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Pick due date & time"), { target: { value: "2026-03-30T09:30" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByText("Chapter cannot be negative.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chapter (optional)"), { target: { value: "2" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(screen.getByText("End page must be greater than or equal to start page.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("End Page"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Estimated Minutes (optional) - leave blank to auto-calculate"), { target: { value: "45" } });
    fireEvent.click(screen.getByText("Add Reading"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "Chapter notes",
      chapter: "2",
      start_page: 8,
      end_page: 12,
      estimated_minutes: 45,
    }));

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders reading modal list and edit/create branches", () => {
    const onClose = vi.fn();
    useReadingModal.mockReturnValueOnce({
      showForm: false,
      readings: [{ id: 1, title: "Intro" }],
      openCreate: vi.fn(),
      openEdit: vi.fn(),
      handleDelete: vi.fn(),
    });

    const firstRender = render(<ReadingModal module={{ id: 5, module_code: "CS101" }} onClose={onClose} />);
    fireEvent.click(screen.getByText("+ Add Reading"));
    fireEvent.click(screen.getByText("edit-reading"));
    fireEvent.click(screen.getByText("delete-reading"));
    fireEvent.click(screen.getByText("close-modal"));
    expect(onClose).toHaveBeenCalled();
    firstRender.unmount();

    useReadingModal.mockReturnValueOnce({
      showForm: true,
      editing: { id: 2, title: "Edit me" },
      handleSubmit: vi.fn(),
      close: vi.fn(),
    });
    render(<ReadingModal module={{ id: 5, module_code: "CS101" }} onClose={onClose} />);
    expect(screen.getByText("CS101 - Readings")).toBeInTheDocument();
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
    expect(screen.getByText("History")).toBeInTheDocument();
  });
});
