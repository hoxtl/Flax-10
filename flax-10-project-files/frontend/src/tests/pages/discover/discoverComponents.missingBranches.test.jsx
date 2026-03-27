/**
 * Targeted tests to reach 100% coverage on DiscoverComponents.jsx.
 *
 * Gaps addressed:
 *  - openFilters / closeFilters / toggleFilter bodies (3 uncovered functions)
 *  - teacher with a non-empty major  → "Department: <major>"
 *  - student with year + major       → CourseInfo yearText+majorText truthy branches
 *  - student with year but no major  → separator falsy branch
 *  - student with no year            → user?.year || "" fallback
 *  - user identified as teacher via "Dr." name prefix (role !== "teacher")
 *  - modules 1-3 (modules.length > 3 === false, non-empty list)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── framer-motion ────────────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
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
          return React.createElement(tag, rest, children);
        },
    },
  ),
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

// ── CSS modules ──────────────────────────────────────────────────────────────
vi.mock('*.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

// ── lucide-react ─────────────────────────────────────────────────────────────
vi.mock('lucide-react', () => ({
  Search: () => <span />,
  X: () => <span />,
  ChevronDown: () => <span />,
  SlidersHorizontal: () => <span />,
  ArrowUp: () => <span />,
}));

// ── UserAvatar / GridCard / EntityLinkChip ───────────────────────────────────
vi.mock('../../../components/common/user_avatar/UserAvatar', () => ({
  default: () => <div data-testid="user-avatar" />,
}));

vi.mock('../../../components/common/card/GridCard', () => ({
  default: ({ children, onClick }) => (
    <div data-testid="grid-card" onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/common/entity_link_chip/EntityLinkChip', () => ({
  default: ({ children }) => <span>{children}</span>,
}));

vi.mock('../../../components/common/primary_button/PrimaryButton', () => ({
  default: ({ children, onClick, type, className, pill }) => (
    <button type={type || 'button'} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/common/empty_state/EmptyState', () => ({
  default: ({ title }) => <div>{title}</div>,
}));

vi.mock('../../../components/common/search_empty_state/SearchEmptyState', () => ({
  default: ({ query }) => <div>{`No users match "${query}"`}</div>,
}));

vi.mock('../../../components/common/page_toolbar/PageToolbar', () => ({
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

vi.mock('../../../components/common/search_bar/SearchBar', () => ({
  default: ({ placeholder, value, onChange }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('../../../components/common', () => ({
  SegmentedControl: ({ value, onChange, options }) => (
    <div data-testid="segmented-control">
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../components/pagination/Pagination', () => ({
  Pagination: ({ currentPage, totalPages }) => (
    <div data-testid="pagination">
      {currentPage}/{totalPages}
    </div>
  ),
  BackToTop: () => <button data-testid="back-to-top">Top</button>,
}));

vi.mock('../../../utils/tutorPhotoFallback', () => ({
  getResolvedUserPhoto: () => null,
}));

// ── FilterSection mock that exposes callback buttons ─────────────────────────
vi.mock('../../../components/social/components/UserSearch', () => ({
  FilterSection: ({ onOpen, onClose, setOpen }) => (
    <div data-testid="filter-section">
      <button data-testid="btn-filter-open" onClick={onOpen}>
        Open Filters
      </button>
      <button data-testid="btn-filter-close" onClick={onClose}>
        Close Filters
      </button>
      <button data-testid="btn-filter-toggle" onClick={setOpen}>
        Toggle Filters
      </button>
    </div>
  ),
  useSearchInit: vi.fn(() => ({ allCourses: {}, allSocieties: [] })),
  useFilterState: vi.fn(() => ({
    isFilterOpen: false,
    setIsFilterOpen: vi.fn(),
    props: { selectedCourses: [], selectedSocieties: [], selectedYears: [], selectedRoles: [] },
  })),
  useClickOutside: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────
import {
  DiscoverToolbar,
  UsersGrid,
} from '../../../pages/discover/components/DiscoverComponents';

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function renderGrid(users, extra = {}) {
  return render(
    <UsersGrid
      users={users}
      onNavChange={vi.fn()}
      loading={false}
      currentPage={1}
      totalPages={1}
      setCurrentPage={vi.fn()}
      searchQuery=""
      {...extra}
    />,
  );
}

beforeEach(() => {
  localStorage.clear();
});

// ── DiscoverToolbar: filter callback functions ───────────────────────────────

describe('DiscoverToolbar – filter callbacks', () => {
  it('calls openFilters when the Open button is clicked', () => {
    const setIsFilterOpen = vi.fn();
    const filterState = { ...makeFilterState(), setIsFilterOpen };

    render(
      <DiscoverToolbar
        searchQuery=""
        setSearchQuery={vi.fn()}
        filterRef={{ current: null }}
        filterState={filterState}
        sortBy="name"
        setSortBy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-filter-open'));
    expect(setIsFilterOpen).toHaveBeenCalledWith(true);
  });

  it('calls closeFilters when the Close button is clicked', () => {
    const setIsFilterOpen = vi.fn();
    const filterState = { ...makeFilterState(), setIsFilterOpen };

    render(
      <DiscoverToolbar
        searchQuery=""
        setSearchQuery={vi.fn()}
        filterRef={{ current: null }}
        filterState={filterState}
        sortBy="name"
        setSortBy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-filter-close'));
    expect(setIsFilterOpen).toHaveBeenCalledWith(false);
  });

  it('calls toggleFilter (setIsFilterOpen with flipped value) when Toggle is clicked', () => {
    const setIsFilterOpen = vi.fn();
    const filterState = { isFilterOpen: false, setIsFilterOpen, props: makeFilterState().props };

    render(
      <DiscoverToolbar
        searchQuery=""
        setSearchQuery={vi.fn()}
        filterRef={{ current: null }}
        filterState={filterState}
        sortBy="name"
        setSortBy={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('btn-filter-toggle'));
    // toggleFilter calls setIsFilterOpen(!filterState.isFilterOpen) = !false = true
    expect(setIsFilterOpen).toHaveBeenCalledWith(true);
  });
});

// ── UsersGrid: student with year + major (CourseInfo both truthy) ─────────────

describe('UsersGrid – student with year and major', () => {
  it('renders yearText, separator, and majorText for a student with both set', () => {
    const users = [
      {
        id: 30,
        username: 'student_a',
        first_name: 'Alice',
        last_name: 'Green',
        role: 'student',
        year: 'Year 2',
        major: 'Mathematics',
        modules: ['MA101', 'MA102'],
      },
    ];

    renderGrid(users);

    expect(screen.getByText('Year 2')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    // The separator span " • " renders between the two spans; verify via the
    // document body text so we don't depend on RTL's exact-text matching quirks.
    expect(document.body.textContent).toContain('•');
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('renders yearText without separator when major is absent', () => {
    const users = [
      {
        id: 31,
        username: 'student_b',
        first_name: 'Bob',
        last_name: 'Hill',
        role: 'student',
        year: 'Year 1',
        // no major
        modules: [],
      },
    ];

    renderGrid(users);

    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.queryByText(' • ')).not.toBeInTheDocument();
  });

  it('falls back to empty yearText when student has no year set', () => {
    const users = [
      {
        id: 32,
        username: 'student_c',
        first_name: 'Clara',
        last_name: 'Fox',
        role: 'student',
        // no year
        major: 'Physics',
        modules: [],
      },
    ];

    renderGrid(users);

    // Year text is empty so only major text shows (no separator)
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.queryByText(' • ')).not.toBeInTheDocument();
  });
});

// ── UsersGrid: teacher with non-empty major ──────────────────────────────────

describe('UsersGrid – teacher with a non-empty major', () => {
  it('renders "Department: <major>" for a teacher who has a major set', () => {
    const users = [
      {
        id: 40,
        username: 'prof_cs',
        first_name: 'Grace',
        last_name: 'Hopper',
        role: 'teacher',
        major: 'Computer Science',
        modules: [],
      },
    ];

    renderGrid(users);

    expect(screen.getByText('Department: Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Professor')).toBeInTheDocument();
  });
});

// ── UsersGrid: user identified as teacher by "Dr." name prefix ───────────────

describe('UsersGrid – Dr. prefix without teacher role', () => {
  it('identifies a user as Professor when their display name starts with "Dr."', () => {
    const users = [
      {
        id: 50,
        username: 'drwatson',
        name: 'Dr. Watson', // serverName returned by getDisplayName
        // role deliberately omitted → not "teacher" but Dr. prefix triggers isTeacher
        modules: [],
      },
    ];

    renderGrid(users);

    expect(screen.getByText('Professor')).toBeInTheDocument();
  });
});

// ── UsersGrid: modules list between 1 and 3 items ────────────────────────────

describe('UsersGrid – modules length between 1 and 3', () => {
  it('shows pills but no overflow "+N" label when modules.length <= 3', () => {
    const users = [
      {
        id: 60,
        username: 'student_d',
        first_name: 'Dan',
        last_name: 'Shore',
        role: 'student',
        year: 'Year 3',
        major: 'History',
        modules: ['HI101', 'HI102'],
      },
    ];

    renderGrid(users);

    expect(screen.getByText('HI101')).toBeInTheDocument();
    expect(screen.getByText('HI102')).toBeInTheDocument();
    // No overflow pill
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });
});
