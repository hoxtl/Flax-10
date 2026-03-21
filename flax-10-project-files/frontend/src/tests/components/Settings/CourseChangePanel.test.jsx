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
    vi.mocked(useAuth).mockReturnValue({
      profile: { role: "student" },
      loading: false,
      refreshProfile,
    });
    requestTeacherRole.mockResolvedValue({ message: "Request submitted!" });

    render(<CourseChangePanel user={{}} />);

    fireEvent.click(screen.getByText("Apply"));

    expect(screen.getByText("Apply for Teacher Role")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/teaching experience/i);

    // Required fields may block fully-empty submissions in JSDOM; use whitespace
    // so browser validation passes while our handler still treats it as "empty".
    fireEvent.change(textarea, { target: { value: " " } });
    fireEvent.click(screen.getByText("Submit Application"));
    expect(
      screen.getByText(/please tell us why you'd like to become a teacher/i),
    ).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Because I love teaching." } });

    fireEvent.click(screen.getByText("Submit Application"));

    expect(await screen.findByText("✓ Requested")).toBeInTheDocument();
    expect(screen.queryByText("Apply for Teacher Role")).toBeNull();
    expect(requestTeacherRole).toHaveBeenCalled();
    expect(refreshProfile).toHaveBeenCalled();
  });
});
