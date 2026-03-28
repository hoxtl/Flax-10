import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const setIsFilterOpenMock = vi.fn();

vi.mock("../../../../components/social/components/UserSearchShell", () => ({
  GlobalSearchBar: ({ fullWidth }) => <div data-testid="global-search" data-full-width={String(fullWidth)} />,
  FilterSection: () => <div data-testid="filter-section" />,
}));

vi.mock("../../../../components/social/hooks/userSearchHooks", () => ({
  useClickOutside: vi.fn(),
  useFilterState: () => ({
    active: true,
    isFilterOpen: false,
    setIsFilterOpen: setIsFilterOpenMock,
    props: {},
  }),
  useSearchInit: vi.fn(),
  useSearchState: () => ({
    query: "",
    setQuery: vi.fn(),
    containerRef: { current: null },
    loading: false,
    userResults: [],
    allCourses: [],
    allSocieties: [],
    setUserResults: vi.fn(),
    setLoading: vi.fn(),
  }),
}));

vi.mock("../../../../components/social/utils/userSearchShared", () => ({
  styles: {
    userSearchWrapper: "user-search-wrapper",
    fullWidthWrapper: "full-width-wrapper",
  },
}));

import UserSearch from "../../../../components/social/components/UserSearch";

describe("UserSearch layout", () => {
  it("applies the full-width wrapper class when requested", () => {
    const { container } = render(<UserSearch fullWidth />);

    expect(container.firstChild).toHaveClass("user-search-wrapper", "full-width-wrapper");
    expect(screen.getByTestId("global-search")).toHaveAttribute("data-full-width", "true");
    expect(screen.getByTestId("filter-section")).toBeInTheDocument();
  });
});
