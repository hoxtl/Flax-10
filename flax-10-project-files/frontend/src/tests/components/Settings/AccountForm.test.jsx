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

// ── Fixtures ───────────────────────────────────────────────────────────────

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