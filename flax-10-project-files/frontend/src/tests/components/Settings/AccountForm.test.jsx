import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../api/userService", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("../../../api/adminApi", () => ({
  requestTeacherRole: vi.fn(),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Science: ["Physics", "Chemistry"],
    Arts: ["English", "History"],
  },
}));

vi.mock("../../../components/Settings/SettingsUI", () => ({
  FormInput: ({ label, name, value, onChange, type = "text", required }) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
      />
    </div>
  ),
  FormSelect: ({ id, label, value, onChange, options, grouped }) => (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} name={id} value={value} onChange={onChange}>
        {grouped
          ? options.map((g) =>
              g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              )),
            )
          : options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
      </select>
    </div>
  ),
  SectionHeader: ({ title }) => <h3>{title}</h3>,
  SubmitButton: ({ label, isSaving, savingLabel }) => (
    <button type="submit">{isSaving ? savingLabel : label}</button>
  ),
}));

vi.mock("../../../pages/Settings/Settings.module.css", () => ({ default: {} }));

import { getUserProfile } from "../../../api/userService";
import { requestTeacherRole } from "../../../api/adminApi";
import AccountForm from "../../../components/Settings/AccountForm";

const baseUser = {
  first_name: "Alice",
  last_name: "Smith",
  email: "alice@example.com",
  year: "Year 2",
  major: "",
  role: "student",
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getUserProfile.mockResolvedValue({ ...baseUser });
});

describe("AccountForm – basic rendering", () => {
  it("renders first and last name fields", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice")).toBeTruthy();
      expect(screen.getByDisplayValue("Smith")).toBeTruthy();
    });
  });

  it("renders email field", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("alice@example.com")).toBeTruthy(),
    );
  });

  it("renders Save Changes button", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy(),
    );
  });

  it("shows Saving... when isSaving is true", () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={true} />);
    expect(screen.getByText("Saving...")).toBeTruthy();
  });

  it("shows locked course when user has a major", async () => {
    getUserProfile.mockResolvedValue({ ...baseUser, major: "Physics" });
    render(
      <AccountForm
        user={{ ...baseUser, major: "Physics" }}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Physics")).toBeTruthy();
      expect(screen.getByText(/cannot be changed after/i)).toBeTruthy();
    });
  });

  it("shows editable course field when user has no major", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() =>
      expect(screen.getByText(/choose carefully/i)).toBeTruthy(),
    );
  });

  it("handles getUserProfile error gracefully", async () => {
    getUserProfile.mockRejectedValue(new Error("Network error"));
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() => expect(screen.getByDisplayValue("Alice")).toBeTruthy());
  });
});

describe("AccountForm – submission", () => {
  it("calls onSave with correct form data", async () => {
    const onSave = vi.fn();
    const { container } = render(
      <AccountForm user={baseUser} onSave={onSave} isSaving={false} />,
    );
    await waitFor(() => screen.getByDisplayValue("Alice"));
    fireEvent.submit(container.querySelector("form"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
      }),
    );
  });
});

describe("AccountForm – teacher role section (student)", () => {
  it('shows "Become a Teacher" for students', async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() =>
      expect(screen.getByText(/Become a Teacher/i)).toBeTruthy(),
    );
  });

  it("shows the request button for students", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);
    await waitFor(() =>
      expect(screen.getByText(/Request Teacher Role/i)).toBeTruthy(),
    );
  });
});