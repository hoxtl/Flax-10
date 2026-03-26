/**
 * Extra coverage for Discover page, DiscoverComponents, and discoverHooks.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act, renderHook } from "@testing-library/react";

// ── framer-motion mock ───────────────────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const rest = { ...props };
          delete rest.initial;
          delete rest.animate;
          delete rest.exit;
          delete rest.transition;
          delete rest.whileHover;
          delete rest.whileTap;
          const T = tag;
          return React.createElement(T, rest, children);
        },
    }
  ),
  AnimatePresence: ({ children }) =>
    React.createElement(React.Fragment, null, children),
}));

// ── CSS module mocks ─────────────────────────────────────────────────────────
vi.mock("*.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

// ── lucide-react mock ────────────────────────────────────────────────────────
vi.mock("lucide-react", () => ({
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
  ArrowUp: () => <span data-testid="icon-arrow-up" />,
}));

// ── API / Social mocks ───────────────────────────────────────────────────────
const searchUsersMock = vi.fn();
vi.mock("../../../api/userApi", () => ({
  searchUsers: (...args) => searchUsersMock(...args),
}));

const useSearchInitMock = vi.fn();
const useFilterStateMock = vi.fn();
const useClickOutsideMock = vi.fn();

vi.mock("../../../components/Social/UserSearch", () => ({
  FilterSection: () => <div data-testid="filter-section" />,
  useSearchInit: (...args) => useSearchInitMock(...args),
  useFilterState: (...args) => useFilterStateMock(...args),
  useClickOutside: (...args) => useClickOutsideMock(...args),
}));

vi.mock("../../../components/Pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages }) => (
    <div data-testid="pagination">
      {currentPage}/{totalPages}
    </div>
  ),
  BackToTop: () => <button data-testid="back-to-top">Top</button>,
}));

vi.mock("../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: () => null,
}));

vi.mock("../../../components/common/error_boundary/ErrorBoundary", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../components/common/app_page/AppPage", () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/user_avatar/UserAvatar", () => ({
  default: () => <div data-testid="user-avatar" />,
}));

vi.mock("../../../components/common/Card/GridCard", () => ({
  default: ({ children, onClick }) => (
    <div data-testid="grid-card" onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/common/entity_link_chip/EntityLinkChip", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query }) => <div>{`No users match "${query}"`}</div>,
}));

vi.mock("../../../components/common/page_toolbar/PageToolbar", () => ({
  default: ({ searchSlot, controlsSlot }) => (
    <div data-testid="page-toolbar">
      {searchSlot}
      {controlsSlot}
    </div>
  ),
  ToolbarSortControl: ({ children }) => (
    <div data-testid="sort-control">{children}</div>
  ),
}));

vi.mock("../../../components/common/search_bar/SearchBar", () => ({
  default: ({ placeholder, value, onChange }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../../../components/common", () => ({
  SegmentedControl: ({ value, onChange, options }) => (
    <div data-testid="segmented-control">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
      <span data-testid="seg-value">{value}</span>
    </div>
  ),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import Discover from "../../../pages/Discover/Discover";
import {
  DiscoverSkeleton,
  DiscoverToolbar,
  UsersGrid,
} from "../../../pages/Discover/DiscoverComponents";
import { useDiscoverFetch } from "../../../pages/Discover/discoverHooks";

// ── Helpers for filter state mock ────────────────────────────────────────────
function makeFilterState(overrides = {}) {
  return {
    isFilterOpen: false,
    setIsFilterOpen: vi.fn(),
    props: {
      selectedCourses: [],
      selectedSocieties: [],
      selectedYears: [],
      selectedRoles: [],
      ...overrides,
    },
  };
}

// ── Discover page ─────────────────────────────────────────────────────────────

describe("Discover page extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSearchInitMock.mockReturnValue({ allCourses: {}, allSocieties: [] });
    useFilterStateMock.mockReturnValue(makeFilterState());
    searchUsersMock.mockResolvedValue({ results: [], total_count: 0 });
  });

  it("shows skeleton when loading=true and users is empty", () => {
    // Block the mock so loading stays true
    searchUsersMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<Discover onNavChange={vi.fn()} />);
    expect(container.querySelector("[class*='skelWrap']")).toBeTruthy();
  });

  it("shows UsersGrid (no skeleton) after data loads", async () => {
    searchUsersMock.mockResolvedValue({
      results: [{ id: 1, username: "alice", first_name: "Alice", last_name: "Smith" }],
      total_count: 1,
    });
    render(<Discover onNavChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("@alice")).toBeTruthy());
    // no skeleton wrapper present
    expect(document.querySelector("[class*='skelWrap']")).toBeNull();
  });

  it("DiscoverContent renders empty state when users=[] and not loading", async () => {
    searchUsersMock.mockResolvedValue({ results: [], total_count: 0 });
    render(<Discover onNavChange={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByText("No users found")).toBeTruthy()
    );
  });
});

// ── DiscoverSkeleton ──────────────────────────────────────────────────────────

describe("DiscoverSkeleton", () => {
  it("renders 8 skeleton cards", () => {
    const { container } = render(<DiscoverSkeleton />);
    // Each card renders a skelAvatar div
    const avatars = container.querySelectorAll("[class*='skelAvatar']");
    expect(avatars.length).toBe(8);
  });
});

// ── DiscoverToolbar ───────────────────────────────────────────────────────────

describe("DiscoverToolbar", () => {
  it("renders search bar and filter section", () => {
    const filterState = makeFilterState();
    render(
      <DiscoverToolbar
        searchQuery=""
        setSearchQuery={vi.fn()}
        filterRef={{ current: null }}
        filterState={filterState}
        sortBy="name"
        setSortBy={vi.fn()}
      />
    );
    expect(screen.getByTestId("page-toolbar")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search by name or username/i)
    ).toBeInTheDocument();
  });
});

// ── UsersGrid ─────────────────────────────────────────────────────────────────

describe("UsersGrid", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders user cards when users list is non-empty", () => {
    const users = [
      { id: 10, username: "charlie", first_name: "Charlie", last_name: "Brown" },
    ];
    render(
      <UsersGrid
        users={users}
        onNavChange={vi.fn()}
        loading={false}
        currentPage={1}
        totalPages={1}
        setCurrentPage={vi.fn()}
        searchQuery=""
      />
    );
    expect(screen.getByText("@charlie")).toBeInTheDocument();
  });

  it("renders SearchEmptyState when searchQuery is set and no users", () => {
    render(
      <UsersGrid
        users={[]}
        onNavChange={vi.fn()}
        loading={false}
        currentPage={1}
        totalPages={1}
        setCurrentPage={vi.fn()}
        searchQuery="nobody"
      />
    );
    expect(screen.getByText('No users match "nobody"')).toBeInTheDocument();
  });

  it("renders generic EmptyState when no query and no users", () => {
    render(
      <UsersGrid
        users={[]}
        onNavChange={vi.fn()}
        loading={false}
        currentPage={1}
        totalPages={1}
        setCurrentPage={vi.fn()}
        searchQuery=""
      />
    );
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders Pagination when totalPages > 1", () => {
    const users = [
      { id: 1, username: "alice", first_name: "Alice", last_name: "Smith" },
    ];
    render(
      <UsersGrid
        users={users}
        onNavChange={vi.fn()}
        loading={false}
        currentPage={2}
        totalPages={5}
        setCurrentPage={vi.fn()}
        searchQuery=""
      />
    );
    // Two pagination components rendered (top + bottom)
    expect(screen.getAllByTestId("pagination").length).toBeGreaterThanOrEqual(1);
  });
});

// ── discoverHooks – pagination reset ─────────────────────────────────────────

describe("useDiscoverFetch – pagination reset and error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSearchInitMock.mockReturnValue({ allCourses: {}, allSocieties: [] });
    useFilterStateMock.mockReturnValue(makeFilterState());
  });

  it("resets page to 1 when query changes", async () => {
    vi.useRealTimers();
    searchUsersMock.mockResolvedValue({ results: [], total_count: 0 });
    const filterState = makeFilterState();

    const { result, rerender } = renderHook(
      ({ query }) => useDiscoverFetch(query, filterState, "name"),
      { initialProps: { query: "alpha" } }
    );

    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Manually bump page then change query
    act(() => result.current.setCurrentPage(3));
    expect(result.current.currentPage).toBe(3);

    rerender({ query: "beta" });
    await waitFor(() => expect(result.current.currentPage).toBe(1));
  });

  it("returns empty users and zero totalPages on API error", async () => {
    vi.useRealTimers();
    searchUsersMock.mockRejectedValue(new Error("network failure"));
    const filterState = makeFilterState();

    const { result } = renderHook(() =>
      useDiscoverFetch("query", filterState, "name")
    );

    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([]);
    expect(result.current.totalPages).toBe(0);
  });
});
