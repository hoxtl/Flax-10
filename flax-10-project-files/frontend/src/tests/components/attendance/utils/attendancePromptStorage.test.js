import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLastPromptShownAt,
  getPromptedIds,
  getSessionDismissedIds,
  getSkippedIds,
  setLastPromptShownAt,
  setPromptedId,
  setSessionDismissedId,
} from "../../../../components/attendance/utils/attendancePromptStorage";

const ANSWERED_KEY = "flax_attendance_prompted_ids";
const DISMISSED_KEY = "flax_attendance_session_dismissed";
const LAST_SHOWN_AT_KEY = "flax_attendance_prompt_last_shown_at";

describe("attendancePromptStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("reads and writes prompted and session-dismissed ids", () => {
    setPromptedId(1);
    setPromptedId(2);
    setSessionDismissedId(3);

    expect([...getPromptedIds()]).toEqual([1, 2]);
    expect([...getSessionDismissedIds()]).toEqual([3]);
    expect([...getSkippedIds()].sort((left, right) => left - right)).toEqual([1, 2, 3]);
  });

  it("falls back to empty sets when stored values are absent or malformed", () => {
    expect(getPromptedIds()).toEqual(new Set());
    expect(getSessionDismissedIds()).toEqual(new Set());

    localStorage.setItem(ANSWERED_KEY, "not-json");
    sessionStorage.setItem(DISMISSED_KEY, "{");

    expect(getPromptedIds()).toEqual(new Set());
    expect(getSessionDismissedIds()).toEqual(new Set());
  });

  it("returns zero for invalid timestamps and reads valid positive timestamps", () => {
    expect(getLastPromptShownAt()).toBe(0);

    sessionStorage.setItem(LAST_SHOWN_AT_KEY, "-10");
    expect(getLastPromptShownAt()).toBe(0);

    sessionStorage.setItem(LAST_SHOWN_AT_KEY, "invalid");
    expect(getLastPromptShownAt()).toBe(0);

    sessionStorage.setItem(LAST_SHOWN_AT_KEY, "1200");
    expect(getLastPromptShownAt()).toBe(1200);
  });

  it("uses the provided timestamp or Date.now when storing last shown values", () => {
    setLastPromptShownAt(222);
    expect(sessionStorage.getItem(LAST_SHOWN_AT_KEY)).toBe("222");

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(987654);
    setLastPromptShownAt();
    expect(sessionStorage.getItem(LAST_SHOWN_AT_KEY)).toBe("987654");
    nowSpy.mockRestore();
  });

  it("silently ignores storage write failures", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => setPromptedId(9)).not.toThrow();
    expect(() => setSessionDismissedId(10)).not.toThrow();
    expect(() => setLastPromptShownAt(111)).not.toThrow();

    setItemSpy.mockRestore();
  });
});
