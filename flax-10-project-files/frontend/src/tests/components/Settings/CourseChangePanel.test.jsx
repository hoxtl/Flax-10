import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("../../../api/adminApi", () => ({
  getMyCourseChangeRequest: vi.fn(),
  requestCourseChange: vi.fn(),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Science: ["Physics", "Chemistry"],
    Arts: ["English", "History"],
  },
}));

import {
  getMyCourseChangeRequest,
  requestCourseChange,
} from "../../../api/adminApi";
import CourseChangePanel from "../../../components/Settings/CourseChangePanel";

describe("CourseChangePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    getMyCourseChangeRequest.mockReturnValue(new Promise(() => {}));
    render(<CourseChangePanel user={{}} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows the form when no existing request", async () => {
    getMyCourseChangeRequest.mockResolvedValue(null);
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/submit request/i)).toBeInTheDocument(),
    );
  });

  it("shows pending badge when request is pending", async () => {
    getMyCourseChangeRequest.mockResolvedValue({
      status: "pending",
      requested_course: "Physics",
      current_course: "Chemistry",
    });
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/course change pending/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/submit request/i)).not.toBeInTheDocument();
  });

  it("shows approved badge when request is approved", async () => {
    getMyCourseChangeRequest.mockResolvedValue({
      status: "approved",
      requested_course: "Physics",
      current_course: "Chemistry",
    });
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/course change approved/i)).toBeInTheDocument(),
    );
  });

  it("shows rejected badge and form when request is rejected", async () => {
    getMyCourseChangeRequest.mockResolvedValue({
      status: "rejected",
      requested_course: "Physics",
      current_course: "Chemistry",
    });
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/course change rejected/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/submit request/i)).toBeInTheDocument();
  });

  it("shows error when submitting with no course selected", async () => {
    getMyCourseChangeRequest.mockResolvedValue(null);
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/submit request/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText(/submit request/i));
    await waitFor(() =>
      expect(screen.getByText(/please select a course/i)).toBeInTheDocument(),
    );
  });

  it("submits a request successfully", async () => {
    getMyCourseChangeRequest.mockResolvedValue(null);
    requestCourseChange.mockResolvedValue({
      status: "pending",
      requested_course: "Physics",
      current_course: "",
    });
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/submit request/i)).toBeInTheDocument(),
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Physics" } });
    fireEvent.click(screen.getByText(/submit request/i));
    await waitFor(() =>
      expect(screen.getByText(/submitted/i)).toBeInTheDocument(),
    );
    expect(requestCourseChange).toHaveBeenCalledWith("Physics");
  });

  it("shows error when submission fails", async () => {
    getMyCourseChangeRequest.mockResolvedValue(null);
    requestCourseChange.mockRejectedValue(new Error("Already pending"));
    render(<CourseChangePanel user={{}} />);
    await waitFor(() =>
      expect(screen.getByText(/submit request/i)).toBeInTheDocument(),
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Physics" } });
    fireEvent.click(screen.getByText(/submit request/i));
    await waitFor(() =>
      expect(screen.getByText(/already pending/i)).toBeInTheDocument(),
    );
  });
});
