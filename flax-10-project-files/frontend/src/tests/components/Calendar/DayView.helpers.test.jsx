import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const mockUseTimeSlotDrop = vi.fn();
const mockUseResizeHighlight = vi.fn();
const mockIsSameDay = vi.fn();
const mockCalculateEventColumns = vi.fn();
const mockGetEventKey = vi.fn((event) => `${event.id}-${new Date(event.start_time).getTime()}-${new Date(event.end_time).getTime()}`);

vi.mock("../../../components/Calendar/hooks/useTimeSlotDrop", () => ({
  useTimeSlotDrop: (...args) => mockUseTimeSlotDrop(...args),
}));

vi.mock("../../../context/ResizeHighlightContext", () => ({
  useResizeHighlight: () => mockUseResizeHighlight(),
}));

vi.mock("../../../components/Calendar/utils/dateUtils", () => ({
  isSameDay: (...args) => mockIsSameDay(...args),
}));

vi.mock("../../../components/Calendar/utils/overlapUtils", () => ({
  calculateEventColumns: (...args) => mockCalculateEventColumns(...args),
  getEventKey: (...args) => mockGetEventKey(...args),
}));

import { TimeSlot } from "../../../components/Calendar/DayView/TimeSlot";
import {
  calculateEventStyle,
  calculateNewEndTime,
  formatHour,
  getHoursOfDay,
} from "../../../components/Calendar/DayView/dayViewHelpers";

describe("DayView helpers", () => {
  it("returns the full set of day hours and formats hour labels", () => {
    expect(getHoursOfDay()).toEqual(Array.from({ length: 24 }, (_, index) => index));
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(9)).toBe("9 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(15)).toBe("3 PM");
  });

  it("calculates clipped event styles and applies overlap layout columns", () => {
    const event = {
      id: "event-1",
      start_time: "2026-03-24T07:30:00.000Z",
      end_time: "2026-03-25T02:00:00.000Z",
    };
    const currentDate = new Date("2026-03-24T12:00:00.000Z");
    mockCalculateEventColumns.mockReturnValue(new Map([
      [mockGetEventKey(event), { totalColumns: 2, column: 1 }],
    ]));

    const style = calculateEventStyle(event, 60, [event, { id: "event-2" }], currentDate);

    expect(style.top).toBe("451px");
    expect(style.height).toBe("988px");
    expect(style.width).toBe("calc(50% - 6px)");
    expect(style.left).toBe("50%");
    expect(style.position).toBe("absolute");
  });

  it("returns the base style when overlap layout is absent or single-column", () => {
    const event = {
      id: "event-1",
      start_time: "2026-03-24T09:15:00.000Z",
      end_time: "2026-03-24T09:20:00.000Z",
    };

    mockCalculateEventColumns.mockReturnValue(new Map([
      [mockGetEventKey(event), { totalColumns: 1, column: 0 }],
    ]));

    const withSingleColumn = calculateEventStyle(event, 60, [event, { id: "event-2" }]);
    expect(withSingleColumn.width).toBe("100%");
    expect(withSingleColumn.left).toBe("0");
    expect(withSingleColumn.height).toBe("13px");

    const withoutLayout = calculateEventStyle(event, 60, [event]);
    expect(withoutLayout.width).toBe("100%");
    expect(withoutLayout.left).toBe("0");
  });

  it("keeps the original event range when a current date is provided but clipping is unnecessary", () => {
    const event = {
      id: "event-3",
      start_time: "2026-03-24T09:00:00.000Z",
      end_time: "2026-03-24T10:30:00.000Z",
    };

    mockCalculateEventColumns.mockReturnValue(new Map());

    const style = calculateEventStyle(event, 60, [event, { id: "other" }], new Date("2026-03-24T12:00:00.000Z"));
    expect(style.top).toBe("541px");
    expect(style.height).toBe("88px");
  });

  it("snaps resized end times and enforces a minimum duration", () => {
    const event = {
      start_time: "2026-03-24T10:00:00.000Z",
      end_time: "2026-03-24T11:00:00.000Z",
    };

    const longer = calculateNewEndTime(event, 45, 60, 15);
    expect(longer.toISOString()).toBe("2026-03-24T11:45:00.000Z");

    const minDuration = calculateNewEndTime(event, -120, 60, 15);
    expect(minDuration.toISOString()).toBe("2026-03-24T10:15:00.000Z");
  });

  it("renders read-only and interactive time slots with drag and resize highlights", () => {
    mockUseTimeSlotDrop.mockReturnValue({
      mergedProps: { "data-drop-props": "yes" },
      isOver: true,
      highlightQuarter: 2,
    });
    mockUseResizeHighlight.mockReturnValue({
      resizeHighlight: {
        hour: 9,
        date: new Date("2026-03-24T00:00:00.000Z"),
        quarter: 3,
      },
    });
    mockIsSameDay.mockReturnValue(true);

    const { container, rerender } = render(<TimeSlot hour={9} date={new Date("2026-03-24T00:00:00.000Z")} readOnly />);
    expect(container.firstChild.className).toBe("time-slot");

    rerender(<TimeSlot hour={9} date={new Date("2026-03-24T00:00:00.000Z")} readOnly={false} />);
    const slot = container.querySelector(".time-slot");
    expect(slot.className).toContain("drop-target");
    expect(slot.getAttribute("data-drop-props")).toBe("yes");
    expect(container.querySelector(".quarter-highlight").style.top).toBe("50%");
    expect(container.querySelector(".resize-line-highlight").style.top).toBe("50%");
  });

  it("does not render highlight indicators when the quarter is null or the resize target date mismatches", () => {
    mockUseTimeSlotDrop.mockReturnValue({
      mergedProps: {},
      isOver: false,
      highlightQuarter: null,
    });
    mockUseResizeHighlight.mockReturnValue({
      resizeHighlight: {
        hour: 9,
        date: new Date("2026-03-25T00:00:00.000Z"),
        quarter: null,
      },
    });
    mockIsSameDay.mockReturnValue(false);

    const { container } = render(<TimeSlot hour={9} date={new Date("2026-03-24T00:00:00.000Z")} readOnly={false} />);
    expect(container.querySelector(".quarter-highlight")).toBeNull();
    expect(container.querySelector(".resize-line-highlight")).toBeNull();
    expect(container.querySelector(".time-slot").className).toBe("time-slot");
  });
});
