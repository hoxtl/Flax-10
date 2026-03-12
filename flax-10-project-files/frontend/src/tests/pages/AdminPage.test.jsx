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
  fetchPendingRatifications: vi.fn(),
  approveRatification: vi.fn(),
  rejectRatification: vi.fn(),
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

  it("renders all four tab buttons", () => {
    render(<AdminPage />);
    expect(screen.getByText(/Users/)).toBeTruthy();
    expect(screen.getByText(/Ratifications/)).toBeTruthy();
    expect(screen.getByText(/Teacher Requests/)).toBeTruthy();
    expect(screen.getByText(/Reported Societies/)).toBeTruthy();
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
});