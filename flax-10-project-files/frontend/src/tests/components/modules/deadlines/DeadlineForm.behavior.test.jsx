import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../components/modules/utils/deadlineUtils", () => ({
  DEADLINE_TYPES: [
    { value: "coursework", label: "Coursework" },
    { value: "exam", label: "Exam" },
    { value: "presentation", label: "Presentation" },
  ],
  TYPES_WITH_END_DATE: ["exam"],
  TYPES_WITH_LOCATION: ["exam", "presentation"],
}));

vi.mock("../../../../components/common/animated_dropdown", () => ({
  default: ({ value, onChange, options }) => (
    <select aria-label="Type" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder, minDate }) => (
    <input
      aria-label={minDate ? "End date" : "Start date"}
      placeholder={placeholder}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../../components/common/inputs/LocationAutocomplete", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="Location input"
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../../components/modules/shared/moduleFormParts", () => ({
  ModuleFormField: ({ label, children }) => (
    <div>
      <span>{label}</span>
      {children}
    </div>
  ),
  ModuleFormFooter: ({ createLabel, error, isEditing, onCancel }) => (
    <div>
      {error ? <div>{error}</div> : null}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit">{isEditing ? "Update" : createLabel}</button>
    </div>
  ),
  buildValidationState: (error, validate) => ({ error, validate }),
  failValidation: (setError, message) => {
    setError(message);
    return false;
  },
  finishValidation: (setError) => {
    setError("");
    return true;
  },
  requireFieldValue: () => true,
}));

vi.mock("../../../../components/modules/deadlines/DeadlineForm.module.css", () => ({
  default: {},
}));

import DeadlineForm from "../../../../components/modules/deadlines/DeadlineForm";

describe("DeadlineForm coverage top-up", () => {
  it("serializes empty dates as an empty string and null when validation allows it", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DeadlineForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.submit(container.querySelector("form"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        start_due_date: "",
        end_due_date: null,
      }),
    );
  });

  it("serializes exam end dates and location changes", () => {
    const onSubmit = vi.fn();
    const { container } = render(<DeadlineForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "exam" } });
    fireEvent.change(screen.getAllByPlaceholderText("Pick date & time")[0], { target: { value: "2026-06-01T10:00" } });
    fireEvent.change(screen.getAllByPlaceholderText("Pick date & time")[1], { target: { value: "2026-06-01T12:30" } });
    fireEvent.change(screen.getByLabelText("Location input"), { target: { value: "Bush House" } });
    fireEvent.submit(container.querySelector("form"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        deadline_type: "exam",
        location: "Bush House",
        start_due_date: new Date("2026-06-01T10:00").toISOString(),
        end_due_date: new Date("2026-06-01T12:30").toISOString(),
      }),
    );
  });
});
