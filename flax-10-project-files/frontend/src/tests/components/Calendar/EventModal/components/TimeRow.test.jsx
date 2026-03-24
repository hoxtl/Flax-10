import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../../../components/common/inputs/DateTimePicker", () => ({
  default: ({ dateOnly, onChange, placeholder, value }) => (
    <button type="button" data-date-only={String(!!dateOnly)} onClick={() => onChange("2026-05-10T09:30:00.000Z")}>
      {`${placeholder}:${value}`}
    </button>
  ),
}));

vi.mock("../../../../../components/common/AnimatedDropdown", () => ({
  default: ({ onChange, value }) => (
    <button type="button" onClick={() => onChange("monthly")}>
      {value}
    </button>
  ),
}));

import { TimeRow } from "../../../../../components/Calendar/EventModal/components/TimeRow";

describe("TimeRow", () => {
  it("renders date-time inputs when the event is not all-day and updates recurrence", () => {
    const setForm = vi.fn();
    const update = vi.fn(() => vi.fn());
    const onRecurrenceChange = vi.fn();

    render(
      <TimeRow
        form={{ all_day: false, end_time: "2026-05-10T10:30:00.000Z", start_time: "2026-05-10T09:30:00.000Z" }}
        recurrenceValue={{ frequency: "none" }}
        onRecurrenceChange={onRecurrenceChange}
        setForm={setForm}
        update={update}
      />,
    );

    fireEvent.click(screen.getByText(/none/i));
    expect(onRecurrenceChange).toHaveBeenCalledWith({ frequency: "monthly" });
    expect(screen.getAllByRole("button").slice(0, 2).every((button) => button.dataset.dateOnly === "false")).toBe(true);
  });

  it("renders date-only inputs and toggles all-day mode", () => {
    const setForm = vi.fn();
    const update = vi.fn(() => vi.fn());

    render(
      <TimeRow
        form={{ all_day: true, end_time: "2026-05-10", start_time: "2026-05-09" }}
        recurrenceValue={{ frequency: "daily" }}
        onRecurrenceChange={vi.fn()}
        setForm={setForm}
        update={update}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    const allDayUpdater = setForm.mock.calls[0][0];
    expect(allDayUpdater({ all_day: true }).all_day).toBe(false);
    expect(screen.getAllByRole("button").slice(0, 2).every((button) => button.dataset.dateOnly === "true")).toBe(true);
  });
});
