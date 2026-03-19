import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, layoutId, initial, animate, exit, transition, variants, whileHover, whileTap, layout, ...rest }) =>
      <div {...rest}>{children}</div>,
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../api/adminApi", () => ({
  fetchAdminUsers: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  fetchTeacherRequests: vi.fn(),
  resolveTeacherRequest: vi.fn(),
  fetchReportedSocieties: vi.fn(),
  dismissReport: vi.fn(),
  banReportedSociety: vi.fn(),
  fetchPendingRatifications: vi.fn(),
  approveRatification: vi.fn(),
  rejectRatification: vi.fn(),
  fetchCourseChangeRequests: vi.fn(),
  resolveCourseChangeRequest: vi.fn(),
}));

vi.mock("../../pages/Admin/AdminPage.module.css", () => ({ default: {} }));
vi.mock("../../components/Pagination/Pagination", () => ({
  Pagination: () => null,
}));

import * as api from "../../api/adminApi";
import AdminPage from "../../pages/Admin/AdminPage";

function setupDefaultMocks() {
  api.fetchAdminUsers.mockResolvedValue([]);
  api.fetchTeacherRequests.mockResolvedValue([]);
  api.fetchReportedSocieties.mockResolvedValue([]);
  api.fetchPendingRatifications.mockResolvedValue([]);
  api.fetchCourseChangeRequests.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaultMocks();
});

describe("AdminPage – Ratifications tab", () => {
  it("shows empty state when no ratifications", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Ratifications/));
    await waitFor(() =>
      expect(screen.getByText(/No societies are awaiting/i)).toBeTruthy(),
    );
  });

  it("renders society name with approve and reject buttons", async () => {
    api.fetchPendingRatifications.mockResolvedValue([
      { id: 10, name: "Chess Club", member_count: 5 },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Ratifications/));
    await waitFor(() => expect(screen.getByText("Chess Club")).toBeTruthy());
    expect(screen.getByText("✓ Approve")).toBeTruthy();
    expect(screen.getByText("✗ Reject")).toBeTruthy();
  });

  it("calls approveRatification and removes row", async () => {
    api.fetchPendingRatifications.mockResolvedValue([
      { id: 10, name: "Chess Club", member_count: 5 },
    ]);
    api.approveRatification.mockResolvedValue({});
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Ratifications/));
    await waitFor(() => screen.getByText("Chess Club"));
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() =>
      expect(api.approveRatification).toHaveBeenCalledWith(10),
    );
    await waitFor(() => expect(screen.queryByText("Chess Club")).toBeNull());
  });

  it("calls rejectRatification and removes row", async () => {
    api.fetchPendingRatifications.mockResolvedValue([
      { id: 11, name: "Drama Club", member_count: 3 },
    ]);
    api.rejectRatification.mockResolvedValue({});
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Ratifications/));
    await waitFor(() => screen.getByText("Drama Club"));
    fireEvent.click(screen.getByText("✗ Reject"));
    await waitFor(() =>
      expect(api.rejectRatification).toHaveBeenCalledWith(11),
    );
    await waitFor(() => expect(screen.queryByText("Drama Club")).toBeNull());
  });
});

describe("AdminPage – Teacher Requests tab", () => {
  it("shows empty state when no requests", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() =>
      expect(screen.getByText(/No pending teacher/i)).toBeTruthy(),
    );
  });

  it("renders pending teacher with approve and reject buttons", async () => {
    api.fetchTeacherRequests.mockResolvedValue([
      { id: 5, username: "jane", first_name: "Jane", last_name: "Doe", email: "j@d.com", role: "pending_teacher" },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(screen.getByText("✓ Approve")).toBeTruthy();
    expect(screen.getByText("✗ Reject")).toBeTruthy();
  });

  it("calls resolveTeacherRequest approve and removes row", async () => {
    api.fetchTeacherRequests.mockResolvedValue([
      { id: 5, username: "jane", first_name: "Jane", last_name: "Doe", email: "j@d.com", role: "pending_teacher" },
    ]);
    api.resolveTeacherRequest.mockResolvedValue({});
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() => screen.getByText("Jane Doe"));
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() =>
      expect(api.resolveTeacherRequest).toHaveBeenCalledWith(5, "approve"),
    );
    await waitFor(() => expect(screen.queryByText("Jane Doe")).toBeNull());
  });

  it("calls resolveTeacherRequest reject and removes row", async () => {
    api.fetchTeacherRequests.mockResolvedValue([
      { id: 6, username: "tom", first_name: "Tom", last_name: "X", email: "t@x.com", role: "pending_teacher" },
    ]);
    api.resolveTeacherRequest.mockResolvedValue({});
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() => screen.getByText("Tom X"));
    fireEvent.click(screen.getByText("✗ Reject"));
    await waitFor(() =>
      expect(api.resolveTeacherRequest).toHaveBeenCalledWith(6, "reject"),
    );
  });
});

