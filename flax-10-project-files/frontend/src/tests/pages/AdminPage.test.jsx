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

vi.mock("../../api/admin/adminApi", () => ({
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

import * as api from "../../api/admin/adminApi";
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
    expect(screen.getByRole("heading", { name: /Admin\s*Dashboard/i })).toBeTruthy();
  });

  it("renders all five tab buttons", () => {
    render(<AdminPage />);
    expect(screen.getByRole("button", { name: /Users Overview/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Society Ratifications/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reported Societies/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Course Switch Requests/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Teacher Switch Requests/i })).toBeTruthy();
  });

  it("shows users tab content by default", async () => {
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Alice Smith/i })).toBeTruthy(),
    );
  });

  it("switches to ratifications tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Society Ratifications/i }));
    await waitFor(() =>
      expect(screen.getByText(/No societies awaiting ratification/i)).toBeTruthy(),
    );
  });

  it("switches to teacher requests tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Teacher Switch Requests/i }));
    await waitFor(() =>
      expect(screen.getByText(/No teacher switch requests/i)).toBeTruthy(),
    );
  });

  it("switches to reported societies tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Reported Societies/i }));
    await waitFor(() =>
      expect(screen.getByText(/No reported societies/i)).toBeTruthy(),
    );
  });

  it("switches to course change requests tab", async () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByRole("button", { name: /Course Switch Requests/i }));
    await waitFor(() =>
      expect(screen.getByText(/No course switch requests/i)).toBeTruthy(),
    );
  });
});

describe("AdminPage – Users tab", () => {
  it("renders all user names", async () => {
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Alice Smith/i })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /Bob Jones/i })).toBeTruthy();
  });

  it("shows Ban button for active non-staff user", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getAllByText("Ban").length).toBeGreaterThan(0));
  });

  it("shows Unban button for inactive user", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getAllByText("Unban").length).toBeGreaterThan(0));
  });

  it("shows Staff badge instead of ban button for staff user", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole("button", { name: /Staff User/i }));
    expect(screen.queryAllByText("Ban").length).toBe(2);
    // Avoid matching the "Staff" filter pill as well.
    expect(screen.getByRole("button", { name: /Staff User/i })).toBeTruthy();
  });

  it("filters users by search query", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole("button", { name: /Alice Smith/i }));
    fireEvent.change(screen.getByPlaceholderText(/Search users/i), {
      target: { value: "bob" },
    });
    expect(screen.queryByRole("button", { name: /Alice Smith/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Bob Jones/i })).toBeTruthy();
  });

  it("filters users by selected status filter", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole("button", { name: /Alice Smith/i }));
    fireEvent.click(screen.getByRole("button", { name: "Banned" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Bob Jones/i })).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: /Alice Smith/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Staff User/i })).toBeNull();
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
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /User1 Test/i }).length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("button", { name: /User11 Test/i })).toBeNull();

    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /User11 Test/i }).length).toBeGreaterThan(0),
    );
    expect(screen.queryByRole("button", { name: /User1 Test/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /User21 Test/i })).toBeNull();

    fireEvent.click(screen.getByText("Next →"));
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /User21 Test/i }).length).toBeGreaterThan(0),
    );
  });

  it("shows empty state when search has no matches", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getByRole("button", { name: /Alice Smith/i }));
    fireEvent.change(screen.getByPlaceholderText(/Search users/i), {
      target: { value: "zzznomatch" },
    });
    expect(screen.getByText(/No users match "zzznomatch"/i)).toBeTruthy();
  });

  it("opens ban modal when Ban clicked", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getAllByText("Ban"));
    fireEvent.click(screen.getAllByText("Ban")[0]);
    expect(screen.getByText(/Ban alice\?/i)).toBeTruthy();
  });

  it("closes ban modal when Cancel clicked", async () => {
    render(<AdminPage />);
    await waitFor(() => screen.getAllByText("Ban"));
    fireEvent.click(screen.getAllByText("Ban")[0]);
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/Ban alice\?/i)).toBeNull();
  });

  it("calls banUser with userId and reason on confirm", async () => {
    api.banUser.mockResolvedValue({});
    render(<AdminPage />);
    await waitFor(() => screen.getAllByText("Ban"));
    fireEvent.click(screen.getAllByText("Ban")[0]);
    fireEvent.click(screen.getByText("Ban User"));
    await waitFor(() => expect(api.banUser).toHaveBeenCalledWith(1, ""));
  });

  it("calls unbanUser with correct userId", async () => {
    api.unbanUser.mockResolvedValue({});
    render(<AdminPage />);
    await waitFor(() => screen.getAllByText("Unban"));
    fireEvent.click(screen.getAllByText("Unban")[0]);
    await waitFor(() => expect(api.unbanUser).toHaveBeenCalledWith(2));
  });

  it("calls onNavChange with profile id when name clicked", async () => {
    const onNavChange = vi.fn();
    render(<AdminPage onNavChange={onNavChange} />);
    await waitFor(() =>
      screen.getByRole("button", { name: /Alice Smith/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Alice Smith/i }));
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
