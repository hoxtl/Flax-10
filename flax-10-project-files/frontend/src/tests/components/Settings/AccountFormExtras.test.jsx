import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const hasAccountChanges = vi.fn();
const useAccountFormState = vi.fn();
const useCourseRequestFeedback = vi.fn();
const createAccountSubmitHandler = vi.fn();
const createCancelCourseRequestHandler = vi.fn();
const createCourseRequestSuccessHandler = vi.fn();
const requestCourseChange = vi.fn();

vi.mock("../../../components/Settings/account/accountFormConfig", () => ({
  hasAccountChanges: (...args) => hasAccountChanges(...args),
}));

vi.mock("../../../components/Settings/account/useAccountFormState", () => ({
  default: (...args) => useAccountFormState(...args),
}));

vi.mock("../../../components/Settings/account/useCourseRequestFeedback", () => ({
  default: (...args) => useCourseRequestFeedback(...args),
}));

vi.mock("../../../components/Settings/account/useCourseRequestActions", () => ({
  createAccountSubmitHandler: (...args) => createAccountSubmitHandler(...args),
  createCancelCourseRequestHandler: (...args) => createCancelCourseRequestHandler(...args),
  createCourseRequestSuccessHandler: (...args) => createCourseRequestSuccessHandler(...args),
}));

vi.mock("../../../api/adminApi", () => ({
  requestCourseChange: (...args) => requestCourseChange(...args),
}));

vi.mock("../../../components/Settings/account/AccountFormLayout", () => ({
  default: (props) => (
    <div>
      <button type="button" onClick={() => props.onRequestClick()}>open-course-modal</button>
      <button type="button" onClick={() => props.onCancelRequest()}>cancel-course-request</button>
      <button type="button" onClick={(event) => props.onSubmit(event)}>submit-account</button>
      <span>{props.currentCourse}</span>
      <span>{String(props.hasUnsaved)}</span>
    </div>
  ),
}));

vi.mock("../../../components/common/animated_dropdown/AnimatedDropdown", () => ({
  default: ({ value, onChange, options = [], placeholder }) => (
    <select aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select</option>
      {options.flatMap((group) => group.options || []).map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
}));

vi.mock("../../../components/common/inline_alert/InlineAlert", () => ({
  default: ({ message }) => message ? <div>{message}</div> : null,
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, pill: _pill, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ title, children, onClose }) => (
    <div>
      <h2>{title}</h2>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/Settings/ui/RequestDecisionNotice", () => ({
  default: () => <div>Decision notice</div>,
}));

vi.mock("../../../components/common/request_status_card/RequestStatusCard", () => ({
  default: ({ title, subtitle, onCancel, successMessage }) => (
    <div>
      <div>{title}</div>
      <div>{subtitle}</div>
      <div>{successMessage}</div>
      <button type="button" onClick={onCancel}>cancel-request</button>
    </div>
  ),
}));

vi.mock("../../../components/Settings/SettingsUI", () => ({
  SectionHeader: ({ title }) => <h3>{title}</h3>,
  SubmitButton: ({ label }) => <button type="submit">{label}</button>,
}));

vi.mock("../../../components/Settings/SettingsContextCard", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../components/Settings/account/AccountInfoFields", () => ({
  PersonalInfoFields: () => <div>Personal fields</div>,
  YearField: ({ value, onChange }) => <button type="button" onClick={() => onChange({ target: { value: "Year 3" } })}>{value}</button>,
}));

vi.mock("../../../components/Settings/account/accountCourseRequests", () => ({
  groupedCourses: [{ label: "Science", options: [{ value: "Physics BSc", label: "Physics BSc" }] }],
}));

import AccountFormContainer from "../../../components/Settings/account/AccountFormContainer";
import AccountFormLayout from "../../../components/Settings/account/AccountFormLayout";
import CourseDisplay from "../../../components/Settings/account/CourseDisplay";
import CourseChangeModal from "../../../components/Settings/account/CourseChangeModal";

const { default: RealAccountFormLayout } = await vi.importActual("../../../components/Settings/account/AccountFormLayout");

