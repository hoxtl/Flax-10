import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../../../api/userService", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("../../../api/adminApi", () => ({
  getMyCourseChangeRequest: vi.fn(),
  requestCourseChange: vi.fn(),
  cancelCourseChangeRequest: vi.fn().mockResolvedValue(null),
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
  SectionHeader: ({ title, description }) => (
    <div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  ),
  SubmitButton: ({ label, isSaving, savingLabel, saveSignal = 0, savedLabel = "Saved!" }) => (
    <button type="submit">{isSaving ? savingLabel : saveSignal ? `✓ ${savedLabel}` : label}</button>
  ),
}));

vi.mock("../../../pages/Settings/Settings.module.css", () => ({ default: {} }));

import { getMyCourseChangeRequest } from "../../../api/adminApi";
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
  getMyCourseChangeRequest.mockResolvedValue(null);
});

describe("AccountForm - basic rendering", () => {
  it("renders first/last name and email fields", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice")).toBeTruthy();
      expect(screen.getByDisplayValue("Smith")).toBeTruthy();
      expect(screen.getByDisplayValue("alice@example.com")).toBeTruthy();
    });
  });

  it("renders Save Changes button", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy();
    });
  });

  it("shows Saving... when isSaving is true", () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={true} />);
    expect(screen.getByText("Saving...")).toBeTruthy();
  });
});

describe("AccountForm - course display", () => {
  it("shows locked course display and request button when user has a major", async () => {
    render(
      <AccountForm
        user={{ ...baseUser, major: "Physics" }}
        onSave={vi.fn()}
        isSaving={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Physics")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: /request a course change/i }),
      ).toBeTruthy();
    });
  });

  it("shows 'No course set' when user has no major", async () => {
    render(<AccountForm user={baseUser} onSave={vi.fn()} isSaving={false} />);

    await waitFor(() => {
      expect(screen.getByText(/No course set/i)).toBeTruthy();
    });
  });
});

describe("AccountForm - submission", () => {
  it("calls onSave with changed form data", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <AccountForm user={baseUser} onSave={onSave} isSaving={false} />,
    );

    await waitFor(() => screen.getByDisplayValue("Alice"));

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Bob" },
    });

    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Bob",
        lastName: "Smith",
        email: "alice@example.com",
        year: "Year 2",
      }),
    );
  });

  it("shows saved tick after a successful account save", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <AccountForm user={baseUser} onSave={onSave} isSaving={false} />,
    );

    await waitFor(() => screen.getByDisplayValue("Alice"));

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Bob" },
    });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saved!/i })).toBeTruthy();
    });
  });
});
