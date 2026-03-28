/*
 * Tests for user search dropdown and shell behaviour.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Tag = typeof tag === "string" ? tag : "div";
      return ({ children, ...props }) => {
        const { initial, animate, exit, transition, ...rest } = props;
        return <Tag {...rest}>{children}</Tag>;
      };
    },
  }),
}));

vi.mock("../../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, onFocus, placeholder, className }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

vi.mock("../../../../components/social/components/FilterDropdown", () => ({
  FilterDropdown: ({ filterName = "filters" }) => <div>{filterName}</div>,
}));

vi.mock("../../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../../components/social/components/UserSearchItems", () => ({
  UserResultItem: ({ user, onSelect }) => (
    <button type="button" onClick={onSelect}>
      {user.username}
    </button>
  ),
}));

vi.mock("../../../../components/social/utils/userSearchShared", () => ({
  SEARCH_EMPTY_CONFIG: {
    loading: { icon: "x", title: "Searching users", description: "Loading" },
    users: { icon: "x", title: "No users found", description: "Try a different search" },
    start: { icon: "x", title: "Start typing", description: "Search by name" },
  },
  styles: new Proxy({}, { get: (_, key) => key }),
}));

import { SearchDropdown } from "../../../../components/social/components/UserSearchLists";
import { FilterSection, GlobalSearchBar } from "../../../../components/social/components/UserSearchShell";

function buildDropdownProps(overrides = {}) {
  return {
    loading: false,
    query: "",
    setQuery: vi.fn(),
    userResults: [],
    onUserSelect: vi.fn(),
    compact: false,
    ...overrides,
  };
}

function renderDropdown(overrides = {}) {
  return render(<SearchDropdown {...buildDropdownProps(overrides)} />);
}

describe("UserSearchLists and shell", () => {
  it("renders the loading state", () => {
    const setQuery = vi.fn();
    renderDropdown({ loading: true, setQuery });
    expect(screen.getByText("Searching users")).toBeInTheDocument();
  });

  it("renders the start state when the query is empty", () => {
    renderDropdown();
    expect(screen.getByText("Start typing")).toBeInTheDocument();
  });

  it("renders nothing for empty compact results", () => {
    const { container } = renderDropdown({ compact: true });
    expect(container.firstChild).toBeNull();
  });

  it("uses the custom empty state renderer", () => {
    const setQuery = vi.fn();
    renderDropdown({
      query: "abc",
      setQuery,
      dropdownMode: "inline",
      renderEmptyState: ({ clear }) => <button type="button" onClick={clear}>Custom empty</button>,
    });
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Custom empty"));
    expect(setQuery).toHaveBeenCalledWith("");
  });

  it("selects compact search results", () => {
    const onUserSelect = vi.fn();
    renderDropdown({ query: "abc", userResults: [{ id: 1, username: "ada" }], onUserSelect, compact: true });
    fireEvent.click(screen.getByText("ada"));
    expect(onUserSelect).toHaveBeenCalledWith({ id: 1, username: "ada" });
  });

  it("renders result rows that fall back to the array index when a user id is missing", () => {
    const onUserSelect = vi.fn();
    renderDropdown({ query: "anon", userResults: [{ username: "fallback-user" }], onUserSelect });
    fireEvent.click(screen.getByText("fallback-user"));
    expect(onUserSelect).toHaveBeenCalledWith({ username: "fallback-user" });
  });

  it("renders the global search bar and forwards focus and change events", () => {
    const setQuery = vi.fn();
    const setFocus = vi.fn();
    const containerRef = { current: null };
    render(
      <GlobalSearchBar
        query=""
        setQuery={setQuery}
        setFocus={setFocus}
        containerRef={containerRef}
        showDropdown={false}
        loading={false}
        userResults={[]}
        handleSelect={vi.fn()}
        fullWidth
        compact={false}
        placeholder="Search people"
      />,
    );
    fireEvent.focus(screen.getByTestId("search-bar"));
    fireEvent.change(screen.getByTestId("search-bar"), { target: { value: "ali" } });
    expect(setFocus).toHaveBeenCalled();
    expect(setQuery).toHaveBeenCalledWith("ali");
    expect(screen.getByPlaceholderText("Search people")).toBeInTheDocument();
  });

  it("renders the global dropdown only when requested", () => {
    render(
      <GlobalSearchBar
        query="ali"
        setQuery={vi.fn()}
        setFocus={vi.fn()}
        containerRef={{ current: null }}
        showDropdown
        loading={false}
        userResults={[]}
        handleSelect={vi.fn()}
        fullWidth={false}
        compact={false}
      />,
    );
    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("opens the filter section through hover and click controls", () => {
    const setOpen = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <FilterSection
        fRef={{ current: null }}
        isOpen
        setOpen={setOpen}
        onOpen={onOpen}
        onClose={onClose}
        props={{ filterName: "Filter content" }}
      />,
    );

    fireEvent.mouseEnter(screen.getByText("Filter"));
    fireEvent.mouseLeave(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Filter"));

    expect(onOpen).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalled();
    expect(screen.getByText("Filter content")).toBeInTheDocument();
  });
});
