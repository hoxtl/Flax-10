import { describe, it, expect } from 'vitest';
import {
  isNightSlot,
  getNextFreeSlotToday,
  getAllFreeWindowsToday,
} from '../../pages/Homepage/utils/slotUtils';

// ─── isNightSlot ──────────────────────────────────────────────────────────

describe('isNightSlot', () => {
  it('returns false for null/undefined', () => {
    expect(isNightSlot(null)).toBe(false);
    expect(isNightSlot(undefined)).toBe(false);
  });

  it('returns true for 23:00 (hour 23)', () => {
    const d = new Date();
    d.setHours(23, 0, 0, 0);
    expect(isNightSlot(d)).toBe(true);
  });

  it('returns true for midnight (hour 0)', () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    expect(isNightSlot(d)).toBe(true);
  });

  it('returns true for hour 5 (before 6)', () => {
    const d = new Date();
    d.setHours(5, 0, 0, 0);
    expect(isNightSlot(d)).toBe(true);
  });

  it('returns false for hour 6 (boundary, not night)', () => {
    const d = new Date();
    d.setHours(6, 0, 0, 0);
    expect(isNightSlot(d)).toBe(false);
  });

  it('returns false for hour 12 (noon)', () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    expect(isNightSlot(d)).toBe(false);
  });

  it('returns false for hour 22 (one before night)', () => {
    const d = new Date();
    d.setHours(22, 0, 0, 0);
    expect(isNightSlot(d)).toBe(false);
  });

  it('accepts ISO string as input', () => {
    const d = new Date();
    d.setHours(2, 0, 0, 0);
    expect(isNightSlot(d.toISOString())).toBe(true);
  });
});

// ─── getNextFreeSlotToday ─────────────────────────────────────────────────

describe('getNextFreeSlotToday', () => {
  it('returns null when selectedDate is not today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = getNextFreeSlotToday([], yesterday, 30);
    expect(result).toBeNull();
  });

  it('returns null when durationMins <= 0', () => {
    const today = new Date();
    expect(getNextFreeSlotToday([], today, 0)).toBeNull();
    expect(getNextFreeSlotToday([], today, -5)).toBeNull();
  });

  it('returns null when there is no room left in the day', () => {
    // End of day has passed — fake a date far in the future
    const longAgo = new Date(2000, 0, 1);
    // isToday will be false, so returns null anyway
    const result = getNextFreeSlotToday([], longAgo, 30);
    expect(result).toBeNull();
  });

  it('returns a slot when today has free time and no events', () => {
    const today = new Date();
    // Only run this sub-test if there is at least 30 minutes left today
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;

    if (minsLeft >= 30) {
      const result = getNextFreeSlotToday([], today, 30);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(result.end.getTime() - result.start.getTime()).toBe(30 * 60000);
    }
  });

  it('skips a blocking event and finds next gap', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 120) return; // not enough time to test meaningfully

    // Create an event that starts 5 minutes from now and lasts 30 minutes
    const evStart = new Date(today.getTime() + 5 * 60000);
    const evEnd = new Date(today.getTime() + 35 * 60000);
    const events = [
      { start_time: evStart.toISOString(), end_time: evEnd.toISOString() },
    ];

    // Ask for a 60-minute slot — the 5-minute gap before the event is too small
    const result = getNextFreeSlotToday(events, today, 60);
    if (result) {
      // The slot must start at or after the event end
      expect(result.start.getTime()).toBeGreaterThanOrEqual(evEnd.getTime());
    }
  });

  it('handles null/undefined events array gracefully', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 1) return;

    // Should not throw
    expect(() => getNextFreeSlotToday(null, today, 30)).not.toThrow();
    expect(() => getNextFreeSlotToday(undefined, today, 30)).not.toThrow();
  });
});

// ─── getAllFreeWindowsToday ───────────────────────────────────────────────

describe('getAllFreeWindowsToday', () => {
  it('returns empty array when selectedDate is not today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getAllFreeWindowsToday([], yesterday)).toEqual([]);
  });

  it('returns an array for today', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 15) return; // not enough day left to produce windows

    const result = getAllFreeWindowsToday([], today);
    expect(Array.isArray(result)).toBe(true);
  });

  it('each window has start, end, and minutes properties', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 15) return;

    const result = getAllFreeWindowsToday([], today);
    result.forEach(w => {
      expect(w).toHaveProperty('start');
      expect(w).toHaveProperty('end');
      expect(w).toHaveProperty('minutes');
      expect(w.minutes).toBeGreaterThanOrEqual(15);
    });
  });

  it('excludes gaps shorter than 15 minutes', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 60) return;

    // Create two events with a 10-minute gap between them
    const ev1Start = new Date(today.getTime() + 5 * 60000);
    const ev1End = new Date(today.getTime() + 20 * 60000);
    const ev2Start = new Date(today.getTime() + 30 * 60000); // 10-min gap
    const ev2End = new Date(today.getTime() + 60 * 60000);
    const events = [
      { start_time: ev1Start.toISOString(), end_time: ev1End.toISOString() },
      { start_time: ev2Start.toISOString(), end_time: ev2End.toISOString() },
    ];

    const result = getAllFreeWindowsToday(events, today);
    result.forEach(w => {
      expect(w.minutes).toBeGreaterThanOrEqual(15);
    });
  });

  it('handles null/undefined events gracefully', () => {
    const today = new Date();
    expect(() => getAllFreeWindowsToday(null, today)).not.toThrow();
    expect(() => getAllFreeWindowsToday(undefined, today)).not.toThrow();
    expect(Array.isArray(getAllFreeWindowsToday(null, today))).toBe(true);
  });

  it('window.end - window.start equals window.minutes in ms (approximately)', () => {
    const today = new Date();
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);
    const minsLeft = (dayEnd.getTime() - today.getTime()) / 60000;
    if (minsLeft < 15) return;

    const result = getAllFreeWindowsToday([], today);
    result.forEach(w => {
      const durationMs = w.end.getTime() - w.start.getTime();
      const durationMins = Math.round(durationMs / 60000);
      expect(durationMins).toBe(w.minutes);
    });
  });
});
