import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("../../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../api/adminApi", () => ({
  requestTeacherRole: vi.fn(),
  cancelTeacherRoleRequest: vi.fn(),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Science: ["Physics", "Chemistry"],
    Arts: ["English", "History"],
  },
}));

import { requestTeacherRole, cancelTeacherRoleRequest } from "../../../api/adminApi";
import { useAuth } from "../../../context/AuthContext";
import CourseChangePanel from "../../../components/Settings/CourseChangePanel";

function setupStudentAuth(refreshProfile) {
  vi.mocked(useAuth).mockReturnValue({ profile: { role: "student" }, loading: false, refreshProfile });
  requestTeacherRole.mockResolvedValue({ message: "Request submitted!" });
}

function openApplyModal() {
  render(<CourseChangePanel user={{}} />);
  fireEvent.click(screen.getByText("Apply"));
  expect(screen.getByText("Apply for Teacher Role")).toBeInTheDocument();
}

function submitApplication(value) {
  const textarea = screen.getByPlaceholderText(/teaching experience/i);
  fireEvent.change(textarea, { target: { value } });
  fireEvent.click(screen.getByText("Submit Application"));
}

describe("CourseChangePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows loading state initially", () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: null,
      loading: true,
      refreshProfile: vi.fn(),
    });

    render(<CourseChangePanel user={{}} />);
    expect(screen.getByLabelText(/Loading role info/i)).toBeInTheDocument();
  });

  it("shows pending badge when role is pending_teacher", async () => {
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: "pending_teacher" },
      loading: false,
      refreshProfile: vi.fn(),
    });

    render(<CourseChangePanel user={{}} />);
    expect(await screen.findByText("Teacher request pending")).toBeInTheDocument();
  });

  it("student can open apply modal and submit", async () => {
    const refreshProfile = vi.fn();
    setupStudentAuth(refreshProfile);
    openApplyModal();
    // whitespace passes browser validation but our handler treats it as empty
    submitApplication(" ");
    expect(screen.getByText(/please tell us why you'd like to become a teacher/i)).toBeInTheDocument();
    submitApplication("Because I love teaching.");
    expect(await screen.findByText("✓ Requested")).toBeInTheDocument();
    expect(screen.queryByText("Apply for Teacher Role")).toBeNull();
    expect(requestTeacherRole).toHaveBeenCalled();
    expect(refreshProfile).toHaveBeenCalled();
  });
});
