import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const inertRef = {};
Object.defineProperty(inertRef, "current", {
  get: () => null,
  set: () => undefined,
});

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useRef: () => inertRef,
  };
});

vi.mock("../../../../context/CalendarContext", () => ({
  useCalendar: () => ({
    selectedDate: new Date("2026-03-15T00:00:00.000Z"),
    events: [],
    readOnly: false,
  }),
  useCalendarDispatch: () => vi.fn(),
}));

vi.mock("../../../../components/Calendar/hooks/useSwipeNavigation", () => ({
  useSwipeNavigation: vi.fn(),
}));

vi.mock("../../../../components/Calendar/MonthView/WeekdayHeader", () => ({
  WeekdayHeader: () => <div>weekday-header</div>,
}));

vi.mock("../../../../components/Calendar/MonthView/WeekRow", () => ({
  WeekRow: () => <div>week-row</div>,
}));

import { SwipeMonthView } from "../../../../components/Calendar/MonthView/SwipeMonthView";

describe("SwipeMonthView null ref branch", () => {
  it("skips the scroll reset when the ref never resolves to a DOM node", () => {
    expect(() => render(<SwipeMonthView />)).not.toThrow();
  });
});
