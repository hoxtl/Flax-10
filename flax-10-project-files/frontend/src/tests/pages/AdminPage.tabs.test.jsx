import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

function stripMotionProps(props) {
  const cleanProps = { ...props };
  delete cleanProps.layoutId;
  delete cleanProps.initial;
  delete cleanProps.animate;
  delete cleanProps.exit;
  delete cleanProps.transition;
  delete cleanProps.variants;
  delete cleanProps.whileHover;
  delete cleanProps.whileTap;
  delete cleanProps.layout;
  return cleanProps;
}

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => ({ children, ...props }) => <div {...stripMotionProps(props)}>{children}</div>,
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../api/adminApi", () => ({
  fetchAdminUsers: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  fetchReportedSocieties: vi.fn(),
  dismissReport: vi.fn(),
  banReportedSociety: vi.fn(),
  fetchPendingRatifications: vi.fn(),
  approveRatification: vi.fn(),
  rejectRatification: vi.fn(),
  fetchCourseChangeRequests: vi.fn(),
  resolveCourseChangeRequest: vi.fn(),
}));

vi.mock("../../pages/admin/styles/AdminPage.module.css", () => ({ default: {} }));
vi.mock("../../components/pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) =>
    totalPages > 1 ? (
      <div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Previous
        </button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    ) : null,
  BackToTop: () => null,
}));

import * as api from "../../api/adminApi";
import AdminPage from "../../pages/admin/AdminPage";

function setupDefaultMocks() {
  api.fetchAdminUsers.mockResolvedValue([]);
  api.fetchReportedSocieties.mockResolvedValue([]);
  api.fetchPendingRatifications.mockResolvedValue([]);
  api.fetchCourseChangeRequests.mockResolvedValue([]);
}

function buildRatification(index) {
  return {
    id: index + 1,
    name: `Society ${index + 1}`,
    member_count: index + 5,
  };
}

function buildReport(index, societyId = index + 100) {
  return {
    id: index + 1,
    society_id: societyId,
    society_name: `Reported Society ${index + 1}`,
    reporter_username: `reporter${index + 1}`,
    reason: "Policy breach",
  };
}

function buildCourseRequest(index) {
  return {
    id: index + 1,
    user_id: index + 50,
    first_name: `Student${index + 1}`,
    last_name: "Example",
    username: `student${index + 1}`,
    email: `student${index + 1}@example.com`,
    current_course: "Physics",
    requested_course: `Course ${index + 1}`,
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
    resolved_at: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaultMocks();
});

