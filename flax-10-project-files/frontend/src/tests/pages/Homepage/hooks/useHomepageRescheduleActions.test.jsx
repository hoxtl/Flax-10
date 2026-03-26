import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const extractBaseEventIdMock = vi.fn((id) => id);
vi.mock("../../../../pages/homepage/utils/index", () => ({ formatTime: vi.fn(), getAllFreeWindowsToday: vi.fn(() => []), getNextFreeSlotToday: vi.fn(), isRoutineEvent: vi.fn(() => false) }));
vi.mock("../../../../components/calendar/utils/eventUtils", () => ({ extractBaseEventId: (...a) => extractBaseEventIdMock(...a) }));
vi.mock("../../../../components/common/reschedule_events/rescheduleEventConflicts", () => ({ applyConflictResolutionPlan: vi.fn(), buildConflictResolutionPlan: vi.fn(), buildConflictResolutionToastMessage: vi.fn() }));
import { useHomepageReschedule } from "../../../../pages/homepage/hooks/useHomepageReschedule";
const buildRescheduleProps = (o = {}) => ({ addEvent: vi.fn().mockResolvedValue(), deleteTask: vi.fn().mockResolvedValue(), editEvent: vi.fn().mockResolvedValue(), loadEvents: vi.fn().mockResolvedValue(), refetchTasks: vi.fn(), removeEvent: vi.fn().mockResolvedValue(), selectedDate: new Date("2026-03-24T09:00:00Z"), showToast: vi.fn(), sortedEvents: [], ...o });
describe("useHomepageReschedule Actions", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("handleQuickStartGap adds an event for a task", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleQuickStartGap(new Date(), 50, { id: 7, title: "W", description: "D" }); });
    expect(props.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: "W" }));
    expect(props.showToast).toHaveBeenCalled();
  });
  it("handleQuickStartGap is a no-op when task is null", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleQuickStartGap(new Date(), 30, null); });
    expect(props.addEvent).not.toHaveBeenCalled();
  });
  it("handleTimelineDelete deletes a regular event", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleTimelineDelete({ id: "e6", title: "W" }); });
    expect(props.removeEvent).toHaveBeenCalledWith("e6");
    expect(props.showToast).toHaveBeenCalledWith('"W" deleted.');
  });
  it("handleTimelineDelete removes a task-sourced event", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleTimelineDelete({ id: "e7", title: "T", source: "task", external_id: 42 }); });
    expect(props.deleteTask).toHaveBeenCalledWith(42);
    expect(props.showToast).toHaveBeenCalledWith('"T" removed.');
  });
  it("handleTimelineDelete uses default label for raw id", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleTimelineDelete("e9"); });
    expect(props.removeEvent).toHaveBeenCalledWith("e9");
    expect(props.showToast).toHaveBeenCalledWith('"Event" deleted.');
  });
});
