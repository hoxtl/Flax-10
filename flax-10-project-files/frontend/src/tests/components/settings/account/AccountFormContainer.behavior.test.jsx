/*
 * Tests for account form container display branches.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const getMyCourseChangeRequest = vi.fn();
const useAuth = vi.fn();
const hasAccountChanges = vi.fn();
const useCourseRequestFeedback = vi.fn();
const createAccountSubmitHandler = vi.fn();
const createCancelCourseRequestHandler = vi.fn();
const createCourseRequestSuccessHandler = vi.fn();

vi.mock("../../../../api/adminApi", () => ({
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequest(...args),
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuth(...args),
}));

vi.mock("../../../../components/settings/account/accountFormConfig", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    hasAccountChanges: (...args) => hasAccountChanges(...args),
  };
});

vi.mock("../../../../components/settings/account/useCourseRequestFeedback", () => ({
  default: (...args) => useCourseRequestFeedback(...args),
}));

vi.mock("../../../../components/settings/account/useCourseRequestActions", () => ({
  createAccountSubmitHandler: (...args) => createAccountSubmitHandler(...args),
  createCancelCourseRequestHandler: (...args) => createCancelCourseRequestHandler(...args),
  createCourseRequestSuccessHandler: (...args) => createCourseRequestSuccessHandler(...args),
}));

vi.mock("../../../../components/common/request_status_card/RequestStatusCard", () => ({
  default: ({ subtitle, successMessage }) => (
    <div>
      <div>{subtitle}</div>
      {successMessage ? <div>{successMessage}</div> : null}
    </div>
  ),
}));

vi.mock("../../../../components/common/inline_alert/InlineAlert", () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock("../../../../components/settings/components/SettingsContextCard", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../../components/settings/components/SettingsUI", () => ({
  FormInput: ({ id, name, label, value, onChange }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={name} value={value} onChange={onChange} />
    </label>
  ),
  FormSelect: ({ id, label, value, onChange, options = [] }) => (
    <label htmlFor={id}>
      {label}
      <select id={id} aria-label={label} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
  SectionHeader: ({ title }) => <div>{title}</div>,
  SubmitButton: ({ label }) => <button type="submit">{label}</button>,
}));

vi.mock("../../../../components/settings/account/AccountFormLayout", () => ({
  default: (props) => (
    <div>
      <div>{String(props.isTeacher)}</div>
      <button type="button" onClick={() => props.onRequestClick()}>open-request</button>
    </div>
  ),
}));

vi.mock("../../../../components/settings/account/CourseChangeModal", () => ({
  default: ({ onClose }) => <button type="button" onClick={onClose}>course-change-modal</button>,
}));

import { PersonalInfoFields, YearField } from "../../../../components/settings/account/AccountInfoFields";
import CourseDisplay from "../../../../components/settings/account/CourseDisplay";
import RealAccountFormLayout from "../../../../components/settings/account/AccountFormLayout";
import AccountFormContainer from "../../../../components/settings/account/AccountFormContainer";

describe("AccountFormContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getMyCourseChangeRequest.mockResolvedValue(null);
    useAuth.mockReturnValue({
      profile: null,
      loading: false,
      refreshProfile: vi.fn(),
    });
    hasAccountChanges.mockReturnValue(false);
    useCourseRequestFeedback.mockReturnValue({
      showModal: [false, vi.fn()],
      cancellingRequest: [false, vi.fn()],
      courseRequestNotice: ["", vi.fn()],
      courseRequestError: ["", vi.fn()],
      saveSignal: [0, vi.fn()],
    });
    createAccountSubmitHandler.mockReturnValue(vi.fn());
    createCancelCourseRequestHandler.mockReturnValue(vi.fn());
    createCourseRequestSuccessHandler.mockReturnValue(vi.fn());
  });

  it("renders the direct account info field components", () => {
    const onChange = vi.fn();
    render(
      <>
        <PersonalInfoFields
          formData={{ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" }}
          onChange={onChange}
        />
        <YearField value="Year 2" onChange={onChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText("First Name"), { target: { name: "firstName", value: "Grace" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "Year 3" } });

    expect(screen.getByDisplayValue("Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ada@example.com")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it("renders pending requests without a requested-course subtitle", () => {
    render(<CourseDisplay course="Physics" pendingRequest={{ requested_course: "" }} onRequestClick={vi.fn()} onCancelRequest={vi.fn()} cancellingRequest={false} successMessage="" />);
    expect(screen.getByText(/An admin will review your request shortly/)).toBeInTheDocument();
    expect(screen.queryByText("✓ ")).not.toBeInTheDocument();
  });

  it("hides year and course request controls for teachers", () => {
    render(
      <RealAccountFormLayout
        onSubmit={vi.fn((event) => event.preventDefault())}
        formData={{ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", year: "Year 2" }}
        handleChange={vi.fn()}
        currentCourse="Physics"
        pendingRequest={null}
        onRequestClick={vi.fn()}
        onCancelRequest={vi.fn()}
        cancellingRequest={false}
        courseRequestNotice=""
        courseRequestError=""
        isSaving={false}
        hasUnsaved={false}
        saveSignal={0}
        isTeacher
      />,
    );
    expect(screen.queryByLabelText("Year")).not.toBeInTheDocument();
    expect(screen.queryByText(/Request a course change/i)).not.toBeInTheDocument();
  });

  it("keeps the course request modal closed for students when the feedback state is closed", async () => {
    useCourseRequestFeedback.mockReturnValue({
      showModal: [false, vi.fn()],
      cancellingRequest: [false, vi.fn()],
      courseRequestNotice: ["", vi.fn()],
      courseRequestError: ["", vi.fn()],
      saveSignal: [0, vi.fn()],
    });

    render(<AccountFormContainer user={{ id: 1, role: "student" }} onSave={vi.fn()} isSaving={false} />);

    await waitFor(() => expect(getMyCourseChangeRequest).toHaveBeenCalled());
    expect(screen.queryByText("course-change-modal")).not.toBeInTheDocument();
  });

  it("never renders the course request modal for teachers even when feedback requests it", async () => {
    useCourseRequestFeedback.mockReturnValue({
      showModal: [true, vi.fn()],
      cancellingRequest: [false, vi.fn()],
      courseRequestNotice: ["", vi.fn()],
      courseRequestError: ["", vi.fn()],
      saveSignal: [0, vi.fn()],
    });

    render(<AccountFormContainer user={{ id: 2, role: "teacher" }} onSave={vi.fn()} isSaving={false} />);

    await waitFor(() => expect(getMyCourseChangeRequest).toHaveBeenCalled());
    expect(screen.queryByText("course-change-modal")).not.toBeInTheDocument();
  });
});
