import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, layoutId, ...p }) => {
          const {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            layout,
            ...rest
          } = p;
          return <div {...rest}>{children}</div>;
        },
    },
  ),
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

import * as api from "../../api/adminApi";
import AdminPage from "../../pages/Admin/AdminPage";

const USERS = [
  {
    id: 1,
    username: "alice",
    email: "a@a.com",
    first_name: "Alice",
    last_name: "Smith",
    role: "student",
    is_active: true,
    is_staff: false,
    is_superuser: false,
  },
  {
    id: 2,
    username: "bob",
    email: "b@b.com",
    first_name: "Bob",
    last_name: "Jones",
    role: "teacher",
    is_active: false,
    is_staff: false,
    is_superuser: false,
    ban_reason: "Spam",
  },
  {
    id: 3,
    username: "staff",
    email: "s@s.com",
    first_name: "Staff",
    last_name: "User",
    role: "student",
    is_active: true,
    is_staff: true,
    is_superuser: false,
  },
];

function setupDefaultMocks() {
  api.fetchAdminUsers.mockResolvedValue(USERS);
  api.fetchTeacherRequests.mockResolvedValue([]);
  api.fetchReportedSocieties.mockResolvedValue([]);
  api.fetchPendingRatifications.mockResolvedValue([]);
  api.fetchCourseChangeRequests.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaultMocks();
});

describe("AdminPage – shell", () => {
  it("renders the admin dashboard heading", () => {
    render(<AdminPage />);
    expect(screen.getByText("Admin Dashboard")).toBeTruthy();
  });

  it("renders all five tab buttons", () => {
    render(<AdminPage />);
    expect(screen.getByText(/Users/)).toBeTruthy();
    expect(screen.getByText(/Ratifications/)).toBeTruthy();
    expect(screen.getByText(/Teacher Requests/)).toBeTruthy();
    expect(screen.getByText(/Reported Societies/)).toBeTruthy();
    expect(screen.getByText(/Course Change Requests/)).toBeTruthy();
  });

  it("shows users tab content by default", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeTruthy());
  });

  it("switches to ratifications tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Ratifications/));
    await waitFor(() =>
      expect(screen.getByText(/No societies are awaiting/i)).toBeTruthy(),
    );
  });

  it("switches to teacher requests tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() =>
      expect(screen.getByText(/No pending teacher/i)).toBeTruthy(),
    );
  });

  it("switches to reported societies tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() =>
      expect(screen.getByText(/No reported societies/i)).toBeTruthy(),
    );
  });

  it("switches to course change requests tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Course Change Requests/));
    await waitFor(() =>
      expect(
        screen.getByText(/No pending course change requests/i),
      ).toBeTruthy(),
    );
  });
});

