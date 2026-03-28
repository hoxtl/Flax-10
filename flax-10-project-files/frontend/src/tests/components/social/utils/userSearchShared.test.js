import { describe, expect, it } from "vitest";

import {
  FILTER_TABS,
  ROLE_OPTIONS,
  SEARCH_EMPTY_CONFIG,
  YEAR_OPTIONS,
  allCourses,
  styles,
} from "../../../../components/social/utils/userSearchShared";

describe("userSearchShared", () => {
  it("exports the shared course and filter metadata", () => {
    expect(allCourses).toBeTypeOf("object");
    expect(Object.keys(allCourses).length).toBeGreaterThan(0);
    expect(YEAR_OPTIONS).toEqual(["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"]);
    expect(ROLE_OPTIONS).toEqual([
      { value: "student", label: "Student" },
      { value: "teacher", label: "Professor" },
    ]);
    expect(FILTER_TABS.map((tab) => tab.value)).toEqual(["roles", "courses", "years", "societies"]);
    expect(SEARCH_EMPTY_CONFIG.start.title).toBe("Start typing");
    expect(styles).toBeTypeOf("object");
  });
});