describe("AdminPage – Ratifications tab", () => {
  it("shows empty state when no ratifications", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
    await waitFor(() =>
      expect(screen.getByText(/No societies awaiting ratification/i)).toBeTruthy(),
    );
  });

  it("renders society name with approve and reject buttons", async () => {
    api.fetchPendingRatifications.mockResolvedValue([
      { id: 10, name: "Chess Club", member_count: 5 },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
    await waitFor(() => screen.getByText("Drama Club"));
    fireEvent.click(screen.getByText("✗ Reject"));
    await waitFor(() =>
      expect(api.rejectRatification).toHaveBeenCalledWith(11),
    );
    await waitFor(() => expect(screen.queryByText("Drama Club")).toBeNull());
  });

  it("paginates ratifications after 10 rows", async () => {
    api.fetchPendingRatifications.mockResolvedValue(
      Array.from({ length: 21 }, (_, index) => buildRatification(index)),
    );
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
    await waitFor(() => expect(screen.getByText("Society 1")).toBeTruthy());
    expect(screen.queryByText("Society 11")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Society 11")).toBeTruthy());
    expect(screen.queryByText("Society 1")).toBeNull();
    expect(screen.queryByText("Society 21")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Society 21")).toBeTruthy());
  });
});

describe("AdminPage – Reported Societies tab", () => {
  it("shows empty state when no reports", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() =>
      expect(screen.getByText(/No reported societies/i)).toBeTruthy(),
    );
  });

  it("renders report with society name and dismiss button", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Inappropriate" },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => expect(screen.getByText("Bad Club")).toBeTruthy());
    expect(screen.getByText("Ban")).toBeTruthy();
    expect(screen.getByText("Dismiss")).toBeTruthy();
  });

  it("shows reporter username in report row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 21, society_id: 56, society_name: "Test Club", reporter_username: "reporter1", reason: "Spam" },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => expect(screen.getByText(/reporter1/)).toBeTruthy());
  });

  it("calls dismissReport and removes row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Spam" },
    ]);
    api.dismissReport.mockResolvedValue(undefined);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
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
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => screen.getByText("Bad Club"));
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.change(screen.getByLabelText(/Optional note to the society creator/i), { target: { value: "Policy breach" } });
    fireEvent.click(screen.getByRole("button", { name: /Ban Society/i }));
    await waitFor(() =>
      expect(api.banReportedSociety).toHaveBeenCalledWith(20, "Policy breach"),
    );
  });

  it("removes all reports for banned society", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 20, society_id: 55, society_name: "Bad Club", reporter_username: "alice", reason: "Spam" },
      { id: 21, society_id: 55, society_name: "Bad Club", reporter_username: "bob", reason: "Abuse" },
    ]);
    api.banReportedSociety.mockResolvedValue({});
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => screen.getAllByText("Bad Club"));
    fireEvent.click(screen.getAllByText("Ban")[0]);
    fireEvent.click(screen.getByRole("button", { name: /Ban Society/i }));
    await waitFor(() => expect(screen.queryByText("Bad Club")).toBeNull());
  });

  it("emits navigate event for specific society when report row is clicked", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      { id: 30, society_id: 77, society_name: "Row Club", reporter_username: "alice", reason: "Spam" },
    ]);
    const navListener = vi.fn();
    window.addEventListener("navigate", navListener);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => screen.getByText("Row Club"));
    fireEvent.click(screen.getByText("Row Club"));
    await waitFor(() => expect(navListener).toHaveBeenCalled());
    expect(navListener.mock.calls[0][0].detail).toBe("societies_77");
    window.removeEventListener("navigate", navListener);
  });

  it("paginates reported societies after 10 rows", async () => {
    api.fetchReportedSocieties.mockResolvedValue(
      Array.from({ length: 21 }, (_, index) => buildReport(index)),
    );
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() => expect(screen.getByText("Reported Society 1")).toBeTruthy());
    expect(screen.queryByText("Reported Society 11")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Reported Society 11")).toBeTruthy());
    expect(screen.queryByText("Reported Society 1")).toBeNull();
    expect(screen.queryByText("Reported Society 21")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Reported Society 21")).toBeTruthy());
  });
});

describe("AdminPage – Course Change Requests tab", () => {
  it("shows empty state when no requests", async () => {
    api.fetchCourseChangeRequests.mockResolvedValue([]);
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Course Switch Requests/i }));
    await waitFor(() =>
      expect(screen.getByText(/No course switch requests/i)).toBeTruthy(),
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
    fireEvent.click(screen.getByRole("button", { name: /Course Switch Requests/i }));
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
    fireEvent.click(screen.getByRole("button", { name: /Course Switch Requests/i }));
    await waitFor(() => screen.getByText("Bob Smith"));
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() =>
      expect(api.resolveCourseChangeRequest).toHaveBeenCalledWith(5, "approve"),
    );
    await waitFor(() => expect(screen.queryByText("Bob Smith")).toBeNull());
  });

  it("paginates course change requests after 10 rows", async () => {
    api.fetchCourseChangeRequests.mockResolvedValue(
      Array.from({ length: 21 }, (_, index) => buildCourseRequest(index)),
    );
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Course Switch Requests/i }));
    await waitFor(() => expect(screen.getByText("Student1 Example")).toBeTruthy());
    expect(screen.queryByText("Student11 Example")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Student11 Example")).toBeTruthy());
    expect(screen.queryByText("Student1 Example")).toBeNull();
    expect(screen.queryByText("Student21 Example")).toBeNull();
    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("Student21 Example")).toBeTruthy());
  });
});
