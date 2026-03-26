/*
 * Tests for Tasks taskFeedUtils: isRoutineOrEventTask, getHeaderTitle.
 */

import { describe, it, expect } from "vitest";
import { isRoutineOrEventTask, getHeaderTitle } from "../../../pages/Tasks/utils/taskFeedUtils";

describe("taskFeedUtils", () => {
  describe("isRoutineOrEventTask", () => {
    it("returns false for null or undefined", () => {
      expect(isRoutineOrEventTask(null)).toBe(false);
      expect(isRoutineOrEventTask(undefined)).toBe(false);
    });

    it("returns true when tag is routine or event", () => {
      expect(isRoutineOrEventTask({ tag: "routine" })).toBe(true);
      expect(isRoutineOrEventTask({ tag: "event" })).toBe(true);
    });

    it("returns true for meal-related titles", () => {
      expect(isRoutineOrEventTask({ title: "Breakfast" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Lunch with team" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Dinner" })).toBe(true);
    });

    it("returns true for lecture/seminar/tutorial titles", () => {
      expect(isRoutineOrEventTask({ title: "Math lecture" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Tutorial 2" })).toBe(true);
    });

    it("returns false for normal task title", () => {
      expect(isRoutineOrEventTask({ title: "Finish report" })).toBe(false);
    });
  });

  describe("getHeaderTitle", () => {
    it("returns Today for today filter", () => {
      expect(getHeaderTitle("today", null, null)).toBe("Today");
    });

    it("returns This Week for this_week filter", () => {
      expect(getHeaderTitle("this_week", null, null)).toBe("This Week");
    });

    it("returns Later for later filter", () => {
      expect(getHeaderTitle("later", null, null)).toBe("Later");
    });

    it("returns Overdue for overdue filter", () => {
      expect(getHeaderTitle("overdue", null, null)).toBe("Overdue");
    });

    it("returns list name when activeList set and no module", () => {
      expect(getHeaderTitle("all", { name: "Work" }, null)).toBe("Work");
    });

    it("returns list name and module when both set", () => {
      expect(getHeaderTitle("all", { name: "Work" }, "CS101")).toBe("Work: CS101");
    });

    it("falls back to a generic label when the active list has no name", () => {
      expect(getHeaderTitle("all", {}, "CS101")).toBe("List: CS101");
      expect(getHeaderTitle("all", {}, null)).toBe("List");
    });

    it("returns All tasks when no list and no module", () => {
      expect(getHeaderTitle("all", null, null)).toBe("All tasks");
    });

    it("returns activeModuleCode when no list", () => {
      expect(getHeaderTitle("all", null, "CS101")).toBe("CS101");
    });
  });
});
