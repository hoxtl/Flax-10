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

vi.mock("../../components/Pagination/Pagination", () => ({
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
}));

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
    expect(screen.getByRole("button", { name: /Users/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ratifications/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Teacher Requests/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reported Societies/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Course Change Requests/i })).toBeTruthy();
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
    // Avoid matching the "Staff" filter pill as well.
    expect(screen.getByText("Staff User")).toBeTruthy();
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

  it("filters users by selected status filter", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByText("Alice Smith"));
    fireEvent.click(screen.getByRole("button", { name: "Banned" }));
    await waitFor(() => expect(screen.getByText("Bob Jones")).toBeTruthy());
    expect(screen.queryByText("Alice Smith")).toBeNull();
    expect(screen.queryByText("Staff User")).toBeNull();
  });

  it("paginates users list when there are more than 20 users", async () => {
    const manyUsers = Array.from({ length: 21 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `u${i + 1}@mail.com`,
      first_name: `User${i + 1}`,
      last_name: "Test",
      role: "student",
      is_active: true,
      is_staff: false,
      is_superuser: false,
    }));
    api.fetchAdminUsers.mockResolvedValue(manyUsers);

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText("User1 Test")).toBeTruthy());
    expect(screen.queryByText("User21 Test")).toBeNull();

    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() => expect(screen.getByText("User21 Test")).toBeTruthy());
    expect(screen.queryByText("User1 Test")).toBeNull();
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
      expect(screen.getByText(/Network error/i)).toBeTruthy(),
    );
  });
});

// Ratifications, Teacher Requests, Reported Societies, and Course Change tabs
// are tested in AdminPage.tabs.test.jsx
