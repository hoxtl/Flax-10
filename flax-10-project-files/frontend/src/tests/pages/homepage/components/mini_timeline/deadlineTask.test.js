import { describe, it, expect } from "vitest";
import { buildDeadlineTask } from "@/pages/homepage/components/mini_timeline/helpers/deadlineTask";

describe("buildDeadlineTask", () => {
  it("returns null when no suggestion", () => {
    expect(buildDeadlineTask({ minutes: 50 }, null)).toBeNull();
  });

  it("uses assessment_title when available", () => {
    const row = { minutes: 50 };
    const suggestion = { assessment_title: "Coursework 1", start_due_date: "2026-04-01" };
    const result = buildDeadlineTask(row, suggestion);
    expect(result.title).toBe("Revision: Coursework 1");
    expect(result.estimated_blocks).toBe(2); // Math.round(50/25)
    expect(result.due_date).toBe("2026-04-01");
    expect(result.priority).toBe("urgent");
  });

  it("falls back to suggestion.title when no assessment_title", () => {
    const result = buildDeadlineTask({ minutes: 25 }, { title: "Essay", start_due_date: null });
    expect(result.title).toBe("Revision: Essay");
    expect(result.estimated_blocks).toBe(1);
  });

  it("uses at least 1 block for very short gaps", () => {
    const result = buildDeadlineTask({ minutes: 5 }, { title: "X", start_due_date: null });
    expect(result.estimated_blocks).toBe(1);
  });
});
