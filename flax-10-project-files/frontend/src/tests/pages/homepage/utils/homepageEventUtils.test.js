import { describe, expect, it } from "vitest";

import {
  extractModuleCode,
  isLecture,
  isNow,
  isRoutineEvent,
  stripEmojiFromTitle,
} from "../../../../pages/homepage/utils/eventUtils";

describe("homepageEventUtils", () => {
  it("strips emojis reliably from input strings", () => {
    expect(stripEmojiFromTitle(undefined)).toBe("");
    expect(stripEmojiFromTitle(42)).toBe(42);
    expect(stripEmojiFromTitle("📚  Lunch  ✨")).toBe("Lunch");
  });

  it("detects academic lectures via title or source", () => {
    expect(isLecture({ title: "Algorithms lecture" })).toBe(true);
    expect(isLecture({ title: "Study block", source: "timetable" })).toBe(true);
    expect(isLecture({ source: "timetable" })).toBe(true);
    expect(isLecture({ title: "Groceries" })).toBe(false);
  });

  it("identifies events serving as routines by tag or title", () => {
    expect(isRoutineEvent({ tag_name: "routine" })).toBe(true);
    expect(isRoutineEvent({ tag: { name: "wellness" } })).toBe(true);
    expect(isRoutineEvent({ title: "Lunch with friends" })).toBe(true);
    expect(isRoutineEvent({ title: "Deep work" })).toBe(false);
  });

  it("checks if the currently playing event bounds the system clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T08:00Z"));
    expect(isNow()).toBe(false);
    expect(isNow("2026-03-24T07:30Z", "2026-03-24T08:30Z")).toBe(true);
    expect(isNow("2026-03-24T09:00Z", "2026-03-24T10:00Z")).toBe(false);
    vi.useRealTimers();
  });

  it("extracts module codes from standard descriptive titles", () => {
    expect(extractModuleCode("Meet CS1234 team")).toBe("CS1234");
    expect(extractModuleCode("No code here")).toBeNull();
    expect(extractModuleCode()).toBeNull();
  });
});
