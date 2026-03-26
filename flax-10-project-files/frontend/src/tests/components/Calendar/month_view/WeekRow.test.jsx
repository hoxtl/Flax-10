import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const capturedDayCellProps = [];

vi.mock("../../../../components/Calendar/month_view/DayCell", () => ({
  DayCell: (props) => {
    capturedDayCellProps.push(props);
    return <div data-testid={`day-${props.day.toISOString()}`} />;
  },
}));

import { WeekRow } from "../../../../components/Calendar/month_view/WeekRow";

describe("WeekRow", () => {
  beforeEach(() => {
    capturedDayCellProps.length = 0;
  });

  it("sorts all-day events ahead of timed events regardless of input order", () => {
    const day = new Date("2026-03-24T00:00:00.000Z");
    const timed = { id: 1, title: "Timed", start_time: new Date("2026-03-24T10:00:00.000Z"), end_time: new Date("2026-03-24T11:00:00.000Z") };
    const allDay = { id: 2, title: "All day", all_day: true, start_time: new Date("2026-03-24T00:00:00.000Z"), end_time: new Date("2026-03-25T00:00:00.000Z") };

    const { rerender } = render(<WeekRow days={[day]} events={[timed, allDay]} cur={day} />);
    expect(capturedDayCellProps.at(-1)?.events.map((event) => event.title)).toEqual(["All day", "Timed"]);

    rerender(<WeekRow days={[day]} events={[allDay, timed]} cur={day} />);
    expect(capturedDayCellProps.at(-1)?.events.map((event) => event.title)).toEqual(["All day", "Timed"]);
  });
});
