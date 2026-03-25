import { describe, expect, it } from "vitest";

import {
  getReadingListLabel,
  getTeachingListDisplayName,
  isReadingList,
  isReadingListName,
  isTeachingList,
  matchesReadingList,
  parseReadingListName,
} from "../../../pages/Tasks/utils/readingListUtils";

describe("readingListUtils", () => {
  it("detects teaching lists and strips the teaching prefix", () => {
    const list = { name: "Teaching - Pharmacology" };
    expect(isTeachingList(list)).toBe(true);
    expect(getTeachingListDisplayName(list)).toBe("Pharmacology");
    expect(isTeachingList({ name: "Reading List - Pharmacology" })).toBe(false);
    expect(isTeachingList({})).toBe(false);
    expect(getTeachingListDisplayName({})).toBe("");
  });

  it("detects modern and legacy reading-list names", () => {
    expect(isReadingListName("cs101 - Systems")).toBe(true);
    expect(isReadingListName("Reading List - Operating Systems")).toBe(true);
    expect(isReadingListName("  random list  ")).toBe(false);
    expect(isReadingList({ name: "ma202 - Algebra" })).toBe(true);
  });

  it("parses reading-list names across modern, legacy, and fallback formats", () => {
    expect(parseReadingListName("cs101 - Systems")).toEqual({
      label: "cs101 - Systems",
      moduleCode: "CS101",
      moduleName: "Systems",
    });
    expect(parseReadingListName("Reading List - Classics")).toEqual({
      label: "Reading List - Classics",
      moduleCode: "",
      moduleName: "Classics",
    });
    expect(parseReadingListName("Unstructured Name")).toEqual({
      label: "Unstructured Name",
      moduleCode: "",
      moduleName: "Unstructured Name",
    });
  });

  it("matches readings by module code first and falls back to module name", () => {
    expect(matchesReadingList(
      { module_code: "CS101", module_name: "Ignored" },
      { name: "cs101 - Systems" },
    )).toBe(true);

    expect(matchesReadingList(
      { module_code: "", module_name: "Operating Systems" },
      { name: "Reading List - Operating Systems" },
    )).toBe(true);

    expect(matchesReadingList(
      { module_code: "MA101", module_name: "Maths" },
      { name: "Random List" },
    )).toBe(false);
  });

  it("builds readable labels for active lists and falls back safely", () => {
    expect(getReadingListLabel({ name: "cs101 - Systems" })).toBe("CS101 Systems");
    expect(getReadingListLabel({ name: "Reading List - Systems" })).toBe("Systems");
    expect(getReadingListLabel({ name: "" })).toBe("this reading list");
    expect(getReadingListLabel(null)).toBe("this reading list");
  });
});