describe("AdminPage – Users tab", () => {
  it("renders all user names", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText("Alice Smith")).toBeTruthy());
    expect(screen.getByText("Bob Jones")).toBeTruthy();
  });

  it("shows Ban button for active non-staff user", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText("Ban")).toBeTruthy());
  });

  it("shows Unban button for inactive user", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText("Unban")).toBeTruthy());
  });

  it("shows Staff badge instead of ban button for staff user", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Staff User"));
    expect(screen.queryAllByText("Ban").length).toBe(1);
    expect(screen.getByText("Staff")).toBeTruthy();
  });

  it("filters users by search query", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "bob" },
    });
    expect(screen.queryByText("Alice Smith")).toBeNull();
    expect(screen.getByText("Bob Jones")).toBeTruthy();
  });

  it("shows empty state when search has no matches", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "zzznomatch" },
    });
    expect(screen.getByText(/No users found/i)).toBeTruthy();
  });

  it("opens ban modal when Ban clicked", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Ban"));
    fireEvent.click(screen.getByText("Ban"));
    expect(screen.getByText(/Ban alice\?/i)).toBeTruthy();
  });

  it("closes ban modal when Cancel clicked", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Ban"));
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/Ban alice\?/i)).toBeNull();
  });

  it("calls banUser with userId and reason on confirm", async () => {
    api.banUser.mockResolvedValue({});
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Ban"));
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.click(screen.getByText("Ban User"));
    await waitFor(() => expect(api.banUser).toHaveBeenCalledWith(1, ""));
  });

  it("calls unbanUser with correct userId", async () => {
    api.unbanUser.mockResolvedValue({});
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Unban"));
    fireEvent.click(screen.getByText("Unban"));
    await waitFor(() => expect(api.unbanUser).toHaveBeenCalledWith(2));
  });

  it("calls onNavChange with profile id when name clicked", async () => {
    const onNavChange = vi.fn();
    render(<AdminPage onNavChange={onNavChange} />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByText("Alice Smith"));
    expect(onNavChange).toHaveBeenCalledWith("profile_1");
  });

  it("shows error when fetch fails", async () => {
    api.fetchAdminUsers.mockRejectedValue(new Error("Network error"));
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByText(/Failed to load users/i)).toBeTruthy(),
    );
  });
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
      {
        id: 5,
        username: "jane",
        first_name: "Jane",
        last_name: "Doe",
        email: "j@d.com",
        role: "pending_teacher",
      },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Teacher Requests/));
    await waitFor(() => expect(screen.getByText("Jane Doe")).toBeTruthy());
    expect(screen.getByText("✓ Approve")).toBeTruthy();
    expect(screen.getByText("✗ Reject")).toBeTruthy();
  });

  it("calls resolveTeacherRequest approve and removes row", async () => {
    api.fetchTeacherRequests.mockResolvedValue([
      {
        id: 5,
        username: "jane",
        first_name: "Jane",
        last_name: "Doe",
        email: "j@d.com",
        role: "pending_teacher",
      },
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
      {
        id: 6,
        username: "tom",
        first_name: "Tom",
        last_name: "X",
        email: "t@x.com",
        role: "pending_teacher",
      },
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
      {
        id: 20,
        society_id: 55,
        society_name: "Bad Club",
        reporter_username: "alice",
        reason: "Inappropriate",
      },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => expect(screen.getByText("Bad Club")).toBeTruthy());
    expect(screen.getByText("Ban")).toBeTruthy();
    expect(screen.getByText("Dismiss")).toBeTruthy();
  });

  it("shows reporter username in report row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      {
        id: 21,
        society_id: 56,
        society_name: "Test Club",
        reporter_username: "reporter1",
        reason: "Spam",
      },
    ]);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => expect(screen.getByText(/reporter1/)).toBeTruthy());
  });

  it("calls dismissReport and removes row", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      {
        id: 20,
        society_id: 55,
        society_name: "Bad Club",
        reporter_username: "alice",
        reason: "Spam",
      },
    ]);
    api.dismissReport.mockResolvedValue(undefined);
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getByText("Bad Club"));
    fireEvent.click(screen.getByText("Dismiss"));
    await waitFor(() => expect(api.dismissReport).toHaveBeenCalledWith(20));
    await waitFor(() => expect(screen.queryByText("Bad Club")).toBeNull());
  });

  it("calls banReportedSociety and removes society rows", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      {
        id: 20,
        society_id: 55,
        society_name: "Bad Club",
        reporter_username: "alice",
        reason: "Spam",
      },
      {
        id: 21,
        society_id: 55,
        society_name: "Bad Club",
        reporter_username: "bob",
        reason: "Abuse",
      },
    ]);
    api.banReportedSociety.mockResolvedValue({});
    vi.spyOn(window, "prompt").mockReturnValue("Policy breach");
    render(<AdminPage />);
    fireEvent.click(screen.getByText(/Reported Societies/));
    await waitFor(() => screen.getAllByText("Bad Club"));
    fireEvent.click(screen.getByText("Ban"));
    await waitFor(() =>
      expect(api.banReportedSociety).toHaveBeenCalledWith(20, "Policy breach"),
    );
    await waitFor(() => expect(screen.queryByText("Bad Club")).toBeNull());
    window.prompt.mockRestore();
  });

  it("emits navigate event for specific society when report row is clicked", async () => {
    api.fetchReportedSocieties.mockResolvedValue([
      {
        id: 30,
        society_id: 77,
        society_name: "Row Club",
        reporter_username: "alice",
        reason: "Spam",
      },
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
        id: 1,
        first_name: "Jane",
        last_name: "Doe",
        username: "janedoe",
        email: "jane@example.com",
        current_course: "Physics",
        requested_course: "Chemistry",
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
        resolved_at: null,
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
        id: 5,
        first_name: "Bob",
        last_name: "Smith",
        username: "bob",
        email: "bob@example.com",
        current_course: "History",
        requested_course: "Law",
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
        resolved_at: null,
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
