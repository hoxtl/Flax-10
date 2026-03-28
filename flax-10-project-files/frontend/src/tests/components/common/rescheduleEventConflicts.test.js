import { describe, expect, it, vi } from "vitest";
import {
  applyConflictResolutionPlan,
  buildConflictResolutionPlan,
  buildConflictResolutionToastMessage,
  undoConflictResolutionPlan,
} from "../../../components/common/reschedule_events/rescheduleEventConflicts";

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
    expect(buildConflictResolutionToastMessage({ operations: [], unresolved: [] })).toBe("No overlap events.");
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

  it("summarises exactly two tomorrow moves without the extra-count suffix", () => {
    const plan = {
      operations: [
        { event: { title: "A" }, movedToTomorrow: true },
        { event: { title: "B" }, movedToTomorrow: true },
      ],
      unresolved: [],
    };

    expect(buildConflictResolutionToastMessage(plan)).toBe('Cleared 2 conflicts · 2 moved to tomorrow ("A", "B").');
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

  it("returns empty plan for missing arguments", () => {
    expect(buildConflictResolutionPlan()).toEqual({ operations: [], unresolved: [] });
  });

  it("treats null event input as an empty day", () => {
    expect(buildConflictResolutionPlan(null, new Date("2026-03-23T00:00:00Z"))).toEqual({
      operations: [],
      unresolved: [],
    });
  });

  it("uses the teacher-specific fixed-overlap toast copy", () => {
    expect(buildConflictResolutionToastMessage({ operations: [], unresolved: [{ reason: "fixed" }] }, true)).toBe(
      "These overlaps are fixed lectures or deadline items, so they stay in place.",
    );
  });

  it("keeps plural no-slot copy grammatically correct", () => {
    expect(buildConflictResolutionToastMessage({
      operations: [{ event: { title: "Essay" }, movedToTomorrow: false }],
      unresolved: [{ reason: "no-slot" }, { reason: "no-slot" }],
    })).toBe("Cleared 1 conflict · 2 still need manual review.");
  });

  it("treats missing ids as non-movable while still resolving valid personal events", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { source: "personal", title: "No id", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-1", source: "personal", title: "Task", start_time: iso("2026-03-23T09:15:00Z"), end_time: iso("2026-03-23T10:15:00Z") },
    ], selectedDate);

    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0].event.id).toBe("task-1");
  });

  it("uses the default 25-minute duration and original start as the fallback end time", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T10:00:00Z") },
      { id: "task-1", source: "personal", title: "Task", start_time: iso("2026-03-23T09:15:00Z") },
    ], selectedDate);

    expect(plan.operations[0]).toMatchObject({
      event: expect.objectContaining({ id: "task-1" }),
      originalEnd: iso("2026-03-23T09:15:00Z"),
    });
    expect(plan.operations[0].start.toISOString()).toBe(iso("2026-03-23T10:00:00Z"));
    expect(plan.operations[0].end.toISOString()).toBe(iso("2026-03-23T10:25:00Z"));
  });

  it("falls back to the anchor start time when the remaining fixed event has no end", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { id: "task-1", source: "personal", title: "Task", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "lecture-1", source: "timetable", title: "Lecture", start_time: iso("2026-03-23T09:15:00Z") },
    ], selectedDate);

    expect(plan.operations[0].start.toISOString()).toBe(iso("2026-03-23T09:15:00Z"));
    expect(plan.operations[0].end.toISOString()).toBe(iso("2026-03-23T09:45:00Z"));
  });

  it("prefers shorter movable candidates when starts match", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "task-long", source: "personal", title: "Long", start_time: iso("2026-03-23T09:10:00Z"), end_time: iso("2026-03-23T10:10:00Z") },
      { id: "task-short", source: "personal", title: "Short", start_time: iso("2026-03-23T09:10:00Z"), end_time: iso("2026-03-23T09:35:00Z") },
    ], selectedDate);

    expect(plan.operations[0].event.id).toBe("task-short");
  });

  it("breaks equal-duration ties by later end time and then by title", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const byEndTime = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "task-early", source: "personal", title: "Early", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
      { id: "task-late", source: "personal", title: "Late", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:20:00Z") },
    ], selectedDate);
    expect(byEndTime.operations[0].event.id).toBe("task-late");

    const byTitle = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "task-zulu", source: "personal", title: "Zulu", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
      { id: "task-mango", source: "personal", title: "Mango", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
      { id: "task-alpha", source: "personal", title: "Alpha", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
    ], selectedDate);
    expect(byTitle.operations[0].event.id).toBe("task-alpha");
  });

  it("falls back to blank titles when title tie-breaks compare otherwise identical candidates", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "task-untitled", source: "personal", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
      { id: "task-alpha", source: "personal", title: "Alpha", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
    ], selectedDate);

    expect(plan.operations[0].event.id).toBe("task-untitled");
  });

  it("compares blank fallback titles consistently regardless of candidate order", () => {
    const selectedDate = new Date("2026-03-23T00:00:00Z");
    const plan = buildConflictResolutionPlan([
      { id: "lecture-1", source: "timetable", start_time: iso("2026-03-23T09:00:00Z"), end_time: iso("2026-03-23T09:30:00Z") },
      { id: "task-alpha", source: "personal", title: "Alpha", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
      { id: "task-untitled", source: "personal", start_time: iso("2026-03-23T09:05:00Z"), end_time: iso("2026-03-23T09:10:00Z") },
    ], selectedDate);

    expect(plan.operations[0].event.id).toBe("task-untitled");
  });

  it("builds toast for simple or complex plans", () => {
    const solo = { operations: [{ event: { title: "Solo" }, movedToTomorrow: false }], unresolved: [] };
    expect(buildConflictResolutionToastMessage(solo)).toBe("Cleared 1 conflict.");
    const pluralSolo = {
      operations: [
        { event: { title: "A" }, movedToTomorrow: false },
        { event: { title: "B" }, movedToTomorrow: false },
      ],
      unresolved: [],
    };
    expect(buildConflictResolutionToastMessage(pluralSolo)).toBe("Cleared 2 conflicts.");
    const complex = {
      operations: [{ event: { title: "A" }, movedToTomorrow: true }, { event: { title: "B" }, movedToTomorrow: true }],
      unresolved: [{ reason: "fixed" }, { reason: "fixed" }, { reason: "no-slot" }],
    };
    expect(buildConflictResolutionToastMessage(complex)).toContain("2 moved to tomorrow");
    expect(buildConflictResolutionToastMessage(complex)).toContain("2 fixed overlaps left in place");
  });

  it("reports operation failures", async () => {
    const editEvent = vi.fn().mockRejectedValue(new Error("fail"));
    const plan = {
      operations: [{
        event: { id: "task-1", title: "Task 1" }, start: new Date(), end: new Date(),
        originalStart: iso("2026-03-23T09:00:00Z"), originalEnd: iso("2026-03-23T10:00:00Z"),
      }], unresolved: [],
    };
    const result = await applyConflictResolutionPlan(plan, editEvent);
    expect(result.failures).toHaveLength(1);
  });

  it("ignores non-overlapping personal events", () => {
    const plan = buildConflictResolutionPlan([
      { id: "keep", source: "personal", title: "Keep", start_time: iso("2026-03-23T12:00:00Z") },
      { source: "personal", title: "Ignore me" },
    ], new Date("2026-03-23T00:00:00Z"));
    expect(plan.operations).toEqual([]);
    expect(plan.unresolved).toEqual([]);
  });
});
