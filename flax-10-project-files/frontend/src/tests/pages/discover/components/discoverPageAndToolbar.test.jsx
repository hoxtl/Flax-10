/*
 * Tests for the Discover page, DiscoverSkeleton, and DiscoverToolbar components.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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

vi.mock("*.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

vi.mock("lucide-react", () => ({
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
  SlidersHorizontal: () => <span data-testid="icon-sliders" />,
  ArrowUp: () => <span data-testid="icon-arrow-up" />,
}));

const searchUsersMock = vi.fn();
vi.mock("../../../../api/userApi", () => ({
  searchUsers: (...args) => searchUsersMock(...args),
}));

const useSearchInitMock = vi.fn();
const useFilterStateMock = vi.fn();
const useClickOutsideMock = vi.fn();

vi.mock("../../../../components/social/components/UserSearch", () => ({
  FilterSection: () => <div data-testid="filter-section" />,
  useSearchInit: (...args) => useSearchInitMock(...args),
  useFilterState: (...args) => useFilterStateMock(...args),
  useClickOutside: (...args) => useClickOutsideMock(...args),
}));

vi.mock("../../../../components/pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages }) => (
    <div data-testid="pagination">
      {currentPage}/{totalPages}
    </div>
  ),
  BackToTop: () => <button data-testid="back-to-top">Top</button>,
}));

vi.mock("../../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: () => null,
}));

vi.mock("../../../../components/common/error_boundary/ErrorBoundary", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("../../../../components/common/app_page/AppPage", () => ({
  default: ({ children, title }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("../../../../components/common/user_avatar/UserAvatar", () => ({
  default: () => <div data-testid="user-avatar" />,
}));

vi.mock("../../../../components/common/card/GridCard", () => ({
  default: ({ children, onClick }) => (
    <div data-testid="grid-card" onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock("../../../../components/common/entity_link_chip/EntityLinkChip", () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query }) => <div>{`No users match "${query}"`}</div>,
}));

vi.mock("../../../../components/common/page_toolbar/PageToolbar", () => ({
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

vi.mock("../../../../components/common/search_bar/SearchBar", () => ({
  default: ({ placeholder, value, onChange }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../../../../components/common", () => ({
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

import Discover from "../../../../pages/discover/Discover";
import {
  DiscoverSkeleton,
  DiscoverToolbar,
} from "../../../../pages/discover/components/DiscoverComponents";

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

describe("Discover page extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSearchInitMock.mockReturnValue({ allCourses: {}, allSocieties: [] });
    useFilterStateMock.mockReturnValue(makeFilterState());
    searchUsersMock.mockResolvedValue({ results: [], total_count: 0 });
  });

  it("shows skeleton when loading=true and users is empty", () => {
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

describe("DiscoverSkeleton", () => {
  it("renders 8 skeleton cards", () => {
    const { container } = render(<DiscoverSkeleton />);
    const avatars = container.querySelectorAll("[class*='skelAvatar']");
    expect(avatars.length).toBe(8);
  });
});

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
