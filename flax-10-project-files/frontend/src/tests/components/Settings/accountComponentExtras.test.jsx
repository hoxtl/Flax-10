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
  default: ({ children, pill: _pill, ...props }) => <button {...props}>{children}</button>,
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
  SubmitButton: ({ label, savingLabel, isSaving }) => <button type="submit">{isSaving ? savingLabel : label}</button>,
}));

vi.mock("../../../components/Settings/account/AccountInfoFields", () => ({
  PersonalInfoFields: ({ formData, onChange }) => (
    <div>
      <input aria-label="First name" value={formData.firstName} onChange={(event) => onChange({ target: { name: "firstName", value: event.target.value } })} />
    </div>
  ),
  YearField: ({ value, onChange }) => <input aria-label="Year" value={value} onChange={onChange} />,
}));

vi.mock("../../../components/Settings/account/accountCourseRequests", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    groupedCourses: [{ label: "Science", options: [{ value: "Physics", label: "Physics" }] }],
  };
});

import CourseChangeModal from "../../../components/Settings/account/CourseChangeModal";
import CourseDisplay from "../../../components/Settings/account/CourseDisplay";
import AccountFormLayout from "../../../components/Settings/account/AccountFormLayout";
import useAccountFormState from "../../../components/Settings/account/useAccountFormState";

const defaultExternalUser = { first_name: "Ava", last_name: "Ng", email: "ava@example.com", year: "Year 2", major: "Maths" };

const renderCourseChangeModal = (props = {}) => {
  const { onClose = vi.fn(), onSuccess = vi.fn(), ...rest } = props;
  const utils = render(<CourseChangeModal onClose={onClose} onSuccess={onSuccess} {...rest} />);
  return { ...utils, onClose, onSuccess };
};

const submitCourseChangeForm = (container) => fireEvent.submit(container.querySelector("form"));

const fillReason = (value = "Better fit") => {
  fireEvent.change(screen.getByPlaceholderText(/Tell us a bit/), { target: { value } });
};

const selectPhysicsCourse = () => {
  fireEvent.click(screen.getByText("Search for a course..."));
};

const renderExternalAccountState = async (pendingValue = [{ status: "pending", desired_course: "Physics" }], externalUser = defaultExternalUser) => {
  getMyCourseChangeRequest.mockResolvedValueOnce(pendingValue);
  const state = renderHook(() => useAccountFormState(externalUser));
  await waitFor(() => {
    expect(state.result.current.currentCourse).toBe("Maths");
    expect(state.result.current.pendingRequest).toMatchObject({ requested_course: "Physics" });
  });
  return state;
};

const renderCourseDisplay = (props = {}) => {
  const defaultProps = {
    course: "",
    pendingRequest: null,
    onRequestClick: vi.fn(),
    onCancelRequest: vi.fn(),
    cancellingRequest: false,
    successMessage: "",
    ...props,
  };
  const utils = render(<CourseDisplay {...defaultProps} />);
  return { ...utils, ...defaultProps };
};

const buildAccountLayoutProps = (state, overrides = {}) => ({
  onSubmit: vi.fn((event) => event.preventDefault()),
  formData: state.result.current.formData,
  handleChange: state.result.current.handleChange,
  currentCourse: "Maths",
  pendingRequest: state.result.current.pendingRequest,
  onRequestClick: vi.fn(),
  onCancelRequest: vi.fn(),
  cancellingRequest: false,
  courseRequestNotice: "Request sent.",
  courseRequestError: "Something went wrong",
  isSaving: false,
  hasUnsaved: true,
  saveSignal: 0,
  ...overrides,
});

describe("account component extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows the empty course state and request CTA", () => {
    const { onRequestClick } = renderCourseDisplay();
    expect(screen.getByText("No course set")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Request a course change/));
    expect(onRequestClick).toHaveBeenCalled();
  });

  it("renders pending request details", () => {
    renderCourseDisplay({
      course: "Physics",
      pendingRequest: { requested_course: "Chemistry" },
      successMessage: "✓ Request sent.",
    });
    expect(screen.getByText(/An admin will review your request shortly/)).toBeInTheDocument();
    expect(screen.getByText("✓ Request sent.")).toBeInTheDocument();
  });

  it("allows pending request cancellation", () => {
    const onCancelRequest = vi.fn();
    renderCourseDisplay({
      course: "Physics",
      pendingRequest: { requested_course: "Chemistry" },
      onCancelRequest,
    });
    fireEvent.click(screen.getByText("cancel-request"));
    expect(onCancelRequest).toHaveBeenCalled();
  });

  it("requires a reason and course before submitting a change request", async () => {
    const { container, unmount } = renderCourseChangeModal();
    submitCourseChangeForm(container);
    expect(await screen.findByText("Please tell us why you want to change course.")).toBeInTheDocument();

    fillReason();
    submitCourseChangeForm(container);
    expect(await screen.findByText("Please select a course.")).toBeInTheDocument();
    unmount();
  });

  it("submits the selected course and forwards success callbacks", async () => {
    requestCourseChange.mockResolvedValueOnce({ requestedCourse: "Physics" });
    const { container, onSuccess, unmount } = renderCourseChangeModal();
    fillReason();
    selectPhysicsCourse();
    submitCourseChangeForm(container);
    await waitFor(() => expect(requestCourseChange).toHaveBeenCalledWith("Physics"));
    expect(onSuccess).toHaveBeenCalledWith({ requestedCourse: "Physics" }, "Physics");
    unmount();
  });

  it("surfaces server errors and lets the user close the modal", async () => {
    requestCourseChange.mockRejectedValueOnce(new Error("network failed"));
    const { container, onClose, onSuccess, unmount } = renderCourseChangeModal();
    fillReason("Another reason");
    selectPhysicsCourse();
    submitCourseChangeForm(container);
    await waitFor(() => expect(screen.getByText("network failed")).toBeInTheDocument());
    fireEvent.click(screen.getByText("close-standard-modal"));
    expect(onClose).toHaveBeenCalled();

    unmount();
    requestCourseChange.mockRejectedValueOnce({});
    const thirdModal = render(<CourseChangeModal onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/Tell us a bit/), { target: { value: "Fallback reason" } });
    fireEvent.click(screen.getByText("Search for a course..."));
    fireEvent.submit(thirdModal.container.querySelector("form"));
    await waitFor(() => expect(screen.getByText("Failed to submit. Please try again.")).toBeInTheDocument());
  });

  it("fetches pending requests for external users when auth is unavailable", async () => {
    const state = await renderExternalAccountState();
    expect(state.result.current.pendingRequest).toMatchObject({ requested_course: "Physics" });
    expect(state.result.current.currentCourse).toBe("Maths");
  });

  it("renders the account form layout and submits form changes", async () => {
    const state = await renderExternalAccountState();
    const props = buildAccountLayoutProps(state);
    render(<AccountFormLayout {...props} />);
    expect(screen.getByText(/Personal Information/)).toBeInTheDocument();
    expect(screen.getByText(/Account setup/)).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Eve" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "Year 3" } });
    fireEvent.submit(screen.getByText("Save Changes").closest("form"));
    expect(props.onSubmit).toHaveBeenCalled();
  });
});
