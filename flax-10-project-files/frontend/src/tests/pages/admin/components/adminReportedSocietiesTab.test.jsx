/*
 * Reported societies admin tab integration tests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => ({ children, layoutId, initial, animate, exit, transition, variants, layout, ...rest }) =>
      <div {...rest}>{children}</div>,
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../pages/admin/styles/styles", () => ({
  default: {
    list: "list", listRow: "listRow", listInfo: "listInfo", listName: "listName",
    listMeta: "listMeta", listActions: "listActions", card: "card", cardHeader: "cardHeader",
    cardTitle: "cardTitle", count: "count", spinnerWrap: "spinnerWrap", spinner: "spinner",
    empty: "empty", errorMsg: "errorMsg", approveBtn: "approveBtn", rejectBtn: "rejectBtn",
    banBtn: "banBtn", dismissBtn: "dismissBtn",
  },
}));

vi.mock("../../../../pages/admin/utils/adminMotion", () => ({
  stagger: {},
  rowAnim: {},
  fadeUp: {},
}));

vi.mock("../../../../pages/admin/hooks/useAsyncList", () => ({
  useAsyncList: vi.fn(),
}));

vi.mock("../../../../pages/admin/hooks/useAsyncAction", () => ({
  useAsyncAction: vi.fn(),
}));

vi.mock("../../../../pages/admin/hooks/usePaginatedItems", () => ({
  usePaginatedItems: vi.fn(),
}));

vi.mock("../../../../pages/admin/utils/adminNavigation", () => ({
  navigateToSociety: vi.fn(),
}));

vi.mock("../../../../api/adminApi", () => ({
  fetchReportedSocieties: vi.fn(),
  dismissReport: vi.fn(),
  banReportedSociety: vi.fn(),
}));

vi.mock("../../../../pages/admin/components/AdminPagination", () => ({
  default: () => null,
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, title, onClose }) => (
    <div><span>{title}</span><button type="button" onClick={onClose}>close-modal</button>{children}</div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({ Ban: () => <svg /> }));

import { useAsyncList } from "../../../../pages/admin/hooks/useAsyncList";
import { useAsyncAction } from "../../../../pages/admin/hooks/useAsyncAction";
import { usePaginatedItems } from "../../../../pages/admin/hooks/usePaginatedItems";
import { navigateToSociety } from "../../../../pages/admin/utils/adminNavigation";
import ReportedSocietiesTab from "../../../../pages/admin/components/ReportedSocietiesTab";
import * as api from "../../../../api/adminApi";

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
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Violating rules" } });
    fireEvent.submit(textarea.closest("form"));
    expect(run).toHaveBeenCalled();
    const actionFn = run.mock.calls[0][1];
    actionFn();
    expect(api.banReportedSociety).toHaveBeenCalledWith(10, "Violating rules");
    const successFn = run.mock.calls[0][2];
    successFn();
    const setItemsUpdater = noopSetters.setItems.mock.calls[0][0];
    setItemsUpdater([report]);
    setItemsUpdater([]);
  });

  it("calls run to dismiss a report when Dismiss is clicked", () => {
    const run = vi.fn();
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue({ busy: null, run });
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Dismiss"));
    expect(run).toHaveBeenCalled();
    const actionFn = run.mock.calls[0][1];
    actionFn();
    expect(api.dismissReport).toHaveBeenCalledWith(10);
    const successFn = run.mock.calls[0][2];
    successFn();
    const setItemsUpdater = noopSetters.setItems.mock.calls[0][0];
    setItemsUpdater([report]);
  });

  it("does not trigger ban when handleBanConfirm is called with no banTarget", () => {
    const run = vi.fn();
    useAsyncList.mockReturnValue(makeListState([report]));
    useAsyncAction.mockReturnValue({ busy: null, run });
    usePaginatedItems.mockReturnValue(makePagination([report]));
    render(<ReportedSocietiesTab />);
    fireEvent.click(screen.getByText("Ban"));
    fireEvent.click(screen.getByText("close-modal"));
    expect(run).not.toHaveBeenCalled();
  });

  it("shows loading spinner when loading", () => {
    useAsyncList.mockReturnValue({ ...makeListState([]), loading: true });
    useAsyncAction.mockReturnValue(makeActionState());
    usePaginatedItems.mockReturnValue(makePagination([]));
    const { container } = render(<ReportedSocietiesTab />);
    expect(container.querySelector(".spinnerWrap")).toBeInTheDocument();
  });
});