describe("Account form extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasAccountChanges.mockReturnValue(true);
    useAccountFormState.mockReturnValue({
      formData: { firstName: "Alice" },
      initialFormData: { firstName: "Alice" },
      handleChange: vi.fn(),
      currentCourse: "Physics",
      pendingRequest: null,
      refreshProfile: vi.fn(),
      setInitialFormData: vi.fn(),
      setPendingRequest: vi.fn(),
    });
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

  it("wires the account form container through its controller and modal", () => {
    const setShowModal = vi.fn();
    useCourseRequestFeedback.mockReturnValue({
      showModal: [true, setShowModal],
      cancellingRequest: [false, vi.fn()],
      courseRequestNotice: ["Saved", vi.fn()],
      courseRequestError: ["Oops", vi.fn()],
      saveSignal: [2, vi.fn()],
    });

    render(<AccountFormContainer user={{ id: 1 }} onSave={vi.fn()} isSaving={false} />);
    fireEvent.click(screen.getByText("open-course-modal"));
    expect(setShowModal).toHaveBeenCalledWith(true);
    expect(screen.getByText("Request Course Change")).toBeInTheDocument();
    fireEvent.click(screen.getByText("close-modal"));
    expect(setShowModal).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText("cancel-course-request"));
    expect(createCancelCourseRequestHandler).toHaveBeenCalled();
    expect(createAccountSubmitHandler).toHaveBeenCalled();
    expect(createCourseRequestSuccessHandler).toHaveBeenCalled();
  });

  it("renders the account layout and pending course request branch", () => {
    render(
      <RealAccountFormLayout
        onSubmit={vi.fn()}
        formData={{ year: "Year 2" }}
        handleChange={vi.fn()}
        currentCourse="Physics"
        pendingRequest={{ requested_course: "Maths" }}
        onRequestClick={vi.fn()}
        onCancelRequest={vi.fn()}
        cancellingRequest={false}
        courseRequestNotice="Sent"
        courseRequestError="Issue"
        isSaving={false}
        hasUnsaved
        saveSignal={1}
      />,
    );

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Issue")).toBeInTheDocument();
    expect(screen.getByText("Account setup")).toBeInTheDocument();
    expect(screen.getByText(/Course change request pending/)).toBeInTheDocument();
    expect(screen.getByText(/Maths/)).toBeInTheDocument();
  });

  it("renders request button and no-course fallback when there is no pending request", () => {
    const onRequestClick = vi.fn();
    render(
      <CourseDisplay
        course=""
        pendingRequest={null}
        onRequestClick={onRequestClick}
        onCancelRequest={vi.fn()}
        cancellingRequest={false}
      />,
    );

    expect(screen.getByText("No course set")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Request a course change/i));
    expect(onRequestClick).toHaveBeenCalled();
  });

  it("validates and submits course change requests", async () => {
    const onSuccess = vi.fn();
    requestCourseChange.mockResolvedValueOnce({ ok: true });

    render(<CourseChangeModal onClose={vi.fn()} onSuccess={onSuccess} />);
    const form = screen.getByRole("button", { name: "Submit Request" }).closest("form");

    fireEvent.submit(form);
    expect(screen.getByText("Please tell us why you want to change course.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/switch/i), { target: { value: "Need the correct degree" } });
    fireEvent.submit(form);
    expect(screen.getByText("Please select a course.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search for a course..."), { target: { value: "Physics BSc" } });
    fireEvent.submit(form);

    await waitFor(() => expect(requestCourseChange).toHaveBeenCalledWith("Physics BSc"));
    expect(onSuccess).toHaveBeenCalledWith({ ok: true }, "Physics BSc");
  });

  it("shows API errors from the course request modal", async () => {
    requestCourseChange.mockRejectedValueOnce(new Error("Denied"));
    render(<CourseChangeModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    const form = screen.getByRole("button", { name: "Submit Request" }).closest("form");

    fireEvent.change(screen.getByPlaceholderText(/switch/i), { target: { value: "Need a different course" } });
    fireEvent.change(screen.getByLabelText("Search for a course..."), { target: { value: "Physics BSc" } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText("Denied")).toBeInTheDocument());
  });
});
