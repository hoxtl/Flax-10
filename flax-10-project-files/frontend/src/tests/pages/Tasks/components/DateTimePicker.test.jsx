/* Tests for DateTimePicker component rendering and user interactions */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DateTimePicker from "../../../../pages/Tasks/components/DateTimePicker";

const hookMock = vi.hoisted(() => vi.fn());

vi.mock("../../../../pages/Tasks/hooks/useDateTimePicker", () => ({
  default: hookMock,
}));

function state(overrides = {}) {
  return {
    open: false,
    setOpen: vi.fn(),
    selDate: new Date("2026-03-08T12:30"),
    timeOnly: false,
    clearSelection: vi.fn(),
    ref: { current: null },
    dropdownPos: { top: 0, left: 0 },
    viewM: 2,
    viewY: 2026,
    prevMonth: vi.fn(),
    nextMonth: vi.fn(),
    days: [1, 2, 3],
    isToday: () => false,
    isSel: () => false,
    selectDay: vi.fn(),
    hour: 12,
    minute: 30,
    changeHour: vi.fn(),
    changeMinute: vi.fn(),
    ...overrides,
  };
}

describe("DateTimePicker", () => {
  it("opens and clears selection", () => {
    const s = state();
    hookMock.mockReturnValue(s);
    render(<DateTimePicker value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByText("✕"));
    expect(s.setOpen).toHaveBeenCalled();
    expect(s.clearSelection).toHaveBeenCalled();
  });

  it("renders calendar and time controls when open", () => {
    hookMock.mockReturnValue(state({ open: true, timeOnly: false }));
    render(<DateTimePicker value="" onChange={vi.fn()} />);
    expect(screen.getByText("March 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Done/i })).toBeInTheDocument();
  });
});
