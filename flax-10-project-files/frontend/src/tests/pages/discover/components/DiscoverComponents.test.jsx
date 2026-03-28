/*
 * Tests for discover page grid and toolbar components.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("*.module.css", () => ({
  default: new Proxy({}, { get: (_, key) => key }),
}));

vi.mock("../../../../components/common", () => ({
  SegmentedControl: ({ value, onChange, options }) => (
    <div>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
      <span data-testid="sort-value">{value}</span>
    </div>
  ),
}));

vi.mock("../../../../components/common/card/GridCard", () => ({
  default: ({ children, onClick }) => <div data-testid="grid-card" onClick={onClick}>{children}</div>,
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => <div>{title}{description ? ` ${description}` : ""}</div>,
}));

vi.mock("../../../../components/common/entity_link_chip/EntityLinkChip", () => ({
  default: ({ children, to, title }) => <a href={to} title={title}>{children}</a>,
}));

vi.mock("../../../../components/common/page_toolbar/PageToolbar", () => ({
  default: ({ searchSlot, controlsSlot }) => <div data-testid="page-toolbar">{searchSlot}{controlsSlot}</div>,
  ToolbarSortControl: ({ children }) => <div data-testid="toolbar-sort">{children}</div>,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, ...props }) => <button type="button" onClick={onClick} {...props}>{children}</button>,
}));

vi.mock("../../../../components/common/search_bar/SearchBar", () => ({
  default: ({ placeholder, value, onChange }) => (
    <input
      aria-label="discover-search"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, itemLabel }) => <div>{`No ${itemLabel} match "${query}"`}</div>,
}));

vi.mock("../../../../components/common/user_avatar/UserAvatar", () => ({
  default: ({ user }) => <div data-testid="user-avatar">{user.profile_photo_url || "no-photo"}</div>,
}));

vi.mock("../../../../components/social/components/UserSearch", () => ({
  FilterSection: ({ isOpen, onOpen, onClose, setOpen }) => (
    <div data-testid="filter-section">
      <span data-testid="filter-open-state">{String(isOpen)}</span>
      <button type="button" onClick={onOpen}>Open filters</button>
      <button type="button" onClick={onClose}>Close filters</button>
      <button type="button" onClick={setOpen}>Toggle filters</button>
    </div>
  ),
}));

vi.mock("../../../../components/pagination/Pagination", () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }) => (
    <button type="button" data-testid="pagination" onClick={() => onPageChange(currentPage + 1)}>
      {currentPage}/{totalPages}
    </button>
  ),
  BackToTop: ({ containerSelector }) => <div data-testid="back-to-top">{containerSelector}</div>,
}));

vi.mock("../../../../utils/tutorPhotoFallback", () => ({
  getResolvedUserPhoto: (user) => `photo-${user.id}`,
}));

import {
  DiscoverSkeleton,
  DiscoverToolbar,
  UsersGrid,
} from "../../../../pages/discover/components/DiscoverComponents";

function renderUsersGrid(overrides = {}) {
  return render(
    <UsersGrid
      users={[]}
      onNavChange={vi.fn()}
      loading={false}
      currentPage={1}
      totalPages={1}
      setCurrentPage={vi.fn()}
      searchQuery=""
      {...overrides}
    />,
  );
}

function renderToolbar(overrides = {}) {
  return render(
    <DiscoverToolbar
      searchQuery=""
      setSearchQuery={vi.fn()}
      filterRef={{ current: null }}
      filterState={{ isFilterOpen: false, setIsFilterOpen: vi.fn(), props: {} }}
      sortBy="name"
      setSortBy={vi.fn()}
      {...overrides}
    />,
  );
}

describe("DiscoverComponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders student metadata with year-major separator and short module lists", () => {
    renderUsersGrid({
      users: [{
        id: 11,
        username: "student.sam",
        first_name: "Sam",
        last_name: "Taylor",
        role: "student",
        year: "Year 2",
        major: "Computer Science",
        modules: ["CS101", "CS102", "CS103"],
      }],
    });
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Year 2")).toBeInTheDocument();
    expect(screen.getByText("•")).toBeInTheDocument();
    expect(screen.getByText("Computer Science")).toBeInTheDocument();
    expect(screen.getByText("CS101")).toBeInTheDocument();
    expect(screen.getByText("CS103")).toBeInTheDocument();
    expect(screen.queryByText("+1")).not.toBeInTheDocument();
  });

  it("treats doctor-prefixed names as teachers", () => {
    renderUsersGrid({
      users: [{
        id: 12,
        username: "dr.jones",
        name: "Dr. Jane Jones",
        role: "user",
        major: "Physics",
        bio: "Works on optics.",
        modules: ["PHY1", "PHY2", "PHY3", "PHY4"],
      }],
    });
    expect(screen.getByText("Professor")).toBeInTheDocument();
    expect(screen.getByText("Department: Physics")).toBeInTheDocument();
    expect(screen.getByText("Works on optics.")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByTestId("user-avatar")).toHaveTextContent("photo-12");
  });

  it("safely handles teacher navigation when handlers are missing", () => {
    renderUsersGrid({
      users: [{
        id: 12,
        username: "dr.jones",
        name: "Dr. Jane Jones",
        role: "user",
        major: "Physics",
      }],
      onNavChange: undefined,
    });
    expect(() => fireEvent.click(screen.getByText("View Profile"))).not.toThrow();
    expect(() => fireEvent.click(screen.getByTestId("grid-card"))).not.toThrow();
  });

  it("falls back to major-only copy for students without a year value", () => {
    renderUsersGrid({
      users: [{
        id: 13,
        username: "student.noyear",
        first_name: "Nina",
        last_name: "Hart",
        role: "student",
        major: "Mathematics",
      }],
    });
    expect(screen.queryByText("•")).not.toBeInTheDocument();
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  it("shows the empty state after filtering out the current user", () => {
    localStorage.setItem("user", JSON.stringify({ id: 99, username: "me" }));
    renderUsersGrid({ users: [{ id: 99, username: "me", first_name: "My", last_name: "Self" }] });
    expect(screen.getByText(/No users found/)).toBeInTheDocument();
  });

  it("wires the toolbar search input", () => {
    const setSearchQuery = vi.fn();
    renderToolbar({ setSearchQuery });
    fireEvent.change(screen.getByLabelText("discover-search"), { target: { value: "ada" } });
    expect(setSearchQuery).toHaveBeenCalledWith("ada");
  });

  it("wires the toolbar filter controls", () => {
    const setSortBy = vi.fn();
    const setIsFilterOpen = vi.fn();
    const filterState = {
      isFilterOpen: true,
      setIsFilterOpen,
      props: {
        selectedCourses: [],
        selectedSocieties: [],
        selectedYears: [],
        selectedRoles: [],
      },
    };
    renderToolbar({ filterState, setSortBy });
    fireEvent.click(screen.getByText("Open filters"));
    fireEvent.click(screen.getByText("Close filters"));
    fireEvent.click(screen.getByText("Toggle filters"));
    expect(setIsFilterOpen).toHaveBeenCalledWith(true);
    expect(setIsFilterOpen).toHaveBeenCalledWith(false);
  });

  it("wires the toolbar sort control", () => {
    const setSortBy = vi.fn();
    renderToolbar({ setSortBy });
    fireEvent.click(screen.getByText("Z → A"));
    expect(setSortBy).toHaveBeenCalledWith("name-desc");
  });

  it("renders skeleton cards with staggered animation delays", () => {
    const { container } = render(<DiscoverSkeleton />);
    const cards = container.querySelectorAll('[class*="skelUserCard"]');

    expect(cards).toHaveLength(8);
    expect(cards[0].style.animationDelay).toBe("0s");
    expect(cards[7].style.animationDelay).toBe("0.42s");
  });
});
