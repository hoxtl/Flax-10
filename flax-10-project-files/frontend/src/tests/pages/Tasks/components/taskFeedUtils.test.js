/**
 * Tests for TaskFeed components/taskFeedUtils: isRoutineOrEventTask, sortTasks, getListColor, PRIORITY_ORDER.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isRoutineOrEventTask,
  sortTasks,
  getListColor,
  PRIORITY_ORDER,
} from "../../../../pages/Tasks/components/taskFeedUtils";

describe("TaskFeed components taskFeedUtils", () => {
  describe("PRIORITY_ORDER", () => {
    it("exposes priority order map", () => {
      expect(PRIORITY_ORDER.urgent).toBe(0);
      expect(PRIORITY_ORDER.high).toBe(1);
      expect(PRIORITY_ORDER.medium).toBe(2);
      expect(PRIORITY_ORDER.low).toBe(3);
    });
  });

  describe("isRoutineOrEventTask", () => {
    it("returns false for null or undefined", () => {
      expect(isRoutineOrEventTask(null)).toBe(false);
      expect(isRoutineOrEventTask(undefined)).toBe(false);
    });

    it("returns true when tag is routine or event", () => {
      expect(isRoutineOrEventTask({ tag: "routine" })).toBe(true);
      expect(isRoutineOrEventTask({ tag: "event" })).toBe(true);
    });

    it("returns true for meal/breakfast/lunch/sleep/coffee/dinner/brunch/snack titles", () => {
      expect(isRoutineOrEventTask({ title: "Breakfast" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Lunch" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Sleep" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Coffee" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Dinner" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Brunch" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Snack" })).toBe(true);
    });

    it("returns true for lecture/seminar/tutorial/lab session titles", () => {
      expect(isRoutineOrEventTask({ title: "Math lecture" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Seminar" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Tutorial 2" })).toBe(true);
      expect(isRoutineOrEventTask({ title: "Lab session" })).toBe(true);
    });

    it("returns false for normal task title", () => {
      expect(isRoutineOrEventTask({ title: "Finish report" })).toBe(false);
    });
  });

  describe("sortTasks", () => {
    const listMap = { "1": { name: "A", id: 1, idx: 0 }, "2": { name: "B", id: 2, idx: 1 } };
    const tasks = [
      { id: 3, title: "Z", priority: "low", due_date: "2025-03-15", task_list: 2, estimated_blocks: 2 },
      { id: 1, title: "A", priority: "high", due_date: "2025-03-10", task_list: 1, estimated_blocks: 1 },
      { id: 2, title: "M", priority: "urgent", due_date: "2025-03-12", task_list: 1, estimated_blocks: 3 },
    ];

    it("sorts by priority", () => {
      const out = sortTasks(tasks, "priority", listMap);
      expect(out[0].priority).toBe("urgent");
      expect(out[1].priority).toBe("high");
      expect(out[2].priority).toBe("low");
    });

    it("sorts by due date", () => {
      const out = sortTasks(tasks, "due", listMap);
      expect(out.map(t => t.due_date)).toEqual(["2025-03-10", "2025-03-12", "2025-03-15"]);
    });

    it("sorts by alpha title", () => {
      const out = sortTasks(tasks, "alpha", listMap);
      expect(out.map(t => t.title)).toEqual(["A", "M", "Z"]);
    });

    it("sorts by list name", () => {
      const out = sortTasks(tasks, "list", listMap);
      expect(out.map(t => t.task_list)).toEqual([1, 1, 2]);
    });

    it("sorts by date_added (id descending)", () => {
      const out = sortTasks(tasks, "date_added", listMap);
      expect(out.map(t => t.id)).toEqual([3, 2, 1]);
    });

    it("sorts by est_time", () => {
      const out = sortTasks(tasks, "est_time", listMap);
      expect(out.map(t => t.estimated_blocks)).toEqual([1, 2, 3]);
    });

    it("falls back to priority for unknown sortBy", () => {
      const out = sortTasks(tasks, "unknown", listMap);
      expect(out).toHaveLength(3);
    });
  });

  describe("getListColor", () => {
    beforeEach(() => {
      localStorage.clear();
    });
    afterEach(() => {
      localStorage.clear();
    });

    it("returns list.color when set", () => {
      expect(getListColor({ color: "#abc" })).toBe("#abc");
    });

    it("returns stored color from localStorage when list has id and no color", () => {
      localStorage.setItem("listColor:42", "#def");
      expect(getListColor({ id: 42 })).toBe("#def");
    });

    it("returns default from palette by idx when no color and no stored", () => {
      const list = { id: 1, idx: 0 };
      const color = getListColor(list);
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("uses list.idx for palette index", () => {
      const list0 = { id: 1, idx: 0 };
      const list1 = { id: 2, idx: 1 };
      expect(getListColor(list0)).not.toBe(getListColor(list1));
    });
  });
});
