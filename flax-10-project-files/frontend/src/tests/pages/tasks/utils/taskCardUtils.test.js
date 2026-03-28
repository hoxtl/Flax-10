/*
 * Tests for Tasks taskCardUtils: getModuleColor, formatDueDate, getCompletedDueLabel,
 * splitEstimatedBlocks, formatFocusBlocks, PRIORITY_LABELS, PRIORITY_MARKS.
 */

import { describe, it, expect, vi } from "vitest";
import {
  getModuleColor,
  formatDueDate,
  getCompletedDueLabel,
  splitEstimatedBlocks,
  formatFocusBlocks,
  PRIORITY_LABELS,
  PRIORITY_MARKS,
} from "../../../../pages/tasks/utils/taskCardUtils";

describe("taskCardUtils", () => {
  describe("getModuleColor", () => {
    it("returns same color for same module code", () => {
      const a = getModuleColor("CS101");
      const b = getModuleColor("CS101");
      expect(a).toEqual(b);
      expect(a).toHaveProperty("text");
      expect(a).toHaveProperty("bg");
      expect(a).toHaveProperty("border");
    });

    it("returns different colors for different codes when hash differs", () => {
      const a = getModuleColor("A");
      const b = getModuleColor("B");
      expect(a).not.toEqual(b);
    });
  });

  describe("formatDueDate", () => {
    it("returns null for null or missing", () => {
      expect(formatDueDate(null)).toBeNull();
      expect(formatDueDate(undefined)).toBeNull();
    });

    it("returns overdue for past date", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      const r = formatDueDate(past.toISOString());
      expect(r).toEqual({ label: "Overdue", status: "overdue" });
    });

    it("returns today for same calendar day", () => {
      vi.useFakeTimers();
      const today = new Date(2026, 2, 10, 14, 0);
      vi.setSystemTime(today);
      const r = formatDueDate(new Date(2026, 2, 10, 18, 0).toISOString());
      expect(r).toEqual({ label: "Today", status: "today" });
      vi.useRealTimers();
    });

    it("returns tomorrow for next day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const tomorrow = new Date(2026, 2, 11, 12, 0).toISOString();
      const r = formatDueDate(tomorrow);
      expect(r).toEqual({ label: "Tomorrow", status: "tomorrow" });
      vi.useRealTimers();
    });

    it("returns future with weekday for within week", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const future = new Date(2026, 2, 14, 10, 0).toISOString();
      const r = formatDueDate(future);
      expect(r.status).toBe("future");
      expect(r.label).toMatch(/Mar|14|Sat/);
      vi.useRealTimers();
    });

    it("returns future with month/day for beyond week", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const future = new Date(2026, 4, 20, 10, 0).toISOString();
      const r = formatDueDate(future);
      expect(r.status).toBe("future");
      expect(r.label).toMatch(/May|20|Apr/);
      vi.useRealTimers();
    });
  });

  describe("getCompletedDueLabel", () => {
    it("returns Completed when no due date", () => {
      expect(getCompletedDueLabel(null)).toBe("Completed");
    });

    it("returns Completed today when due today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const r = getCompletedDueLabel(new Date(2026, 2, 10, 15, 0).toISOString());
      expect(r).toBe("Completed today");
      vi.useRealTimers();
    });

    it("returns Completed yesterday when due yesterday", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10));
      const r = getCompletedDueLabel(new Date(2026, 2, 9, 12, 0).toISOString());
      expect(r).toBe("Completed yesterday");
      vi.useRealTimers();
    });
  });

  describe("splitEstimatedBlocks", () => {
    it("returns sessionCount and workMinutes for 1 block", () => {
      const r = splitEstimatedBlocks(1);
      expect(r).toEqual({ sessionCount: 1, workMinutes: 25 });
    });

    it("splits 2 blocks as 2 sessions of 25m", () => {
      const r = splitEstimatedBlocks(2);
      expect(r).toEqual({ sessionCount: 2, workMinutes: 25 });
    });

    it("splits 3 blocks as 3 sessions of 25m", () => {
      const r = splitEstimatedBlocks(3);
      expect(r).toEqual({ sessionCount: 3, workMinutes: 25 });
    });

    it("splits 4 blocks as 4 sessions of 25m", () => {
      const r = splitEstimatedBlocks(4);
      expect(r).toEqual({ sessionCount: 4, workMinutes: 25 });
    });

    it("defaults invalid input to 1 session 25m", () => {
      expect(splitEstimatedBlocks(0)).toEqual({ sessionCount: 1, workMinutes: 25 });
      expect(splitEstimatedBlocks(null)).toEqual({ sessionCount: 1, workMinutes: 25 });
    });
  });

  describe("formatFocusBlocks", () => {
    it("formats single session", () => {
      const r = formatFocusBlocks(1);
      expect(r).toMatch(/1 session/);
      expect(r).toMatch(/\d+m/);
    });

    it("formats multiple sessions", () => {
      const r = formatFocusBlocks(2);
      expect(r).toMatch(/2 sessions/);
    });
  });

  describe("PRIORITY_LABELS and PRIORITY_MARKS", () => {
    it("export expected keys", () => {
      expect(PRIORITY_LABELS).toMatchObject({ urgent: "Urgent", high: "High", medium: "Medium" });
      expect(PRIORITY_MARKS.urgent).toBe("❗❗❗");
      expect(PRIORITY_MARKS.high).toBe("❗❗");
      expect(PRIORITY_MARKS.medium).toBe("❗");
    });
  });
});
