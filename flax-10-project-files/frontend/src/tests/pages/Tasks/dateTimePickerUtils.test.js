/**
 * Tests for Tasks dateTimePickerUtils: pad, formatDisplay, calendarDays, parseIncomingValue, emitChange.
 */

import { describe, it, expect, vi } from "vitest";
import {
  pad,
  formatDisplay,
  calendarDays,
  parseIncomingValue,
  emitChange,
} from "../../../pages/Tasks/utils/dateTimePickerUtils";

describe("dateTimePickerUtils", () => {
  describe("pad", () => {
    it("pads single digit with leading zero", () => {
      expect(pad(5)).toBe("05");
      expect(pad(0)).toBe("00");
    });

    it("keeps two digits as string", () => {
      expect(pad(12)).toBe("12");
    });
  });

  describe("formatDisplay", () => {
    it("returns empty string for null", () => {
      expect(formatDisplay(null)).toBe("");
    });

    it("returns date and time in en-GB style", () => {
      const d = new Date(2026, 2, 15, 14, 30);
      const out = formatDisplay(d);
      expect(out).toMatch(/15/);
      expect(out).toMatch(/Mar/);
      expect(out).toMatch(/2026/);
      expect(out).toMatch(/14:30/);
    });
  });

  describe("calendarDays", () => {
    it("returns leading nulls then day numbers for month", () => {
      const days = calendarDays(2026, 2);
      const firstDay = new Date(2026, 2, 1).getDay();
      let nullCount = 0;
      let i = 0;
      while (i < days.length && days[i] === null) {
        nullCount++;
        i++;
      }
      expect(nullCount).toBe(firstDay);
      expect(days.filter((d) => d !== null).length).toBe(31);
    });

    it("February has 28 days in non-leap year", () => {
      const days = calendarDays(2025, 1);
      expect(days.filter((d) => d !== null)).toHaveLength(28);
    });
  });

  describe("parseIncomingValue", () => {
    it("returns null for null or empty", () => {
      expect(parseIncomingValue(null, false)).toBeNull();
      expect(parseIncomingValue("", false)).toBeNull();
    });

    it("parses ISO string to Date when not timeOnly", () => {
      const d = parseIncomingValue("2026-03-15T10:30:00", false);
      expect(d).toBeInstanceOf(Date);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(15);
    });

    it("parses HH:mm to today date with time when timeOnly", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 0, 0));
      const d = parseIncomingValue("14:45", true);
      expect(d).toBeInstanceOf(Date);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(45);
      vi.useRealTimers();
    });
  });

  describe("emitChange", () => {
    it("calls onChange with empty string when date is null", () => {
      const onChange = vi.fn();
      emitChange(onChange, false, null, 12, 0);
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("calls onChange with ISO date when timeOnly is false", () => {
      const onChange = vi.fn();
      const d = new Date(2026, 2, 15, 10, 30);
      emitChange(onChange, false, d, 10, 30);
      expect(onChange).toHaveBeenCalledWith("2026-03-15T10:30");
    });

    it("calls onChange with HH:mm when timeOnly is true", () => {
      const onChange = vi.fn();
      const d = new Date(2026, 2, 15, 9, 5);
      emitChange(onChange, true, d, 9, 5);
      expect(onChange).toHaveBeenCalledWith("09:05");
    });
  });
});
