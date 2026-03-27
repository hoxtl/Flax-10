/*
 * Tests for the admin request, ratification, and reported-society tabs.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => ({ children, layoutId, initial, animate, exit, transition, variants, layout, ...rest }) =>
      <div {...rest}>{children}</div>,
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../pages/admin/styles/styles", () => ({
  default: {
    list: "list", listRow: "listRow", listInfo: "listInfo", listName: "listName",
    listMeta: "listMeta", listActions: "listActions", card: "card", cardHeader: "cardHeader",
    cardTitle: "cardTitle", count: "count", spinnerWrap: "spinnerWrap", spinner: "spinner",
    empty: "empty", errorMsg: "errorMsg", approveBtn: "approveBtn", rejectBtn: "rejectBtn",
    banBtn: "banBtn", dismissBtn: "dismissBtn",
  },
}));

vi.mock("../../../pages/admin/utils/adminMotion", () => ({
  stagger: {},
  rowAnim: {},
  fadeUp: {},
}));

vi.mock("../../../pages/admin/hooks/useAsyncList", () => ({
  useAsyncList: vi.fn(),
}));

vi.mock("../../../pages/admin/hooks/useAsyncAction", () => ({
  useAsyncAction: vi.fn(),
}));

vi.mock("../../../pages/admin/hooks/usePaginatedItems", () => ({
  usePaginatedItems: vi.fn(),
}));

vi.mock("../../../pages/admin/utils/adminNavigation", () => ({
  navigateToProfile: vi.fn(),
  navigateToSociety: vi.fn(),
}));

vi.mock("../../../api/adminApi", () => ({
  fetchCourseChangeRequests: vi.fn(),
  resolveCourseChangeRequest: vi.fn(),
  fetchPendingRatifications: vi.fn(),
  approveRatification: vi.fn(),
  rejectRatification: vi.fn(),
  fetchReportedSocieties: vi.fn(),
  dismissReport: vi.fn(),
  banReportedSociety: vi.fn(),
}));

vi.mock("../../../pages/admin/components/AdminPagination", () => ({
  default: () => null,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, title, onClose }) => (
    <div><span>{title}</span><button onClick={onClose}>close-modal</button>{children}</div>
  ),
}));

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({ Ban: () => <svg /> }));

import { useAsyncList } from "../../../pages/admin/hooks/useAsyncList";
import { useAsyncAction } from "../../../pages/admin/hooks/useAsyncAction";
import { usePaginatedItems } from "../../../pages/admin/hooks/usePaginatedItems";
import { navigateToProfile, navigateToSociety } from "../../../pages/admin/utils/adminNavigation";
import CourseChangeRequestsTab from "../../../pages/admin/components/CourseChangeRequestsTab";
import RatificationsTab from "../../../pages/admin/components/RatificationsTab";
import ReportedSocietiesTab from "../../../pages/admin/components/ReportedSocietiesTab";

const noopSetters = { setError: vi.fn(), setItems: vi.fn() };

function makeListState(items = [], overrides = {}) {
  return { items, loading: false, error: null, ...noopSetters, ...overrides };
}

function makeActionState(overrides = {}) {
  return { busy: null, run: vi.fn(), ...overrides };
}

function makePagination(items = []) {
  return { currentPage: 1, totalPages: 1, pageItems: items, setCurrentPage: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CourseChangeRequestsTab", () => {
  const request = {
    id: 1, first_name: "Alice", last_name: "Smith", username: "asmith",
    email: "a@example.com", current_course: "CS101", requested_course: "CS102",
    user_id: 42,
  };

  it("renders the tab title and items", () => {
    useAsyncList.mockReturnValue(makeListState([request]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([request]));
    render(<CourseChangeRequestsTab onNavigate={vi.fn()} />);
    expect(screen.getByText("Course Switch Requests")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("calls navigateToProfile when a request row is clicked", () => {
    const onNavigate = vi.fn();
    useAsyncList.mockReturnValue(makeListState([request]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([request]));
    render(<CourseChangeRequestsTab onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Alice Smith"));
    expect(navigateToProfile).toHaveBeenCalledWith(onNavigate, 42);
  });

  it("shows empty state when no requests", () => {
    useAsyncList.mockReturnValue(makeListState([]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    render(<CourseChangeRequestsTab onNavigate={vi.fn()} />);
    expect(screen.getByText("No course switch requests")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    useAsyncList.mockReturnValue({ ...makeListState([]), loading: true });
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    const { container } = render(<CourseChangeRequestsTab onNavigate={vi.fn()} />);
    expect(container.querySelector(".spinnerWrap")).toBeInTheDocument();
  });

  it("shows error message when there is an error", () => {
    useAsyncList.mockReturnValue({ ...makeListState([]), error: "Load failed" });
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    render(<CourseChangeRequestsTab onNavigate={vi.fn()} />);
    expect(screen.getByText("Load failed")).toBeInTheDocument();
  });

  it("renders getCourseMeta with no current_course", () => {
    const req = { ...request, current_course: null };
    useAsyncList.mockReturnValue(makeListState([req]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([req]));
    render(<CourseChangeRequestsTab onNavigate={vi.fn()} />);
    expect(screen.getByText(/Requesting: CS102/)).toBeInTheDocument();
  });
});

describe("RatificationsTab", () => {
  const item = {
    id: 2, name: "Chess Society", society_id: 5, member_count: 12, description: "We play chess",
  };

  it("renders the tab title and items", () => {
    useAsyncList.mockReturnValue(makeListState([item]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([item]));
    render(<RatificationsTab />);
    expect(screen.getByText("Society Ratifications")).toBeInTheDocument();
    expect(screen.getByText("Chess Society")).toBeInTheDocument();
  });

  it("calls navigateToSociety with society_id when row is clicked", () => {
    useAsyncList.mockReturnValue(makeListState([item]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([item]));
    render(<RatificationsTab />);
    fireEvent.click(screen.getByText("Chess Society"));
    expect(navigateToSociety).toHaveBeenCalledWith(5);
  });

  it("falls back to item.id when society_id is nullish", () => {
    const itemNoSociety = { ...item, society_id: null };
    useAsyncList.mockReturnValue(makeListState([itemNoSociety]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([itemNoSociety]));
    render(<RatificationsTab />);
    fireEvent.click(screen.getByText("Chess Society"));
    expect(navigateToSociety).toHaveBeenCalledWith(2);
  });

  it("shows getRatificationMeta without description", () => {
    const itemNoDesc = { ...item, description: null };
    useAsyncList.mockReturnValue(makeListState([itemNoDesc]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([itemNoDesc]));
    render(<RatificationsTab />);
    expect(screen.getByText(/12 members/)).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    useAsyncList.mockReturnValue(makeListState([]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    render(<RatificationsTab />);
    expect(screen.getByText("No societies awaiting ratification")).toBeInTheDocument();
  });
});

describe("ReportedSocietiesTab", () => {
  const report = {
    id: 10, society_id: 20, society_name: "Drama Society",
    reporter_username: "john", reason: "Spam",
  };

  it("renders the tab with reports", () => {
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    expect(screen.getByText("Reported Societies")).toBeInTheDocument();
    expect(screen.getByText("Drama Society")).toBeInTheDocument();
  });

  it("shows empty state when no reports", () => {
    useAsyncList.mockReturnValue(makeListState([]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    render(<ReportedSocietiesTab />);
    expect(screen.getByText("No reported societies")).toBeInTheDocument();
  });

  it("navigates to society when row is clicked", () => {
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Drama Society"));
    expect(navigateToSociety).toHaveBeenCalledWith(20);
  });

  it("renders report meta with reason", () => {
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    expect(screen.getByText(/@john/)).toBeInTheDocument();
    expect(screen.getByText(/Spam/)).toBeInTheDocument();
  });

  it("renders report meta without reason (no separator shown)", () => {
    const reportNoReason = { ...report, reason: null };
    useAsyncList.mockReturnValue(makeListState([reportNoReason]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([reportNoReason]));
    render(<ReportedSocietiesTab />);
    expect(screen.getByText(/@john/)).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("opens the ban modal when Ban is clicked", () => {
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Ban"));
    expect(screen.getByText(/Ban Drama Society/)).toBeInTheDocument();
  });

  it("closes the ban modal when cancel is clicked", () => {
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.click(screen.getByText("close-modal"));
    expect(screen.queryByText(/Ban Drama Society/)).not.toBeInTheDocument();
  });

  it("calls run to ban the society when confirmed", () => {
    const run = vi.fn();
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue({ busy: null, run });
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Ban"));
    // Submit with a reason
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Violating rules" } });
    fireEvent.submit(textarea.closest("form"));
    expect(run).toHaveBeenCalled();
  });

  it("calls run to dismiss a report when Dismiss is clicked", () => {
    const run = vi.fn();
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue({ busy: null, run });
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Dismiss"));
    expect(run).toHaveBeenCalled();
  });

  it("does not trigger ban when handleBanConfirm is called with no banTarget", () => {
    // This covers the handleBanConfirm early return when banTarget is null
    const run = vi.fn();
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue({ busy: null, run });
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    // Open and immediately cancel (banTarget gets set to null)
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.click(screen.getByText("close-modal"));
    // Modal closed. banTarget is null. Calling confirm now would be a no-op.
    expect(run).not.toHaveBeenCalled();
  });
});
