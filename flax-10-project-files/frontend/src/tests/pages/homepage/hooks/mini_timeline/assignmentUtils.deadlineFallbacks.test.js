/*
 * Tests for deriveGapDeadlineFallbacks – assigning deadline suggestions to empty gap rows.
 */

import { describe, it, expect, vi } from "vitest";
import { deriveGapDeadlineFallbacks } from "../../../../../pages/homepage/hooks/mini_timeline/assignmentUtils";

vi.mock("../../../../../pages/homepage/utils/taskUtils", () => ({
  taskDurationMins: vi.fn(),
  getTasksThatFitGap: vi.fn(),
}));

const FREE_ROW_A = { id: "row-a", type: "free", minutes: 60, gapStartMins: 480 };
const FREE_ROW_B = { id: "row-b", type: "free", minutes: 30, gapStartMins: 600 };
const BUSY_ROW = { id: "row-busy", type: "busy", minutes: 60 };
const TASK_LOW = { id: "t1", title: "Low task", priority: "low", estimated_blocks: 2, completed: false };

const SUGGESTION_A = { assessment_title: "Essay 1" };
const SUGGESTION_B = { assessment_title: "Lab Report" };

describe("deriveGapDeadlineFallbacks", () => {
  it("returns empty map when rows is empty", () => {
    expect(deriveGapDeadlineFallbacks([], { map: {} }, [SUGGESTION_A], new Set())).toEqual({});
  });

  it("returns empty map when deadlineSuggestions is empty", () => {
    expect(deriveGapDeadlineFallbacks([FREE_ROW_A], { map: {} }, [], new Set())).toEqual({});
  });

  it("skips rows that already have an assigned gap task", () => {
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A], { map: { "row-a": TASK_LOW } }, [SUGGESTION_A], new Set());
    expect(result["row-a"]).toBeUndefined();
  });

  it("assigns a suggestion to a free row that has no assigned task", () => {
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A], { map: {} }, [SUGGESTION_A], new Set());
    expect(result["row-a"]).toEqual(SUGGESTION_A);
  });

  it("distributes multiple suggestions across multiple unassigned rows in order", () => {
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A, FREE_ROW_B], { map: {} }, [SUGGESTION_A, SUGGESTION_B], new Set());
    expect(result["row-a"]).toEqual(SUGGESTION_A);
    expect(result["row-b"]).toEqual(SUGGESTION_B);
  });

  it("filters out suggestions whose title is already slotted via Revision prefix", () => {
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A], { map: {} }, [SUGGESTION_A], new Set(["Revision: Essay 1"]));
    expect(result["row-a"]).toBeUndefined();
  });

  it("falls back to item.title when assessment_title is absent", () => {
    const suggestion = { title: "Mock Exam" };
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A], { map: {} }, [suggestion], new Set(["Revision: Mock Exam"]));
    expect(result["row-a"]).toBeUndefined();
  });

  it("ignores non-free rows even if suggestions are available", () => {
    const result = deriveGapDeadlineFallbacks([BUSY_ROW, FREE_ROW_A], { map: {} }, [SUGGESTION_A], new Set());
    expect(result["row-busy"]).toBeUndefined();
    expect(result["row-a"]).toEqual(SUGGESTION_A);
  });

  it("stops assigning once suggestions run out", () => {
    const result = deriveGapDeadlineFallbacks([FREE_ROW_A, FREE_ROW_B], { map: {} }, [SUGGESTION_A], new Set());
    expect(result["row-a"]).toEqual(SUGGESTION_A);
    expect(result["row-b"]).toBeUndefined();
  });

  it("returns an empty map when deadline suggestions are null", () => {
    const result = deriveGapDeadlineFallbacks(
      [{ id: "row-start-only", type: "free", startMins: 510 }],
      { map: {} },
      null,
      new Set(),
    );
    expect(result).toEqual({});
  });

  it("skips suggestions whose revision title is missing entirely", () => {
    const result = deriveGapDeadlineFallbacks(
      [{ id: "row-no-times", type: "free" }],
      { map: {} },
      [{}],
      new Set(["Revision: undefined"]),
    );
    expect(result["row-no-times"]).toBeUndefined();
  });
});
