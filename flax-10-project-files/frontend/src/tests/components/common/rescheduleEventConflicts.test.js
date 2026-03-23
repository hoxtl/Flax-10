import { describe, expect, it } from "vitest";
import {
  buildConflictResolutionPlan,
  buildConflictResolutionToastMessage,
} from "../../../components/Common/RescheduleEvents/rescheduleEventConflicts";

function iso(dateString) {
  return new Date(dateString).toISOString();
}

describe("rescheduleEventConflicts", () => {
  it("moves a personal overlap to the next free slot tomorrow without colliding with existing tomorrow events", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const events = [
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-1", source: "personal", start_time: iso("2026-03-23T09:15:00Z"), end_time: iso("2026-03-23T10:15:00Z") },
      { id: "module-1", source: "module_deadline", start_time: iso("2026-03-23T10:15:00Z"), end_time: iso("2026-03-23T23:59:00Z") },
      { id: "lecture-2", source: "timetable", start_time: iso("2026-03-24T09:00:00Z"), end_time: iso("2026-03-24T10:00:00Z") },
    ];

    const plan = buildConflictResolutionPlan(events, selectedDate);

    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].event.id).toBe("task-1");
    expect(plan.operations[0].movedToTomorrow).toBe(true);
    expect(plan.operations[0].start.toISOString()).toBe(iso("2026-03-24T10:00:00Z"));
    expect(plan.operations[0].end.toISOString()).toBe(iso("2026-03-24T11:00:00Z"));
  });

  it("reports fixed overlaps separately from movable events with no free slot", () => {
    const plan = {
      operations: [{ movedToTomorrow: false }],
      unresolved: [{ reason: "fixed" }, { reason: "no-slot" }],
    };

    expect(buildConflictResolutionToastMessage(plan)).toBe("Cleared 1 conflict · 1 fixed overlap left in place · 1 still needs manual review.");
  });

  it("resolves multiple independent overlap groups in one pass", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const events = [
      { id: "lecture-1", source: "timetable", title: "Lecture", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-1", source: "personal", title: "Review notes", start_time: iso("2026-03-23T09:15:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-2", source: "personal", title: "Study at library", start_time: iso("2026-03-23T15:00:00Z"), end_time: iso("2026-03-23T17:00:00Z") },
      { id: "task-3", source: "personal", title: "Busy", start_time: iso("2026-03-23T16:30:00Z"), end_time: iso("2026-03-23T17:30:00Z") },
    ];

    const plan = buildConflictResolutionPlan(events, selectedDate);

    expect(plan.operations).toHaveLength(2);
    expect(plan.operations.map((operation) => operation.event.id).sort()).toEqual(["task-1", "task-3"]);
    expect(plan.unresolved).toHaveLength(0);
  });

  it("mentions titles when events are moved to tomorrow", () => {
    const plan = {
      operations: [
        { event: { title: "Study at library" }, movedToTomorrow: true },
      ],
      unresolved: [],
    };

    expect(buildConflictResolutionToastMessage(plan)).toBe('Cleared 1 conflict · "Study at library" moved to tomorrow.');
  });
});
