import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useCalendarMock = vi.fn();
const useConfirmMock = vi.fn();
const useResizeHighlightMock = vi.fn();
const useEventActionsMock = vi.fn();
const useCalendarEventsMock = vi.fn();
const useDropMock = vi.fn();
const createResizeSessionMock = vi.fn();
const checkOverlapWithConfirmMock = vi.fn();
const unsyncCalendarMock = vi.fn();
const notifyMock = vi.fn();
const refreshTagsMock = vi.fn();
const eventUtils = vi.hoisted(() => ({
  extractBaseEventIdMock: vi.fn(),
  getEventTypeMock: vi.fn(),
  hasRecurrenceMock: vi.fn(),
  isReadOnlyEventMock: vi.fn(),
}));

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendar: () => useCalendarMock(),
}));

vi.mock("../../../../context/ConfirmContext", () => ({
  useConfirm: () => useConfirmMock(),
}));

vi.mock("../../../../context/ResizeHighlightContext", () => ({
  useResizeHighlight: () => useResizeHighlightMock(),
}));

vi.mock("../../../../context/TagContext", () => ({
  useTags: () => ({ refreshTags: refreshTagsMock }),
}));

vi.mock("../../../../components/notifications/hooks/useNotify", () => ({
  useNotify: () => notifyMock,
}));

vi.mock("../../../../components/calendar/hooks/useCalendarEvents", () => ({
  useEventActions: () => useEventActionsMock(),
  useCalendarEvents: () => useCalendarEventsMock(),
}));

vi.mock("../../../../components/calendar/hooks/useDragDrop", () => ({
  useDrop: (...args) => useDropMock(...args),
}));

vi.mock("../../../../components/calendar/utils/resizeUtils", () => ({
  createResizeSession: (...args) => createResizeSessionMock(...args),
}));

vi.mock("../../../../components/calendar/utils/overlapUtils", () => ({
  checkOverlapWithConfirm: (...args) => checkOverlapWithConfirmMock(...args),
}));

vi.mock("../../../../components/calendar/utils/eventUtils", () => ({
  extractBaseEventId: (...args) => eventUtils.extractBaseEventIdMock(...args),
  getEventType: (...args) => eventUtils.getEventTypeMock(...args),
  hasRecurrence: (...args) => eventUtils.hasRecurrenceMock(...args),
  isReadOnlyEvent: (...args) => eventUtils.isReadOnlyEventMock(...args),
}));

vi.mock("../../../../api/societyApi", () => ({
  unsyncCalendar: (...args) => unsyncCalendarMock(...args),
}));

import { useAutoScroll } from "../../../../components/calendar/hooks/useAutoScroll";
import { useEventResize } from "../../../../components/calendar/hooks/useEventResize";
import { useKeyboardNav } from "../../../../components/calendar/hooks/useKeyboardNav";
import { useMonthDayDrop } from "../../../../components/calendar/hooks/useMonthDayDrop";
import { useQuickActions } from "../../../../components/calendar/hooks/useQuickActions";
import { useSwipeNavigation } from "../../../../components/calendar/hooks/useSwipeNavigation";

