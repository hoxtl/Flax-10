import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateProjectInputs } from "@/pages/group_work/components/CreateProjectInputs";

vi.mock("@/components/common/form_field/FormField", () => ({
  default: ({ label, children, error }) => (
    <div data-testid="form-field">
      <label>{label}</label>
      {error && <span data-testid="field-error">{error}</span>}
      {children}
    </div>
  ),
}));

vi.mock("@/components/common/text_input/TextInput", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input 
      data-testid="text-input" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
    />
  ),
}));

vi.mock("@/components/modules/components/UserModuleDropdown", () => ({
  default: ({ value, onChange, placeholder }) => (
    <select 
      data-testid="module-dropdown" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      <option value="CS101">CS101</option>
    </select>
  ),
}));

vi.mock("@/components/common/inputs/DateTimePicker", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input 
      data-testid="date-picker" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder} 
    />
  ),
}));

describe("CreateProjectInputs", () => {
  const onChange = vi.fn();
  const data = { name: "Test", course_code: "CS101", deadline: "2026-01-01" };
  const errors = { name: "Name error" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields with data and errors", () => {
    render(<CreateProjectInputs data={data} onChange={onChange} errors={errors} />);
    
    expect(screen.getByPlaceholderText("e.g. Machine Learning Research...")).toBeTruthy();
    expect(screen.getByTestId("field-error").textContent).toBe("Name error");
    expect(screen.getByText(/Project name/)).toBeTruthy();
  });

  it("handles name change", () => {
    render(<CreateProjectInputs data={data} onChange={onChange} errors={errors} />);
    const nameInput = screen.getByTestId("text-input");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    expect(onChange).toHaveBeenCalledWith("name", "New Name");
  });

  it("handles module change", () => {
    render(<CreateProjectInputs data={data} onChange={onChange} errors={errors} />);
    const moduleDropdown = screen.getByTestId("module-dropdown");
    fireEvent.change(moduleDropdown, { target: { value: "CS101" } });
    expect(onChange).toHaveBeenCalledWith("course_code", "CS101");
  });

  it("handles deadline change", () => {
    render(<CreateProjectInputs data={data} onChange={onChange} errors={errors} />);
    const datePicker = screen.getByTestId("date-picker");
    fireEvent.change(datePicker, { target: { value: "2026-12-31" } });
    expect(onChange).toHaveBeenCalledWith("deadline", "2026-12-31");
  });
});
