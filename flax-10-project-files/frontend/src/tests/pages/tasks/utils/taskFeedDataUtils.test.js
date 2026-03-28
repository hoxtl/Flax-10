/*
 * Tests for taskFeedDataUtils.
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildDateBounds,
  matchesSearch,
  filterBySearch,
  getOverdue,
  getToday,
  getThisWeek,
  getLater,
  getCompletedTodayCount,
  getCompletedWeekCount,
  getCompletedLaterCount,
  getFilterHandlers,
} from "../../../../pages/tasks/utils/taskFeedDataUtils";

const listMap = { "1": { name: "Work" } };

describe("taskFeedDataUtils", () => {
  describe("buildDateBounds", () => {
    it("returns now dayStart todayEnd weekEnd", () => {
      const b = buildDateBounds();
      expect(b.dayStart.getHours()).toBe(0);
      expect(b.todayEnd.getHours()).toBe(23);
    });
  });

  describe("matchesSearch", () => {
    it("matches by title", () => {
      expect(matchesSearch({ title: "Hello", task_list: "1" }, "hello", listMap)).toBe(true);
    });

    it("matches by description", () => {
      expect(matchesSearch({ title: "X", description: "Secret", task_list: "1" }, "secret", listMap)).toBe(true);
    });

    it("matches by list name", () => {
      expect(matchesSearch({ title: "X", task_list: "1" }, "work", listMap)).toBe(true);
    });

    it("returns false when no match", () => {
      expect(matchesSearch({ title: "X", task_list: "2" }, "z", {})).toBe(false);
    });
  });

  describe("filterBySearch", () => {
    it("returns all when search empty", () => {
      const tasks = [{ title: "A", task_list: "1" }];
      expect(filterBySearch(tasks, "", listMap)).toEqual(tasks);
    });

    it("filters by search term", () => {
      const tasks = [{ title: "A", task_list: "1" }, { title: "B", task_list: "1" }];
      expect(filterBySearch(tasks, "a", listMap)).toHaveLength(1);
    });
  });

  describe("getOverdue", () => {
    it("filters incomplete overdue non-routine", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 15));
      const tasks = [{ id: 1, due_date: "2026-03-10T12:00:00", completed: false, title: "T1" }];
      const out = getOverdue(tasks, new Date(2026, 2, 15));
      expect(out).toHaveLength(1);
      vi.useRealTimers();
    });
  });

  describe("getToday getThisWeek getLater", () => {
    it("getToday filters correctly", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 12, 0));
      const now = new Date(2026, 2, 10, 12, 0);
      const todayEnd = new Date(2026, 2, 10, 23, 59, 59);
      const tasks = [{ id: 1, due_date: "2026-03-10T14:00:00", completed: false }];
      expect(getToday(tasks, now, todayEnd)).toHaveLength(1);
      vi.useRealTimers();
    });

    it("getThisWeek filters correctly", () => {
      const todayEnd = new Date(2026, 2, 10, 23, 59, 59);
      const weekEnd = new Date(2026, 2, 17, 23, 59, 59);
      const tasks = [{ id: 1, due_date: "2026-03-12T10:00:00", completed: false }];
      expect(getThisWeek(tasks, todayEnd, weekEnd)).toHaveLength(1);
    });

    it("getLater includes no-due and far-future", () => {
      const weekEnd = new Date(2026, 2, 17);
      const tasks = [{ id: 1, due_date: null }, { id: 2, due_date: "2026-03-20T10:00:00" }];
      expect(getLater(tasks, weekEnd)).toHaveLength(2);
    });
  });

  describe("getCompleted counts", () => {
    it("getCompletedTodayCount", () => {
      const dayStart = new Date(2026, 2, 10, 0, 0);
      const todayEnd = new Date(2026, 2, 10, 23, 59, 59);
      const completed = [{ due_date: "2026-03-10T14:00:00" }];
      expect(getCompletedTodayCount(completed, dayStart, todayEnd)).toBe(1);
    });

    it("getCompletedWeekCount", () => {
      const todayEnd = new Date(2026, 2, 10, 23, 59, 59);
      const weekEnd = new Date(2026, 2, 17, 23, 59, 59);
      const completed = [{ due_date: "2026-03-12T10:00:00" }];
      expect(getCompletedWeekCount(completed, todayEnd, weekEnd)).toBe(1);
    });

    it("getCompletedLaterCount", () => {
      const weekEnd = new Date(2026, 2, 17);
      const completed = [{ due_date: null }, { due_date: "2026-03-20T10:00:00" }];
      expect(getCompletedLaterCount(completed, weekEnd)).toBe(2);
    });
  });

  describe("getFilterHandlers", () => {
    it("toggleListFilter add", () => {
      const onFilterByList = vi.fn();
      getFilterHandlers([], onFilterByList, vi.fn(), vi.fn()).toggleListFilter("1");
      expect(onFilterByList).toHaveBeenCalledWith(["1"]);
    });

    it("toggleListFilter remove", () => {
      const onFilterByList = vi.fn();
      getFilterHandlers(["1"], onFilterByList, vi.fn(), vi.fn()).toggleListFilter("1");
      expect(onFilterByList).toHaveBeenCalledWith([]);
    });

    it("clearAllFilters", () => {
      const onFilterByList = vi.fn();
      const setFilterModuleCodes = vi.fn();
      const setFilterQuery = vi.fn();
      getFilterHandlers(["1"], onFilterByList, setFilterModuleCodes, setFilterQuery).clearAllFilters();
      expect(onFilterByList).toHaveBeenCalledWith([]);
      expect(setFilterModuleCodes).toHaveBeenCalledWith([]);
      expect(setFilterQuery).toHaveBeenCalledWith("");
    });

    it("toggles module filters through the updater and handles missing list filters", () => {
      const onFilterByList = vi.fn();
      const setFilterQuery = vi.fn();
      let moduleCodes = [];
      const setFilterModuleCodes = vi.fn((updater) => {
        moduleCodes = updater(moduleCodes);
      });

      const handlers = getFilterHandlers(undefined, onFilterByList, setFilterModuleCodes, setFilterQuery);

      handlers.toggleListFilter("2");
      expect(onFilterByList).toHaveBeenCalledWith(["2"]);

      handlers.toggleModuleFilter("CS101");
      expect(moduleCodes).toEqual(["CS101"]);

      handlers.toggleModuleFilter("CS101");
      expect(moduleCodes).toEqual([]);
    });
  });
});
