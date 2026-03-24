import { describe, expect, it, vi } from "vitest";
import {
  applyConflictResolutionPlan,
  buildConflictResolutionPlan,
  buildConflictResolutionToastMessage,
  undoConflictResolutionPlan,
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

  it("returns default messages for no overlaps and for unresolved-only plans", () => {
    expect(buildConflictResolutionToastMessage({ operations: [], unresolved: [] })).toBe("No overlaps to clear.");
    expect(buildConflictResolutionToastMessage({ operations: [], unresolved: [{ reason: "fixed" }] })).toBe(
      "These overlaps are fixed lectures, societies, or deadline items, so they stay in place.",
    );
    expect(buildConflictResolutionToastMessage({ operations: [], unresolved: [{ reason: "no-slot" }] })).toBe(
      "Couldn't find a conflict-free slot for some events.",
    );
  });

  it("summarises multiple tomorrow moves with extra titles", () => {
    const plan = {
      operations: [
        { event: { title: "A" }, movedToTomorrow: true },
        { event: { title: "B" }, movedToTomorrow: true },
        { event: { title: "C" }, movedToTomorrow: true },
      ],
      unresolved: [],
    };

    expect(buildConflictResolutionToastMessage(plan)).toBe('Cleared 3 conflicts · 3 moved to tomorrow ("A", "B" +1 more).');
  });

  it("marks fully fixed conflicts as unresolved", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const events = [
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "lecture-2", source: "timetable", start_time: iso("2026-03-23T09:30:00Z"), end_time: iso("2026-03-23T10:30:00Z") },
    ];

    expect(buildConflictResolutionPlan(events, selectedDate)).toEqual({
      operations: [],
      unresolved: [{ group: expect.any(Array), reason: "fixed" }],
    });
  });

  it("reports movable overlaps that still have no free slot", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const events = [
      { id: "task-1", source: "personal", title: "Task 1", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-2", source: "personal", title: "Task 2", start_time: iso("2026-03-23T09:30:00Z"), end_time: iso("2026-03-23T10:30:00Z") },
      { id: "busy-1", source: "personal", title: "Busy 1", start_time: iso("2026-03-23T10:30:00Z"), end_time: iso("2026-03-23T23:59:59Z") },
      { id: "busy-2", source: "personal", title: "Busy 2", start_time: iso("2026-03-24T09:00:00Z"), end_time: iso("2026-03-24T23:59:59Z") },
    ];

    const plan = buildConflictResolutionPlan(events, selectedDate);

    expect(plan.operations).toEqual([]);
    expect(plan.unresolved[0]).toMatchObject({ movable: expect.objectContaining({ id: "task-2" }), reason: "no-slot" });
  });

  it("applies and undoes a conflict resolution plan", async () => {
    const editEvent = vi.fn().mockResolvedValue(undefined);
    const plan = {
      operations: [{
        event: { id: "123_2026-03-23", _baseId: 123 },
        start: new Date("2026-03-23T12:00:00Z"),
        end: new Date("2026-03-23T13:00:00Z"),
        originalStart: iso("2026-03-23T09:00:00Z"),
        originalEnd: iso("2026-03-23T10:00:00Z"),
      }],
      unresolved: [],
    };

    await applyConflictResolutionPlan(plan, editEvent);
    await undoConflictResolutionPlan(plan, editEvent);

    expect(editEvent).toHaveBeenNthCalledWith(1, 123, {
      start_time: "2026-03-23T12:00:00.000Z",
      end_time: "2026-03-23T13:00:00.000Z",
    });
    expect(editEvent).toHaveBeenNthCalledWith(2, 123, {
      start_time: iso("2026-03-23T09:00:00Z"),
      end_time: iso("2026-03-23T10:00:00Z"),
    });
  });
});