describe("calendar hook coverage topups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCalendarMock.mockReturnValue({ events: [{ id: 1 }, { id: 77 }] });
    useConfirmMock.mockReturnValue(vi.fn().mockResolvedValue(true));
    useResizeHighlightMock.mockReturnValue({ setResizeHighlight: vi.fn() });
    useEventActionsMock.mockReturnValue({
      editEvent: vi.fn().mockResolvedValue(undefined),
      addEvent: vi.fn().mockResolvedValue(undefined),
      addException: vi.fn().mockResolvedValue(undefined),
    });
    useCalendarEventsMock.mockReturnValue({ loadEvents: vi.fn() });
    checkOverlapWithConfirmMock.mockResolvedValue(true);
    eventUtils.extractBaseEventIdMock.mockImplementation((id) => Number(String(id).split("-")[0]) || Number(id));
    eventUtils.getEventTypeMock.mockReturnValue("society");
    eventUtils.hasRecurrenceMock.mockReturnValue(false);
    eventUtils.isReadOnlyEventMock.mockReturnValue(false);
    unsyncCalendarMock.mockResolvedValue({});
    refreshTagsMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips the auto-scroll write when the container disappears before RAF runs", () => {
    let frame;
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      frame = callback;
      return 1;
    });

    const ref = { current: { scrollTop: 10 } };
    renderHook(() => useAutoScroll(ref, [], "dep"));

    ref.current = null;
    act(() => frame());

    expect(ref.current).toBeNull();
  });

  it("completes resize interactions even without a resizeJustEnded ref", async () => {
    let captured;
    const editEvent = vi.fn().mockResolvedValue(undefined);
    const eventRef = { current: { offsetHeight: 60 } };
    createResizeSessionMock.mockImplementation((clientY, initialHeight, handlers) => {
      captured = { clientY, initialHeight, ...handlers };
    });
    const event = { id: "77-occ", start_time: "2026-03-09T10:00:00.000Z", end_time: "2026-03-09T11:00:00.000Z" };

    const { result } = renderHook(() => useEventResize(event, eventRef, editEvent, null));

    await act(async () => {
      result.current.handleResizeStart({ clientY: 100, stopPropagation: vi.fn() });
      await captured.onEnd(30);
    });

    expect(editEvent).toHaveBeenCalledWith(77, expect.objectContaining({ end_time: expect.any(String) }));
  });

  it("ignores unsupported keyboard keys", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const { result } = renderHook(() => useKeyboardNav(3, vi.fn(), onSave, onCancel));

    act(() => {
      result.current.handleKeyDown({ key: "ArrowDown", preventDefault: vi.fn() }, 0, 0);
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(result.current.focusedCell).toBeNull();
  });

  it("ignores read-only events dropped on month cells", async () => {
    let dropHandler;
    eventUtils.isReadOnlyEventMock.mockReturnValue(true);
    useDropMock.mockImplementation(({ onDrop }) => {
      dropHandler = onDrop;
      return { dropProps: {}, isOver: false };
    });

    const { result } = renderHook(() => useMonthDayDrop(new Date("2026-03-10T00:00:00.000Z")));
    expect(result.current.dropProps).toEqual({});

    const droppedEvent = { id: 10, start_time: "2026-03-09T08:00:00.000Z", end_time: "2026-03-09T09:00:00.000Z" };
    await act(async () => { await dropHandler({ type: "EVENT", data: droppedEvent }); });

    const { editEvent, addEvent, addException } = useEventActionsMock.mock.results[0].value;
    expect(editEvent).not.toHaveBeenCalled();
    expect(addEvent).not.toHaveBeenCalled();
    expect(addException).not.toHaveBeenCalled();
  });

  it("stops propagation before running society quick actions", async () => {
    const stopPropagation = vi.fn();
    const loadEvents = vi.fn();
    useCalendarEventsMock.mockReturnValue({ loadEvents });

    const { result } = renderHook(() => useQuickActions({ society_id: 4, society_name: "Chess" }));

    await act(async () => {
      await result.current.onClick({ stopPropagation });
    });

    expect(stopPropagation).toHaveBeenCalled();
    expect(unsyncCalendarMock).toHaveBeenCalledWith(4);
    expect(loadEvents).toHaveBeenCalled();
  });

  it("ignores swipe wheel navigation after the container ref is cleared", () => {
    const listeners = {};
    const container = {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 400,
      addEventListener: vi.fn((type, handler) => {
        listeners[type] = handler;
      }),
      removeEventListener: vi.fn(),
    };
    const ref = { current: container };
    const onPrev = vi.fn();
    const onNext = vi.fn();

    renderHook(() => useSwipeNavigation({ containerRef: ref, onPrev, onNext }));

    ref.current = null;
    const preventDefault = vi.fn();
    listeners.wheel({ deltaY: -100, preventDefault });

    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("ignores disabled touch starts", () => {
    const listeners = {};
    const container = {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 400,
      addEventListener: vi.fn((type, handler) => {
        listeners[type] = handler;
      }),
      removeEventListener: vi.fn(),
    };
    const onPrev = vi.fn();
    const onNext = vi.fn();

    renderHook(() => useSwipeNavigation({ containerRef: { current: container }, onPrev, onNext, enabled: false }));

    listeners.touchstart({ touches: [{ clientY: 150 }] });
    listeners.touchend({ changedTouches: [{ clientY: 0 }] });

    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
