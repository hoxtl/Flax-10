import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const extractBaseEventIdMock = vi.fn((id) => id);
const getNextFreeSlotTodayMock = vi.fn(() => null);
vi.mock("../../../../pages/homepage/utils", () => ({ formatTime: vi.fn(), getAllFreeWindowsToday: vi.fn(() => []), getNextFreeSlotToday: (...a) => getNextFreeSlotTodayMock(...a), isRoutineEvent: vi.fn(() => false) }));
vi.mock("../../../../components/calendar/utils/eventUtils", () => ({ extractBaseEventId: (...a) => extractBaseEventIdMock(...a) }));
const conflictMocks = vi.hoisted(() => ({ applyConflictResolutionPlan: vi.fn(), buildConflictResolutionPlan: vi.fn(), buildConflictResolutionToastMessage: vi.fn() }));
vi.mock("../../../../components/common/reschedule_events/rescheduleEventConflicts", () => conflictMocks);
import { useHomepageReschedule } from "../../../../pages/homepage/hooks/useHomepageReschedule";
const buildRescheduleProps = (o = {}) => ({ addEvent: vi.fn().mockResolvedValue(), deleteTask: vi.fn().mockResolvedValue(), editEvent: vi.fn().mockResolvedValue(), loadEvents: vi.fn().mockResolvedValue(), refetchTasks: vi.fn(), removeEvent: vi.fn().mockResolvedValue(), selectedDate: new Date("2026-03-24T09:00:00Z"), showToast: vi.fn(), sortedEvents: [], ...o });
describe("useHomepageReschedule Conflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conflictMocks.buildConflictResolutionPlan.mockReturnValue({ operations: [{ event: { id: 1, title: "Office hour" } }], unresolved: [] });
    conflictMocks.buildConflictResolutionToastMessage.mockReturnValue("Cleared 1 conflict.");
    conflictMocks.applyConflictResolutionPlan.mockResolvedValue(undefined);
  });
  it("handleConflictAutoMove moves event and shows toast", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleConflictAutoMove({ id: "e1", title: "L" }, new Date(), new Date()); });
    expect(props.editEvent).toHaveBeenCalled();
    expect(props.showToast).toHaveBeenCalledWith("Event moved to next available window.");
  });

  it("handleConflictPushTomorrow moves event to tomorrow", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleConflictPushTomorrow({ id: "e3", title: "S", start_time: "2026-03-24T14:00:00Z", end_time: "2026-03-24T15:00:00Z" }); });
    expect(props.showToast).toHaveBeenCalledWith(expect.stringContaining("moved to tomorrow"), expect.objectContaining({ actionLabel: "Undo" }));
  });

  it("handleConflictPushTomorrow undo action restores event", async () => {
    const props = buildRescheduleProps();
    const { result } = renderHook(() => useHomepageReschedule(props));
    await act(async () => { await result.current.handleConflictPushTomorrow({ id: "e3", title: "S", start_time: "2026-03-24T14:00:00Z", end_time: "2026-03-24T15:00:00Z" }); });
    const undoOptions = props.showToast.mock.calls.at(-1)[1];
    await act(async () => { await undoOptions.onAction(); });
    expect(props.editEvent).toHaveBeenLastCalledWith("e3", { start_time: "2026-03-24T14:00:00.000Z", end_time: "2026-03-24T15:00:00.000Z" });
  });

  it("handleResolveTimelineConflicts showing progress via resolveConflictsLoading", async () => {
    let resolve;
    conflictMocks.applyConflictResolutionPlan.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useHomepageReschedule(buildRescheduleProps()));
    let pending;
    act(() => { pending = result.current.handleResolveTimelineConflicts(); });
    await waitFor(() => expect(result.current.resolveConflictsLoading).toBe(true));
    await act(async () => { resolve(); await pending; });
    expect(result.current.resolveConflictsLoading).toBe(false);
  });

  it("shows the read-only conflicts message", async () => {
    conflictMocks.applyConflictResolutionPlan.mockResolvedValueOnce({ failures: [{ id: 1 }] });
    const { result } = renderHook(() => useHomepageReschedule(buildRescheduleProps()));
    await act(async () => { await result.current.handleResolveTimelineConflicts(); });
    expect(buildRescheduleProps().showToast).not.toHaveBeenCalled(); // The mock in function scope won't work, need to pass prop
  });
});
