import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePopoverDismissMock = vi.fn();
const useSleepWindowMock = vi.fn();

vi.mock("../../../../pages/Homepage/hooks/miniTimeline/usePopoverDismiss", () => ({
  usePopoverDismiss: (...args) => usePopoverDismissMock(...args),
}));

vi.mock("../../../../pages/Homepage/hooks/miniTimeline/useSleepWindow", () => ({
  useSleepWindow: () => useSleepWindowMock(),
}));

import { useMiniTimelineState } from "../../../../pages/Homepage/hooks/useMiniTimelineState";

describe("useMiniTimelineState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSleepWindowMock.mockReturnValue({ sleepTime: "23:00", wakeTime: "07:00" });
  });

  it("returns both popover controllers and the sleep window", () => {
    const { result } = renderHook(() => useMiniTimelineState());

    expect(result.current.conflictPopoverRowId).toBeNull();
    expect(result.current.slotPopoverRowId).toBeNull();
    expect(result.current.sleepWindow).toEqual({ sleepTime: "23:00", wakeTime: "07:00" });
    expect(usePopoverDismissMock).toHaveBeenCalledTimes(2);
  });

  it("updates popover rows, context menu state, and the now-row ref", () => {
    const { result } = renderHook(() => useMiniTimelineState());
    const nowRow = { id: "now-row" };

    act(() => {
      result.current.setConflictPopoverRowId("conflict-1");
      result.current.setSlotPopoverRowId("slot-1");
      result.current.setEventCtxMenu({ id: "menu" });
      result.current.attachNowRow(nowRow);
    });

    expect(result.current.conflictPopoverRowId).toBe("conflict-1");
    expect(result.current.slotPopoverRowId).toBe("slot-1");
    expect(result.current.eventCtxMenu).toEqual({ id: "menu" });
    expect(result.current.attachNowRow).toEqual(expect.any(Function));
  });

  it("dismisses both popovers independently", () => {
    const { result } = renderHook(() => useMiniTimelineState());

    act(() => {
      result.current.setConflictPopoverRowId("row-a");
      result.current.setSlotPopoverRowId("row-b");
    });

    expect(result.current.conflictPopoverRowId).toBe("row-a");
    expect(result.current.slotPopoverRowId).toBe("row-b");
  });

  it("exposes dismiss callbacks to the popover hooks and clears each row when invoked", () => {
    const { result } = renderHook(() => useMiniTimelineState());

    act(() => {
      result.current.setConflictPopoverRowId("row-a");
      result.current.setSlotPopoverRowId("row-b");
    });

    const [, , closeConflict] = usePopoverDismissMock.mock.calls[0];
    const [, , closeSlot] = usePopoverDismissMock.mock.calls[1];

    act(() => {
      closeConflict();
      closeSlot();
    });

    expect(result.current.conflictPopoverRowId).toBeNull();
    expect(result.current.slotPopoverRowId).toBeNull();
  });
});
