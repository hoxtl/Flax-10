import { beforeEach, describe, expect, it, vi } from "vitest";

const searchUsersMock = vi.fn();

vi.mock("../../../api/userApi", () => ({
  searchUsers: (...args) => searchUsersMock(...args),
}));

import {
  fetchUserResults,
  filterCourses,
  filterObj,
  getSocietyCategories,
  handleErr,
  matchCat,
  toggleArr,
} from "../../../components/social/utils/userSearchUtils";

describe("userSearchUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleErr clears results safely", () => {
    const setter = vi.fn();
    handleErr("users", new Error("boom"), setter);
    expect(setter).toHaveBeenCalledWith([]);
  });

  it("fetchUserResults returns early with empty results when no filters are present", async () => {
    const setResults = vi.fn();
    const setLoading = vi.fn();

    await fetchUserResults("", "", "", "", "", setResults, setLoading);

    expect(setResults).toHaveBeenCalledWith([]);
    expect(setLoading).not.toHaveBeenCalled();
    expect(searchUsersMock).not.toHaveBeenCalled();
  });

  it("fetchUserResults supports array payloads and safe missing setters", async () => {
    searchUsersMock.mockResolvedValueOnce([{ id: 1, username: "ada" }]);

    await expect(fetchUserResults("ada", "", "", "", "", undefined, undefined)).resolves.toBeUndefined();
    expect(searchUsersMock).toHaveBeenCalledWith("ada", "", "", 0, 20, "", "");
  });

  it("fetchUserResults stores object results and clears loading afterwards", async () => {
    const setResults = vi.fn();
    const setLoading = vi.fn();
    searchUsersMock.mockResolvedValueOnce({ results: [{ id: 2, username: "ben" }] });

    await fetchUserResults("ben", "course", "", "", "", setResults, setLoading);

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setResults).toHaveBeenCalledWith([{ id: 2, username: "ben" }]);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
  });

  it("fetchUserResults falls back to an empty array when the request fails", async () => {
    const setResults = vi.fn();
    const setLoading = vi.fn();
    searchUsersMock.mockRejectedValueOnce(new Error("nope"));

    await fetchUserResults("ben", "", "", "", "", setResults, setLoading);

    expect(setResults).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("extracts and sorts unique society categories with an 'other' fallback", () => {
    const result = getSocietyCategories([
      { categories: ["Academic"] },
      { categories: ["Sports"] },
      { categories: [] },
      {},
      { categories: ["academic"] },
    ]);
    expect(result).toEqual(["academic", "other", "sports"]);
  });

  it("filters object items case-insensitively across keys", () => {
    const items = [
      { name: "Ada Lovelace", username: "ada" },
      { name: "Grace Hopper", username: "grace" },
      { name: "Unknown" },
    ];

    expect(filterObj(items, "", ["name"])).toEqual(items);
    expect(filterObj(items, "HOP", ["name", "username"])).toEqual([items[1]]);
    expect(filterObj(items, "zzz", ["username"])).toEqual([]);
  });

  it("filters course groups by department name or course value", () => {
    const groups = {
      Computing: ["Computer Science BSc", "Artificial Intelligence MSc"],
      Mathematics: ["Pure Maths BSc"],
    };

    expect(filterCourses(groups, "comp")).toEqual({ Computing: groups.Computing });
    expect(filterCourses(groups, "pure")).toEqual({ Mathematics: ["Pure Maths BSc"] });
    expect(filterCourses(groups, "   ")).toEqual(groups);
  });

  it("toggles array membership", () => {
    expect(toggleArr(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleArr(["a"], "b")).toEqual(["a", "b"]);
  });

  it("matches explicit and fallback society categories", () => {
    expect(matchCat({ categories: ["Academic"] }, "academic")).toBe(true);
    expect(matchCat({ categories: [] }, "other")).toBe(true);
    expect(matchCat({ categories: ["Sports"] }, "other")).toBe(false);
  });
});
