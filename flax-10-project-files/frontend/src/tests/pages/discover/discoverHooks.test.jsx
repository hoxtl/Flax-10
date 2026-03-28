import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const searchUsersMock = vi.fn();
const useSearchInitMock = vi.fn();
const useFilterStateMock = vi.fn();
const useClickOutsideMock = vi.fn();

vi.mock("../../../api/userApi", () => ({
  searchUsers: (...args) => searchUsersMock(...args),
}));

vi.mock("../../../components/social/components/UserSearch", () => ({
  useSearchInit: (...args) => useSearchInitMock(...args),
  useFilterState: (...args) => useFilterStateMock(...args),
  useClickOutside: (...args) => useClickOutsideMock(...args),
}));

import {
  useDiscoverFetch,
  useDiscoverSearch,
} from "../../../pages/discover/hooks/discoverHooks";

describe("discoverHooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useSearchInitMock.mockReturnValue({
      allCourses: { cs: [] },
      allSocieties: [{ id: 1, name: "Tech" }],
    });
  });

  it("treats missing roles and malformed search payloads as empty results", async () => {
    searchUsersMock.mockResolvedValueOnce({});

    const filterState = {
      props: {
        selectedCourses: ["CS"],
        selectedSocieties: ["Tech"],
        selectedYears: ["2"],
      },
    };

    const { result } = renderHook(() => useDiscoverFetch("bio", filterState, "name"));

    await act(async () => {
      vi.advanceTimersByTime(320);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(searchUsersMock).toHaveBeenCalledWith("bio", "CS", "Tech", 0, 15, "2", "", "name");
    expect(result.current.loading).toBe(false);
    expect(result.current.users).toEqual([]);
    expect(result.current.totalPages).toBe(0);
  });

  it("closes the filter drawer when the click-outside callback fires", async () => {
    const setIsFilterOpen = vi.fn();
    useFilterStateMock.mockImplementation((allCourses, allSocieties, query, allowRoles, roles, onOpen, onClose) => {
      onOpen?.();
      onClose?.();
      return {
        setIsFilterOpen,
        props: {
          selectedCourses: [],
          selectedSocieties: [],
          selectedYears: [],
          selectedRoles: undefined,
        },
      };
    });
    searchUsersMock.mockResolvedValueOnce({ results: [], total_count: 0 });

    renderHook(() => useDiscoverSearch());

    await act(async () => {
      vi.advanceTimersByTime(320);
    });

    const closeFilters = useClickOutsideMock.mock.calls[0][1];
    closeFilters();

    expect(setIsFilterOpen).toHaveBeenCalledWith(false);
  });
});
