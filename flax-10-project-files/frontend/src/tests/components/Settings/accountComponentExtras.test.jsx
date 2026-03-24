import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

const requestCourseChange = vi.fn();
const getMyCourseChangeRequest = vi.fn();

vi.mock("../../../api/adminApi", () => ({
  requestCourseChange: (...args) => requestCourseChange(...args),
  getMyCourseChangeRequest: (...args) => getMyCourseChangeRequest(...args),
}));

vi.mock("../../../components/common/AnimatedDropdown/AnimatedDropdown", () => ({
  default: ({ onChange, placeholder }) => <button type="button" onClick={() => onChange("Physics")}>{placeholder}</button>,
}));

vi.mock("../../../components/common/InlineAlert/InlineAlert", () => ({
  default: ({ message }) => message ? <div>{message}</div> : null,
}));

vi.mock("../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/StandardModal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <div>{title}</div>
      <button type="button" onClick={onClose}>close-standard-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/Settings/ui/RequestDecisionNotice", () => ({
  default: () => <div>request-notice</div>,
}));

vi.mock("../../../components/common/RequestStatusCard/RequestStatusCard", () => ({
  default: ({ title, subtitle, onCancel, successMessage }) => (
    <div>
      <div>{title}</div>
      <div>{subtitle}</div>
      <div>{successMessage}</div>
      <button type="button" onClick={onCancel}>cancel-request</button>
    </div>
  ),
}));

vi.mock("../../../components/Settings/SettingsContextCard", () => ({
  default: ({ title, items }) => <div>{title}:{items.join("|")}</div>,
}));

vi.mock("../../../components/Settings/SettingsUI", () => ({
  SectionHeader: ({ title, description }) => <div>{title}:{description}</div>,
  SubmitButton: ({ label, savingLabel, isSaving }) => <button type="button">{isSaving ? savingLabel : label}</button>,
}));

vi.mock("../../../components/Settings/account/AccountInfoFields", () => ({
  PersonalInfoFields: ({ formData, onChange }) => (
    <div>
      <input aria-label="First name" value={formData.firstName} onChange={(event) => onChange({ target: { name: "firstName", value: event.target.value } })} />
    </div>
  ),
  YearField: ({ value, onChange }) => <input aria-label="Year" value={value} onChange={onChange} />,
}));

vi.mock("../../../components/Settings/account/accountCourseRequests", async () => {
  const actual = await vi.importActual("../../../components/Settings/account/accountCourseRequests");
  return {
    ...actual,
    groupedCourses: [{ label: "Science", options: [{ value: "Physics", label: "Physics" }] }],
  };
});

import CourseChangeModal from "../../../components/Settings/account/CourseChangeModal";
import CourseDisplay from "../../../components/Settings/account/CourseDisplay";
import AccountFormLayout from "../../../components/Settings/account/AccountFormLayout";
import useAccountFormState from "../../../components/Settings/account/useAccountFormState";

describe("account component extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders course display empty and pending states", () => {
    const onRequestClick = vi.fn();
    const onCancelRequest = vi.fn();
    const { rerender } = render(
      <CourseDisplay course="" pendingRequest={null} onRequestClick={onRequestClick} onCancelRequest={onCancelRequest} cancellingRequest={false} successMessage="" />,
    );

    expect(screen.getByText("No course set")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Request a course change/));
    expect(onRequestClick).toHaveBeenCalled();

    rerender(
      <CourseDisplay
        course="Physics"
        pendingRequest={{ requested_course: "Chemistry" }}
        onRequestClick={onRequestClick}
        onCancelRequest={onCancelRequest}
        cancellingRequest={false}
        successMessage="✓ Request sent."
      />,
    );
    expect(screen.getByText(/An admin will review your request shortly/)).toBeInTheDocument();
    expect(screen.getByText("✓ Request sent.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("cancel-request"));
    expect(onCancelRequest).toHaveBeenCalled();
  });

  it("validates, submits, and handles errors in the course change modal", async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    requestCourseChange.mockResolvedValueOnce({ requestedCourse: "Physics" });

    render(<CourseChangeModal onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByText("Submit Request"));
    expect(screen.getByText("Please tell us why you want to change course.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Tell us a bit/), { target: { value: "Better fit" } });
    fireEvent.click(screen.getByText("Submit Request"));
    expect(screen.getByText("Please select a course.")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Search for a course..."));
    fireEvent.click(screen.getByText("Submit Request"));
    await waitFor(() => expect(requestCourseChange).toHaveBeenCalledWith("Physics"));
    expect(onSuccess).toHaveBeenCalledWith({ requestedCourse: "Physics" }, "Physics");

    requestCourseChange.mockRejectedValueOnce(new Error("network failed"));
    render(<CourseChangeModal onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getAllByPlaceholderText(/Tell us a bit/)[1], { target: { value: "Another reason" } });
    fireEvent.click(screen.getAllByText("Search for a course...")[1]);
    fireEvent.click(screen.getAllByText("Submit Request")[1]);
    await waitFor(() => expect(screen.getByText("network failed")).toBeInTheDocument());
    fireEvent.click(screen.getAllByText("close-standard-modal")[1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders account form layout and pending-request fetch fallback paths", async () => {
    getMyCourseChangeRequest.mockResolvedValueOnce([{ status: "pending", desired_course: "Physics" }]);
    const state = renderHook(() => useAccountFormState({ first_name: "Ava", last_name: "Ng", email: "ava@example.com", year: "Year 2", major: "Maths" }));
    await waitFor(() => expect(state.result.current.pendingRequest?.requested_course).toBe("Physics"));

    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <AccountFormLayout
        onSubmit={onSubmit}
        formData={state.result.current.formData}
        handleChange={state.result.current.handleChange}
        currentCourse="Maths"
        pendingRequest={state.result.current.pendingRequest}
        onRequestClick={vi.fn()}
        onCancelRequest={vi.fn()}
        cancellingRequest={false}
        courseRequestNotice="Request sent."
        courseRequestError="Something went wrong"
        isSaving={false}
        hasUnsaved
        saveSignal={0}
      />,
    );

    expect(screen.getByText(/Personal Information/)).toBeInTheDocument();
    expect(screen.getByText(/Account setup/)).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Eve" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "Year 3" } });
    fireEvent.click(screen.getByText("Save Changes"));
    expect(onSubmit).toHaveBeenCalled();
  });
});
