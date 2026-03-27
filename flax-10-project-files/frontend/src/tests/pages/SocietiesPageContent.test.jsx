/**
 * Covers SocietiesPageContent loading, tabs, and modal flows.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { createFnMap } from "../utils/testBuilderUtils";

vi.mock("../../pages/societies/SocietiesPage.module.css", () => ({ default: { container: "container", smallSearch: "smallSearch" } }));
vi.mock("../../pages/societies/SocietiesPageExtras.module.css", () => ({ default: {} }));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("../../components/common/app_page/AppPage", () => ({
  default: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("../../components/common/page_transition/PageTransition", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../components/common/tabs/Tabs", () => ({
  default: ({ tabs, activeTab, onTabChange, rightAction }) => (
    <div>
      {rightAction}
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}>
          {tab.label}
        </button>
      ))}
      <div data-testid="active-tab">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  ),
}));

vi.mock("../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("../../components/pagination/Pagination", () => ({
  BackToTop: () => <div data-testid="back-to-top" />,
}));

vi.mock("../../hooks/usePagination", () => ({
  usePagination: (items) => ({
    currentItems: items,
    totalPages: 1,
    currentPage: 1,
    setPage: vi.fn(),
  }),
}));

vi.mock("../../components/society/CreateSocietyModal", () => ({
  default: ({ onClose, onCreate }) => (
    <div data-testid="create-society-modal">
      <button onClick={onClose}>Close create modal</button>
      <button onClick={() => onCreate({ name: "New club" })}>Create society</button>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/ReportSocietyModal", () => ({
  default: ({ society, onClose, onReportSuccess }) => (
    <div data-testid="report-modal">
      <span>{society.name}</span>
      <button onClick={onClose}>Close report modal</button>
      <button onClick={onReportSuccess}>Report success</button>
    </div>
  ),
}));

vi.mock("../../pages/societies/AllSocieties", () => ({
  default: ({ onBack, onSelect, onReport, onUnreport, societies }) => (
    <div data-testid="all-societies">
      <button onClick={onBack}>Back from all</button>
      <button onClick={() => onSelect("77")}>Select from all</button>
      <button onClick={() => onReport(societies[0])}>Report from all</button>
      <button onClick={() => onUnreport(societies[0])}>Unreport from all</button>
    </div>
  ),
}));

vi.mock("../../pages/societies/SocietySection", () => ({
  default: ({ items, type, onAction, onSelect, onReport, onUnreport }) => (
    <div data-testid={`section-${type}`}>
      <button onClick={onAction}>Action {type}</button>
      {items.map((society) => (
        <button key={society.id} onClick={() => onSelect(society.id)}>
          {society.name}
        </button>
      ))}
      {items[0] && onReport ? <button onClick={() => onReport(items[0])}>Report {type}</button> : null}
      {items[0] && onUnreport ? <button onClick={() => onUnreport(items[0])}>Unreport {type}</button> : null}
    </div>
  ),
}));

vi.mock("../../pages/societies/SocietyDetailPage", () => ({
  default: ({ societyId, onBack, onDelete, onMembershipChange }) => (
    <div data-testid="society-detail">
      <span>{societyId}</span>
      <button onClick={onBack}>Back from detail</button>
      <button onClick={onDelete}>Delete society</button>
      <button onClick={onMembershipChange}>Refresh memberships</button>
    </div>
  ),
}));

vi.mock("../../pages/societies/SocietySkeletons", () => ({
  SocietiesSkeleton: () => <div>Societies loading</div>,
}));

import { SocietiesPageContent } from "../../pages/societies/SocietiesPageContent";

function renderPage(ui, initialEntries = ["/"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

const societies = [
  { id: 1, name: "Photography Club", is_member: true, is_admin: false },
  { id: 2, name: "Debate Society", is_member: true, is_admin: true },
];

function buildState(overrides = {}) {
  return {
    loading: false,
    selectedSocietyId: null,
    view: "my",
    societies,
    showCreateModal: false,
    reportingSociety: null,
    ...createFnMap(["refresh", "removeSociety", "setView", "clearSelection", "selectSociety", "setReportingSociety", "handleUnreport", "setShowCreateModal", "onCreate", "onReportSuccess"]),
    ...overrides,
  };
}

describe("SocietiesPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the loading skeleton when the page is loading", () => {
    renderPage(<SocietiesPageContent state={buildState({ loading: true })} />);
    expect(screen.getByText("Societies loading")).toBeInTheDocument();
  });

  it("renders the selected society view and wires back/delete handlers", () => {
    const state = buildState({ selectedSocietyId: "42" });

    renderPage(<SocietiesPageContent state={state} />);

    fireEvent.click(screen.getByText("Delete society"));
    fireEvent.click(screen.getByText("Back from detail"));
    fireEvent.click(screen.getByText("Refresh memberships"));

    expect(state.removeSociety).toHaveBeenCalledWith(42);
    expect(state.setView).toHaveBeenCalledWith("my");
    expect(state.clearSelection).toHaveBeenCalled();
    expect(state.refresh).toHaveBeenCalled();
  });

  it("renders my societies search, filters visible content, and switches tabs", () => {
    const state = buildState();

    renderPage(<SocietiesPageContent state={state} />, ["/?subTab=admin"]);

    expect(screen.getByLabelText("Search my societies...")).toBeInTheDocument();
    expect(screen.getByText("Debate Society")).toBeInTheDocument();
    expect(screen.queryByText("Photography Club")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search my societies..."), { target: { value: "photo" } });
    fireEvent.click(screen.getByText("My Memberships"));

    expect(screen.getByText("Photography Club")).toBeInTheDocument();
    expect(screen.queryByText("Debate Society")).not.toBeInTheDocument();
    expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
  });

  it("handles interactions within the all societies view", () => {
    const state = buildState({ view: "all" });
    renderPage(<SocietiesPageContent state={state} />);
    fireEvent.click(screen.getByText("Back from all"));
    fireEvent.click(screen.getByText("Select from all"));
    expect(state.setView).toHaveBeenCalledWith("my");
    expect(state.selectSociety).toHaveBeenCalledWith("77");
  });

  it("handles create society modal interactions", () => {
    const state = buildState({ view: "all", showCreateModal: true });
    renderPage(<SocietiesPageContent state={state} />);
    fireEvent.click(screen.getByText("Close create modal"));
    fireEvent.click(screen.getByText("Create society"));
    expect(state.setShowCreateModal).toHaveBeenCalledWith(false);
    expect(state.onCreate).toHaveBeenCalledWith({ name: "New club" });
  });

  it("handles report society modal interactions", () => {
    const state = buildState({ view: "all", reportingSociety: { id: 9, name: "R" } });
    renderPage(<SocietiesPageContent state={state} />);
    fireEvent.click(screen.getByText("Close report modal"));
    fireEvent.click(screen.getByText("Report success"));
    expect(state.setReportingSociety).toHaveBeenCalledWith(null);
    expect(state.onReportSuccess).toHaveBeenCalledWith(9);
  });
});
