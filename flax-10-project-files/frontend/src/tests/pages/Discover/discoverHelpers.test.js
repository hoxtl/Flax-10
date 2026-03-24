import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const searchUsersMock = vi.fn();
const useSearchInitMock = vi.fn();
const useFilterStateMock = vi.fn();
const useClickOutsideMock = vi.fn();

vi.mock("../../../api/userApi", () => ({
  searchUsers: (...args) => searchUsersMock(...args),
}));

vi.mock("../../../components/Social/UserSearch", () => ({
  useSearchInit: (...args) => useSearchInitMock(...args),
  useFilterState: (...args) => useFilterStateMock(...args),
  useClickOutside: (...args) => useClickOutsideMock(...args),
}));

import {
  filterVisibleUsers,
  getCurrentUser,
  getDiscoverSortOptions,
  getDisplayName,
  getRoleLabel,
  sortDiscoverUsers,
  USERS_PER_PAGE,
} from "../../../pages/Discover/discoverHelpers";
import { useDiscoverFetch, useDiscoverSearch } from "../../../pages/Discover/discoverHooks";

describe("discover helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    useSearchInitMock.mockReturnValue({ allCourses: { cs: [] }, allSocieties: [{ id: 1, name: "Tech" }] });
    useFilterStateMock.mockReturnValue({
      isFilterOpen: false,
      setIsFilterOpen: vi.fn(),
      props: {
        selectedCourses: [],
        selectedSocieties: [],
        selectedYears: [],
        selectedRoles: [],
      },
    });
    searchUsersMock.mockResolvedValue({ results: [], total_count: 0 });
  });

  it("formats names, roles, current user, and visible users", () => {
    expect(getDisplayName({ name: "  Ava Stone " })).toBe("Ava Stone");
    expect(getDisplayName({ first_name: "Ava", last_name: "Stone" })).toBe("Ava Stone");
    expect(getDisplayName({ first_name: "Sam", last_name: "Lee", role: "teacher" })).toBe("Dr. Sam Lee");
    expect(getDisplayName({})).toBe("User");

    expect(getRoleLabel("teacher")).toBe("Teacher");
    expect(getRoleLabel("student")).toBe("Student");
    expect(getRoleLabel("pending_teacher")).toBe("Teacher applicant");
    expect(getRoleLabel("other")).toBe("User");
    expect(getDiscoverSortOptions()).toHaveLength(2);
    expect(USERS_PER_PAGE).toBe(15);

    localStorage.setItem("user", JSON.stringify({ id: 2, username: "sam" }));
    expect(getCurrentUser()).toEqual({ id: 2, username: "sam" });
    expect(
      filterVisibleUsers([
        { id: 2, username: "sam" },
        { id: 3, username: "ava" },
      ])
    ).toEqual([{ id: 3, username: "ava" }]);
  });

  it("sorts discover users in both directions and leaves unknown sorts untouched", () => {
    const users = [
      { first_name: "Bella", last_name: "Zed" },
      { first_name: "Ava", last_name: "Stone" },
    ];

    expect(sortDiscoverUsers(users, "name").map((user) => user.first_name)).toEqual(["Ava", "Bella"]);
    expect(sortDiscoverUsers(users, "name-desc").map((user) => user.first_name)).toEqual(["Bella", "Ava"]);
    expect(sortDiscoverUsers(users, "none")).toEqual(users);
  });

  it("fetch hook debounces requests, sorts results, and recovers from API errors", async () => {
    vi.useRealTimers();
    const filterState = {
      props: {
        selectedCourses: ["CS"],
        selectedSocieties: ["Tech"],
        selectedYears: ["2"],
        selectedRoles: ["teacher"],
      },
    };
    searchUsersMock.mockResolvedValueOnce({
      results: [
        { first_name: "Bella", last_name: "Zed" },
        { first_name: "Ava", last_name: "Stone" },
      ],
      total_count: 30,
    });

    const { result, rerender } = renderHook(
      ({ query, sortBy }) => useDiscoverFetch(query, filterState, sortBy),
      { initialProps: { query: "bio", sortBy: "name" } }
    );

    await new Promise((resolve) => setTimeout(resolve, 320));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(searchUsersMock).toHaveBeenCalledWith("bio", "CS", "Tech", 0, 15, "2", "teacher", "name");
    expect(result.current.users.map((user) => user.first_name)).toEqual(["Ava", "Bella"]);
    expect(result.current.totalPages).toBe(2);

    searchUsersMock.mockRejectedValueOnce(new Error("nope"));
    rerender({ query: "chem", sortBy: "name-desc" });
    await new Promise((resolve) => setTimeout(resolve, 320));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([]);
  });

  it("discover search hook composes UI and fetch state", async () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useDiscoverSearch());
    expect(result.current.searchQuery).toBe("");
    expect(result.current.sortBy).toBe("name");
    expect(result.current.filterRef.current).toBeNull();
    expect(useClickOutsideMock).toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 320));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