describe("AdminPage – Reported Societies tab", () => {
  it("shows empty state when no reports", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() =>
      expect(screen.getByText(/No reported societies/i)).toBeTruthy(),
    );
  });

  it("renders report with society name and dismiss button", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Inappropriate" },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => expect(screen.getByText("Bad Club")).toBeTruthy());
    expect(screen.getByText("Ban")).toBeTruthy();
    expect(screen.getByText("Dismiss")).toBeTruthy();
  });

  it("shows reporter username in report row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 21, society_id: 56, society_name: "Test Club", reporter_username: "reporter1", reason: "Spam" },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => expect(screen.getByText(/reporter1/)).toBeTruthy());
  });

  it("calls dismissReport and removes row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Spam" },
    ]);
    api.dismissReport.mockResolvedValue(undefined);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getByText("Bad Club"));
    fireEvent.click(screen.getByText("Dismiss"));
    await waitFor(() => expect(api.dismissReport).toHaveBeenCalledWith(20));
    await waitFor(() => expect(screen.queryByText("Bad Club")).toBeNull());
  });

  it("calls banReportedSociety with reason", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Spam" },
    ]);
    api.banReportedSociety.mockResolvedValue({});
    vi.spyOn(window, "prompt").mockReturnValue("Policy breach");
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getByText("Bad Club"));
    fireEvent.click(screen.getByText("Ban"));
    await waitFor(() =>
      expect(api.banReportedSociety).toHaveBeenCalledWith(20, "Policy breach"),
    );
    window.prompt.mockRestore();
  });

  it("removes all reports for banned society", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Spam" },
      { id: 21, society_id: 55, society_name: "Bad Club", reporter_username: "bob", reason: "Abuse" },
    ]);
    api.banReportedSociety.mockResolvedValue({});
    vi.spyOn(window, "prompt").mockReturnValue("Policy breach");
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getAllByText("Bad Club"));
    fireEvent.click(screen.getAllByText("Ban")[0]);
    await waitFor(() => expect(screen.queryByText("Bad Club")).toBeNull());
    window.prompt.mockRestore();
  });

  it("emits navigate event for specific society when report row is clicked", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 30, society_id: 77, society_name: "Row Club", reporter_username: "alice", reason: "Spam" },
    ]);
    const navListener = vi.fn();
    window.addEventListener("navigate", navListener);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getByText("Row Club"));
    fireEvent.click(screen.getByText("Row Club"));
    await waitFor(() => expect(navListener).toHaveBeenCalled());
    expect(navListener.mock.calls[0][0].detail).toBe("societies_77");
    window.removeEventListener("navigate", navListener);
  });
});

describe("AdminPage – Course Change Requests tab", () => {
  it("shows empty state when no requests", async () => {
    api.fetchCourseChangeRequests.mockResolvedValue([]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Course Change Requests/));
    await waitFor(() =>
      expect(
        screen.getByText(/No pending course change requests/i),
      ).toBeTruthy(),
    );
  });

  it("renders pending requests", async () => {
    api.fetchCourseChangeRequests.mockResolvedValue([
      {
        id: 1, first_name: "Jane", last_name: "Doe", username: "janedoe",
        email: "jane@example.com", current_course: "Physics",
        requested_course: "Chemistry", status: "pending",
        created_at: "2024-01-01T00:00:00Z", resolved_at: null,
      },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Course Change Requests/));
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(screen.getByText(/Physics.*Chemistry/)).toBeTruthy();
  });

  it("calls resolveCourseChangeRequest with approve and removes row", async () => {
    api.fetchCourseChangeRequests.mockResolvedValue([
      {
        id: 5, first_name: "Bob", last_name: "Smith", username: "bob",
        email: "bob@example.com", current_course: "History",
        requested_course: "Law", status: "pending",
        created_at: "2024-01-01T00:00:00Z", resolved_at: null,
      },
    ]);
    api.resolveCourseChangeRequest.mockResolvedValue({ status: "approved" });
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Course Change Requests/));
    await waitFor(() => screen.getByText("Bob Smith"));
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() =>
      expect(api.resolveCourseChangeRequest).toHaveBeenCalledWith(5, "approve"),
    );
    await waitFor(() => expect(screen.queryByText("Bob Smith")).toBeNull());
  });
});
