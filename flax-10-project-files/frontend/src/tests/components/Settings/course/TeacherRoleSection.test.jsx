import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, renderHook, act } from "@testing-library/react";

const requestTeacherRoleMock = vi.fn();
const cancelTeacherRoleRequestMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("../../../../api/adminApi", () => ({
  requestTeacherRole: (...args) => requestTeacherRoleMock(...args),
  cancelTeacherRoleRequest: (...args) => cancelTeacherRoleRequestMock(...args),
}));

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: (...args) => useAuthMock(...args),
}));

vi.mock("../../../../components/common/InlineAlert/InlineAlert", () => ({
  default: ({ message }) => (message ? <div>{message}</div> : null),
}));

vi.mock("../../../../components/common/PrimaryButton/PrimaryButton", () => ({
  default: ({ children, pill: _pill, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/RequestStatusCard/RequestStatusCard", () => ({
  default: ({ title, subtitle, onCancel, cancelling, successMessage }) => (
    <div>
      <div>{title}</div>
      <div>{subtitle}</div>
      {successMessage ? <div>{successMessage}</div> : null}
      <button onClick={onCancel} disabled={cancelling}>Cancel request</button>
    </div>
  ),
}));

vi.mock("../../../../components/common/StandardModal/StandardModal", () => ({
  default: ({ title, subtitle, onClose, children }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <button onClick={onClose}>Close modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../../components/Settings/ui/RequestDecisionNotice", () => ({
  default: () => <div>Admin review notice</div>,
}));

vi.mock("../../../../components/Settings/SettingsContextCard", () => ({
  default: ({ title, body }) => (
    <div>
      <div>{title}</div>
      <div>{body}</div>
    </div>
  ),
}));

vi.mock("../../../../components/Settings/SettingsUI", () => ({
  SectionHeader: ({ title, description }) => (
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock("../../../../pages/Settings/Settings.module.css", () => ({ default: new Proxy({}, { get: (_, key) => key }) }));

import TeacherApplyModal from "../../../../components/Settings/course/TeacherApplyModal";
import TeacherRoleContent from "../../../../components/Settings/course/TeacherRoleContent";
import useTeacherRoleSection from "../../../../components/Settings/course/useTeacherRoleSection";
import {
  clearCachedTeacherRequest,
  getCachedTeacherRequest,
  setCachedTeacherRequest,
} from "../../../../components/Settings/course/teacherRequestCache";

describe("teacher role settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthMock.mockReturnValue({
      profile: { role: "student" },
      loading: false,
      refreshProfile: vi.fn(),
    });
    requestTeacherRoleMock.mockResolvedValue({ message: "Submitted!" });
    cancelTeacherRoleRequestMock.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("teacher request cache can set, clear, and fail safely", () => {
    expect(getCachedTeacherRequest()).toBe(false);
    setCachedTeacherRequest();
    expect(getCachedTeacherRequest()).toBe(true);
    clearCachedTeacherRequest();
    expect(getCachedTeacherRequest()).toBe(false);

    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getCachedTeacherRequest()).toBe(false);
    getSpy.mockRestore();
  });

  it("validates, submits, and surfaces API errors in the teacher apply modal", async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(<TeacherApplyModal onClose={onClose} onSuccess={onSuccess} />);
    const getForm = () => screen.getByRole("button", { name: "Submit Application" }).closest("form");

    fireEvent.submit(getForm());
    expect(screen.getByText("Please tell us why you'd like to become a teacher.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "I teach labs" } });
    fireEvent.submit(getForm());
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ message: "Submitted!" }));
    fireEvent.click(screen.getByText("Close modal"));
    expect(onClose).toHaveBeenCalled();

    requestTeacherRoleMock.mockRejectedValueOnce(new Error("Nope"));
    rerender(<TeacherApplyModal onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Second try" } });
    fireEvent.submit(getForm());
    expect(await screen.findByText("Nope")).toBeInTheDocument();
  });

  it("renders teacher role content for student, pending, and teacher states", () => {
    const baseSection = {
      status: null,
      message: "",
      cancelling: false,
      teacherNotice: "Request sent.",
      setShowModal: vi.fn(),
      handleCancelTeacher: vi.fn(),
    };

    const { rerender } = render(<TeacherRoleContent section={baseSection} liveRole="student" />);
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(baseSection.setShowModal).toHaveBeenCalledWith(true);
    expect(screen.getByText("Teacher access")).toBeInTheDocument();

    rerender(<TeacherRoleContent section={baseSection} liveRole="pending_teacher" />);
    expect(screen.getByText("Teacher request pending")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));
    expect(baseSection.handleCancelTeacher).toHaveBeenCalled();
    expect(screen.getByText("✓ Request sent.")).toBeInTheDocument();

    rerender(<TeacherRoleContent section={{ ...baseSection, status: "error", message: "Failed to submit." }} liveRole="teacher" />);
    expect(screen.getByText("You're a Teacher")).toBeInTheDocument();
    expect(screen.getByText("Failed to submit.")).toBeInTheDocument();
  });

  it("hook seeds cached notice, applies successfully, and cancels successfully", async () => {
    const refreshProfile = vi.fn();
    setCachedTeacherRequest();
    useAuthMock.mockReturnValue({
      profile: { role: "pending_teacher" },
      loading: false,
      refreshProfile,
    });

    const { result } = renderHook(() => useTeacherRoleSection());
    await waitFor(() => expect(result.current.teacherNotice).toBe("Request sent."));

    act(() => result.current.setShowModal(true));
    act(() => result.current.handleApplySuccess({ message: "Approved later" }));
    expect(result.current.status).toBe("done");
    expect(result.current.message).toBe("Approved later");
    expect(result.current.showModal).toBe(false);
    expect(refreshProfile).toHaveBeenCalled();
    expect(getCachedTeacherRequest()).toBe(true);

    await act(async () => {
      await result.current.handleCancelTeacher();
    });
    expect(result.current.cancelling).toBe(false);
    expect(result.current.teacherNotice).toBe("");
    expect(result.current.status).toBe(null);
    expect(getCachedTeacherRequest()).toBe(false);
  });

  it("hook exposes cancellation errors", async () => {
    cancelTeacherRoleRequestMock.mockRejectedValueOnce(new Error("Cancel failed"));
    const { result } = renderHook(() => useTeacherRoleSection());

    await act(async () => {
      await result.current.handleCancelTeacher();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.message).toBe("Cancel failed");
    expect(result.current.cancelling).toBe(false);
  });
});
