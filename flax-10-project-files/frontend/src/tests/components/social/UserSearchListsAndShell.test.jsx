import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("../../../components/common/search_bar/SearchBar", () => ({
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

vi.mock("../../../components/social/components/FilterDropdown", () => ({
  FilterDropdown: ({ filterName = "filters" }) => <div>{filterName}</div>,
}));

vi.mock("../../../components/common/empty_state/EmptyState", () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock("../../../components/social/components/UserSearchItems", () => ({
  UserResultItem: ({ user, onSelect }) => (
    <button type="button" onClick={onSelect}>
      {user.username}
    </button>
  ),
}));

vi.mock("../../../components/social/utils/userSearchShared", () => ({
  SEARCH_EMPTY_CONFIG: {
    loading: { icon: "x", title: "Searching users", description: "Loading" },
    users: { icon: "x", title: "No users found", description: "Try a different search" },
    start: { icon: "x", title: "Start typing", description: "Search by name" },
  },
  styles: new Proxy({}, { get: (_, key) => key }),
}));

import { SearchDropdown } from "../../../components/social/components/UserSearchLists";
import { FilterSection, GlobalSearchBar } from "../../../components/social/components/UserSearchShell";

describe("UserSearchLists and shell", () => {
  it("renders loading, query-empty, and query-empty-compact states", () => {
    const setQuery = vi.fn();
    const { rerender, container } = render(
      <SearchDropdown
        loading
        query=""
        setQuery={setQuery}
        userResults={[]}
        onUserSelect={vi.fn()}
        compact={false}
      />,
    );
    expect(screen.getByText("Searching users")).toBeInTheDocument();

    rerender(
      <SearchDropdown
        loading={false}
        query=""
        setQuery={setQuery}
        userResults={[]}
        onUserSelect={vi.fn()}
        compact={false}
      />,
    );
    expect(screen.getByText("Start typing")).toBeInTheDocument();

    rerender(
      <SearchDropdown
        loading={false}
        query=""
        setQuery={setQuery}
        userResults={[]}
        onUserSelect={vi.fn()}
        compact
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders custom empty state, inline mode, and selectable results", () => {
    const setQuery = vi.fn();
    const onUserSelect = vi.fn();
    const { rerender } = render(
      <SearchDropdown
        loading={false}
        query="abc"
        setQuery={setQuery}
        userResults={[]}
        onUserSelect={onUserSelect}
        compact={false}
        dropdownMode="inline"
        renderEmptyState={({ clear }) => (
          <button type="button" onClick={clear}>Custom empty</button>
        )}
      />,
    );

    expect(screen.getByText("Custom empty")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Custom empty"));
    expect(setQuery).toHaveBeenCalledWith("");

    rerender(
      <SearchDropdown
        loading={false}
        query="abc"
        setQuery={setQuery}
        userResults={[{ id: 1, username: "ada" }]}
        onUserSelect={onUserSelect}
        compact
      />,
    );

    fireEvent.click(screen.getByText("ada"));
    expect(onUserSelect).toHaveBeenCalledWith({ id: 1, username: "ada" });
  });

  it("renders the global search bar with dropdown only when requested", () => {
    const setQuery = vi.fn();
    const setFocus = vi.fn();
    const containerRef = { current: null };
    const { rerender } = render(
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

    rerender(
      <GlobalSearchBar
        query="ali"
        setQuery={setQuery}
        setFocus={setFocus}
        containerRef={containerRef}
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
